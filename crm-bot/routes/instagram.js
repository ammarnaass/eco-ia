const express = require('express');
const { processMessage } = require('../core/message_processor');
const { verifySignature } = require('../middleware/signature');
const { sendInstagramReply } = require('../utils/meta');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

const router = express.Router();

// ── Instagram Webhook Events Reference ─────────────────────────────────────
//
// All events arrive under entry.messaging[] with `recipient.id` = our IGID.
// Event types handled here:
//   • message   — text/media/reactions/reply/postback/seen/referral/echo/unsupported
//   • reaction  — message_reactions
//   • postback  — quick_reply / icebreaker / generic_template button
//   • read      — messaging_seen
//   • referral  — messaging_referral (ig.me, ad CTD, story mention)
//   • standby   — when app is NOT the active handler for the conversation
//
// Permissions required (Meta App Review):
//   instagram_basic
//   instagram_manage_messages
//   pages_manage_metadata
//
// ────────────────────────────────────────────────────────────────────────

// GET — Meta webhook verification for Instagram
router.get('/', (req, res) => {
  const token = getConfig('FB_VERIFY_TOKEN', 'my_secret_token');
  const receivedToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!receivedToken) {
    logger.warn(`Instagram webhook: missing hub.verify_token (mode=${req.query['hub.mode'] || 'n/a'})`);
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

// POST — Instagram events webhook
router.post('/', verifySignature, async (req, res) => {
  const body = req.body;
  if (body.object !== 'instagram') return res.sendStatus(404);

  const dmReplyEnabled    = getConfig('INSTAGRAM_DM_REPLY', 'true')       !== 'false';
  const commentReplyEnabled = getConfig('INSTAGRAM_COMMENT_REPLY', 'true') !== 'false';

  for (const entry of body.entry) {
    // ── A) Comments (via changes[]) ────────────────────────────────
    const comment = entry.changes?.find(c => c.field === 'comments');
    if (commentReplyEnabled && comment?.value?.text) {
      try {
        const from = comment.value.from?.id;
        const text = comment.value.text;
        logger.info(`Instagram comment from ${from}: ${text.slice(0, 80)}`);
        const reply = await processMessage({ platform: 'instagram', userId: from, text });
        if (reply) await sendInstagramReply(from, `مرحباً! رأيت تعليقك 😊 ${reply}`);
      } catch (e) {
        logger.error(`Instagram comment handler error: ${e.message}`);
      }
    }

    // ── B) Messaging events ───────────────────────────────────────
    if (!entry.messaging || !Array.isArray(entry.messaging)) continue;
    for (const evt of entry.messaging) {
      try {
        const senderId = evt.sender?.id;
        const recipientId = evt.recipient?.id;
        const isEcho = evt.message?.is_echo === true;
        const timestamp = evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString();

        // 1) Skip our own outgoing messages
        if (isEcho) {
          logger.debug(`Instagram echo (sent by us) ignored: mid=${evt.message?.mid}`);
          continue;
        }

        // 2) message_reactions — react / unreact with emoji
        if (evt.reaction) {
          logger.info(`Instagram reaction from ${senderId}: ${evt.reaction.action} ${evt.reaction.reaction || evt.reaction.emoji || ''} (mid=${evt.reaction.mid})`);
          // No auto-reply; just log. We could send a thank-you DM later.
          continue;
        }

        // 3) messaging_seen — read receipt
        if (evt.read) {
          logger.info(`Instagram read by ${senderId} (mid=${evt.read.mid})`);
          continue;
        }

        // 4) messaging_referral — ad CTD / ig.me link / story mention / shop
        if (evt.referral) {
          const ref = evt.referral;
          const refType = ref.type || 'unknown';
          const refSrc = ref.source || 'unknown';
          const product = ref.product?.id ? ` (product=${ref.product.id})` : '';
          const adInfo = ref.ad_id ? ` (ad_id=${ref.ad_id})` : '';
          logger.info(`Instagram referral from ${senderId}: type=${refType} source=${refSrc}${product}${adInfo}`);
          // Fall through to treat as initial message if no text
        }

        // 5) messaging_postbacks — quick_reply / icebreaker / button
        if (evt.postback) {
          const payload = evt.postback.payload || evt.postback.title || '';
          logger.info(`Instagram postback from ${senderId}: "${payload}" (mid=${evt.postback.mid})`);
          if (dmReplyEnabled && payload) {
            const reply = await processMessage({ platform: 'instagram', userId: senderId, text: payload });
            if (reply) await sendInstagramReply(senderId, reply);
          }
          continue;
        }

        // 6) Skip unsupported message types
        if (evt.message?.is_unsupported) {
          logger.warn(`Instagram unsupported message from ${senderId} (mid=${evt.message.mid})`);
          continue;
        }

        // 7) Skip if message was deleted
        if (evt.message?.is_deleted) {
          logger.info(`Instagram message deleted by ${senderId} (mid=${evt.message.mid})`);
          continue;
        }

        // 8) Standby — another app handles this conversation
        if (evt.standby) {
          logger.debug(`Instagram standby (other app handles this) — sender=${senderId}`);
          continue;
        }

        // 9) Process the actual text/media message
        const msg = evt.message;
        if (!msg) continue;

        // Build a usable text — if text is missing but attachments exist, describe them
        let text = msg.text || '';
        if (!text && Array.isArray(msg.attachments) && msg.attachments.length) {
          const types = msg.attachments.map(a => a.type).join(', ');
          text = `[${types}]`;
        }
        // Append referral context if present and no explicit text
        if (!msg.text && evt.referral?.source) {
          text += ` (referral: ${evt.referral.source})`;
        }

        if (!text) continue;

        // Quick reply payload takes precedence over text
        const userText = msg.quick_reply?.payload || text;

        if (!dmReplyEnabled) {
          logger.info(`Instagram DM from ${senderId}: ${userText.slice(0, 80)} [AI reply disabled]`);
          continue;
        }

        logger.info(`Instagram DM from ${senderId} (mid=${msg.mid}): ${userText.slice(0, 80)}`);
        const reply = await processMessage({ platform: 'instagram', userId: senderId, text: userText });
        if (reply) await sendInstagramReply(senderId, reply);
      } catch (e) {
        logger.error(`Instagram event handler error: ${e.message}`);
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;
