const express = require('express');
const { processMessage } = require('../core/message_processor');
const { verifySignature } = require('../middleware/signature');
const { sendInstagramReply } = require('../utils/meta');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
//  Instagram Webhook Events Reference (Meta Graph API v25.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// All events arrive under entry.messaging[] with `recipient.id` = our IGID.
//
// Event types (per Meta docs):
//   • messages         — text/media/reply/postback/echo/unsupported/share
//   • message_reactions — react / unreact with emoji
//   • messaging_postbacks — quick_reply / icebreaker / button
//   • messaging_seen    — read receipts
//   • messaging_referral — ad CTD / ig.me link / story mention / shop
//   • standby          — when another app is the active handler
//
// Message attachment types: image, video, audio, file, share,
//                          story_mention, ig_reel, reel, ephemeral
//
// Required permissions (Meta App Review):
//   instagram_basic, instagram_manage_messages, pages_manage_metadata
// ═══════════════════════════════════════════════════════════════════════════

// ── GET — Meta webhook verification for Instagram ──────────────────────────
router.get('/', (req, res) => {
  const token = getConfig('FB_VERIFY_TOKEN', 'my_secret_token');
  // Meta may send both hub.verify_token (dot) and hub_verify_token (underscore)
  const receivedToken = req.query['hub.verify_token'] || req.query.hub_verify_token;
  const challenge = req.query['hub.challenge'] || req.query.hub_challenge;

  logger.info(`Instagram webhook verify attempt | received="${receivedToken}" expected="${token}" challenge="${challenge}" query_keys=${Object.keys(req.query).join(',')}`);

  if (!receivedToken) {
    logger.warn(`Instagram webhook verify: missing hub.verify_token (mode=${req.query['hub.mode'] || req.query.hub_mode || 'n/a'})`);
    return res.status(400).send('Missing hub.verify_token');
  }
  if (receivedToken !== token) {
    logger.warn(`Instagram webhook verify FAILED — received "${receivedToken}" but expected "${token}"`);
    return res.status(403).send('Forbidden: verify_token mismatch');
  }
  if (!challenge) {
    return res.status(400).send('Missing hub.challenge');
  }

  logger.info(`Instagram webhook verified ✓ (challenge=${challenge})`);
  res.status(200).send(challenge);
});

// ── Helpers ────────────────────────────────────────────────────────────────
function summarizeAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  return attachments.map(a => {
    if (a.type === 'ephemeral') return { type: 'ephemeral', note: 'view-once media (no URL)' };
    return { type: a.type, url: a.payload?.url || null };
  });
}

function buildMessageText(msg, evt) {
  // 1) Quick reply payload takes priority
  if (msg.quick_reply?.payload) {
    return { text: msg.quick_reply.payload, source: 'quick_reply' };
  }
  // 2) Plain text
  if (msg.text) {
    return { text: msg.text, source: 'text' };
  }
  // 3) Attachments (describe them)
  if (Array.isArray(msg.attachments) && msg.attachments.length) {
    const types = msg.attachments.map(a => a.type).join(', ');
    return { text: `[${types}]`, source: 'attachment' };
  }
  // 4) Referral context (when no text/attachment)
  if (evt.referral?.source) {
    const ref = evt.referral;
    const ctx = ref.ad_id ? `ad=${ref.ad_id}` :
                ref.product?.id ? `product=${ref.product.id}` :
                ref.ref ? `ref=${ref.ref}` : '';
    return { text: `[referral: ${ref.source}${ctx ? ` (${ctx})` : ''}]`, source: 'referral' };
  }
  return null;
}

// ── POST — Instagram events webhook ─────────────────────────────────────────
router.post('/', verifySignature, async (req, res) => {
  const body = req.body;
  const eventType = body?.object || 'unknown';
  const entryCount = body?.entry?.length || 0;

  // Log every webhook attempt (full diagnostic)
  logger.info(`📥 Instagram webhook received | object=${eventType} | entries=${entryCount} | size=${JSON.stringify(body).length}b`);

  if (body.object !== 'instagram') {
    logger.warn(`Instagram webhook: object="${eventType}" (expected "instagram") — ignoring (200 OK anyway)`);
    // Return 200 to prevent Meta from retrying on payload mismatch
    return res.status(200).send('OK');
  }

  const dmReplyEnabled      = getConfig('INSTAGRAM_DM_REPLY', 'true')       !== 'false';
  const commentReplyEnabled = getConfig('INSTAGRAM_COMMENT_REPLY', 'true') !== 'false';
  logger.info(`Instagram settings: DM=${dmReplyEnabled} Comments=${commentReplyEnabled}`);

  let processedCount = 0;
  let errorCount = 0;

  for (const entry of body.entry) {
    const entryId = entry.id || 'unknown';

    // ── A) Comments (via changes[]) ──────────────────────────────────
    const commentChange = entry.changes?.find(c => c.field === 'comments');
    if (commentChange?.value?.text) {
      const cv = commentChange.value;
      const from = cv.from?.id;
      const text = cv.text;
      const mediaId = cv.media?.id;
      logger.info(`💬 Instagram COMMENT | entry=${entryId} | from=${from} | media=${mediaId} | text="${text.slice(0, 80)}"`);
      if (commentReplyEnabled) {
        try {
          const reply = await processMessage({ platform: 'instagram', userId: from, text, userName: cv.from?.username || 'Commenter' });
          if (reply) await sendInstagramReply(from, `مرحباً! رأيت تعليقك 😊 ${reply}`);
          processedCount++;
        } catch (e) {
          errorCount++;
          logger.error(`Instagram comment handler error: ${e.message}`);
        }
      } else {
        logger.info(`Instagram comment ignored (INSTAGRAM_COMMENT_REPLY=false)`);
      }
    }

    // ── B) Live comments (live_comments field) ───────────────────────
    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (change.field === 'live_comments' && change.value?.id) {
          logger.info(`🔴 Instagram LIVE COMMENT | entry=${entryId} | comment_id=${change.value.id} | message="${(change.value.message || '').slice(0, 80)}"`);
          // Live comments: not handled yet, just log
        }
      }
    }

    // ── C) Messaging events ──────────────────────────────────────────
    if (!entry.messaging || !Array.isArray(entry.messaging)) continue;

    for (const evt of entry.messaging) {
      const senderId = evt.sender?.id;
      const recipientId = evt.recipient?.id;
      const timestamp = evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString();

      try {
        // 1) ECHO — our own outgoing messages (skip)
        if (evt.message?.is_echo) {
          logger.info(`↩️ Instagram ECHO (we sent) | to=${recipientId} | mid=${evt.message?.mid} | text="${(evt.message?.text || '').slice(0, 60)}"`);
          continue;
        }

        // 2) MESSAGE_REACTIONS — react/unreact with emoji
        if (evt.reaction) {
          const r = evt.reaction;
          logger.info(`❤️ Instagram REACTION | from=${senderId} | mid=${r.mid} | action=${r.action} | ${r.reaction || r.emoji || ''}`);
          // Log to conversation history (optional)
          // For now, no AI reply — just log
          continue;
        }

        // 3) MESSAGING_SEEN — read receipts
        if (evt.read) {
          logger.info(`👁️ Instagram READ | by=${senderId} | mid=${evt.read.mid} | watermark=${evt.read.watermark}`);
          continue;
        }

        // 4) MESSAGING_REFERRAL — ad CTD / ig.me / story mention / shop
        if (evt.referral && !evt.message) {
          const ref = evt.referral;
          const refInfo = `type=${ref.type || 'unknown'} source=${ref.source || 'unknown'}` +
                          (ref.ad_id ? ` ad_id=${ref.ad_id}` : '') +
                          (ref.product?.id ? ` product=${ref.product.id}` : '') +
                          (ref.ref ? ` ref=${ref.ref}` : '');
          logger.info(`🔗 Instagram REFERRAL (no message) | from=${senderId} | ${refInfo}`);
          continue;
        }

        // 5) MESSAGING_POSTBACKS — quick_reply / icebreaker / button
        if (evt.postback) {
          const pb = evt.postback;
          const payload = pb.payload || pb.title || '';
          logger.info(`🔘 Instagram POSTBACK | from=${senderId} | mid=${pb.mid} | title="${(pb.title || '').slice(0, 50)}" | payload="${payload.slice(0, 80)}"`);
          if (dmReplyEnabled && payload) {
            const reply = await processMessage({ platform: 'instagram', userId: senderId, text: payload });
            if (reply) await sendInstagramReply(senderId, reply);
            processedCount++;
          }
          continue;
        }

        // 6) STANDBY — another app handles this conversation
        if (evt.standby) {
          logger.info(`⏸️ Instagram STANDBY | sender=${senderId} (another app handles this)`);
          continue;
        }

        // 7) Process the actual message
        const msg = evt.message;
        if (!msg) {
          logger.debug(`Instagram event with no message and no postback/reaction/read/standby — ignoring`);
          continue;
        }

        // 7a) Deleted message
        if (msg.is_deleted) {
          logger.info(`🗑️ Instagram MESSAGE DELETED | from=${senderId} | mid=${msg.mid}`);
          continue;
        }

        // 7b) Unsupported message (GIF, sticker, etc.)
        if (msg.is_unsupported) {
          logger.warn(`⚠️ Instagram UNSUPPORTED MESSAGE | from=${senderId} | mid=${msg.mid} (GIF/sticker — not supported by Meta)`);
          continue;
        }

        // 7c) Build text representation
        const messageContent = buildMessageText(msg, evt);
        if (!messageContent) {
          logger.debug(`Instagram message with no text/attachment/referral — ignoring`);
          continue;
        }

        // 7d) Quick reply payload vs text
        let userText = messageContent.text;
        if (msg.quick_reply?.payload) {
          userText = msg.quick_reply.payload;
        }

        // 7e) Referral context: append to text
        if (evt.referral?.source && !msg.text && !msg.quick_reply?.payload) {
          const refInfo = evt.referral.ad_id ? ` (ad=${evt.referral.ad_id})` :
                          evt.referral.product?.id ? ` (product=${evt.referral.product.id})` : '';
          userText = `[من ${evt.referral.source}${refInfo}]`;
        }

        // 7f) Inline reply (reply_to.mid) — context
        let replyContext = '';
        if (msg.reply_to?.mid) {
          replyContext = `[رد على ${msg.reply_to.mid}] `;
        } else if (msg.reply_to?.story?.id) {
          replyContext = `[رد على Story ${msg.reply_to.story.id}] `;
        }

        // 7g) Attachments
        const attachments = summarizeAttachments(msg.attachments);

        // 7h) Build final log line
        const attachmentStr = attachments ? `[${attachments.map(a => a.type).join(',')}] ` : '';
        logger.info(
          `📨 Instagram MESSAGE | from=${senderId} | mid=${msg.mid} | ` +
          `source=${messageContent.source} | ` +
          `text="${userText.slice(0, 80)}" | ` +
          `attachments=${attachmentStr || 'none'} | ` +
          `context=${replyContext || 'none'}`
        );

        if (!dmReplyEnabled) {
          logger.info(`Instagram DM ignored (INSTAGRAM_DM_REPLY=false)`);
          continue;
        }

        // 7i) Process with AI
        const reply = await processMessage({
          platform: 'instagram',
          userId: senderId,
          text: userText,
        });
        if (reply) {
          await sendInstagramReply(senderId, reply);
          processedCount++;
        }
      } catch (e) {
        errorCount++;
        logger.error(`Instagram event handler error: ${e.message}`);
      }
    }
  }

  logger.info(`✅ Instagram webhook done | processed=${processedCount} errors=${errorCount}`);
  // Return 200 even on partial errors to prevent Meta from retrying
  res.sendStatus(200);
});

module.exports = router;
