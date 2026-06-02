const express = require('express');
const { processMessage } = require('../core/message_processor');
const { handleAdminCommand } = require('../core/admin_commands');
const { findAccountByVerifyToken } = require('../core/whatsapp_store');
const { verifySignature } = require('../middleware/signature');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');
const { sendReply } = require('../utils/whatsapp');
const sse = require('../utils/sse');

const router = express.Router();

// GET — Meta webhook verification
router.get('/', async (req, res) => {
  try {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Try to find an account matching this verify_token
    const account = await findAccountByVerifyToken(token);
    if (account) {
      logger.info(`WhatsApp webhook verified for account ${account.id}`);
      return res.send(challenge);
    }

    // Fallback to env var for backward compat
    const fbVerifyToken = getConfig('FB_VERIFY_TOKEN');
    if (fbVerifyToken && token === fbVerifyToken) {
      return res.send(challenge);
    }

    logger.warn(`Webhook verify failed — no account matches token. Received token: "${token}", expected FB_VERIFY_TOKEN: "${fbVerifyToken}"`);
    res.sendStatus(403);
  } catch (err) {
    logger.error(`Webhook verify error: ${err.message}`);
    res.sendStatus(500);
  }
});

// POST — Inbound messages (with signature verification)
router.post('/', verifySignature, async (req, res) => {
  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const phone = msg.from;
    const text = msg.text?.body || '';
    const adminPhone = process.env.ADMIN_PHONE;
    
    // Extract contact profile name
    const contact = req.body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
    const userName = contact?.profile?.name || '';

    logger.info(`WhatsApp from ${phone} (${userName || 'No Name'}): ${text.slice(0, 80)}`);

    if (adminPhone && phone === adminPhone) {
      const adminReply = await handleAdminCommand(text);
      if (adminReply) {
        await sendReply(phone, adminReply);
        return res.sendStatus(200);
      }
    }

    const reply = await processMessage({ platform: 'whatsapp', userId: phone, text, userName });
    if (reply) {
      await sendReply(phone, reply);
    }

    // Broadcast the update via SSE
    sse.broadcastUpdate('conversation_updated', { platform: 'whatsapp', platformId: phone });

    res.sendStatus(200);
  } catch (err) {
    logger.error(`WhatsApp Webhook Error: ${err.message}`);
    res.sendStatus(200); // Respond with 200 to prevent Meta from retrying indefinitely on application-level error
  }
});

// Also mount at /api/whatsapp/webhook for the Meta-expected path
router.get('/webhook', (req, res) => router.handle(req, res));
router.post('/webhook', verifySignature, (req, res) => router.handle(req, res));

module.exports = router;
