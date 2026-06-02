const express = require('express');
const { processMessage } = require('../core/message_processor');
const { verifySignature } = require('../middleware/signature');
const { sendFacebookReply } = require('../utils/meta');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  const token = getConfig('FB_VERIFY_TOKEN', 'my_secret_token');
  const receivedToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!receivedToken) {
    logger.warn(`Facebook webhook: missing hub.verify_token`);
    return res.status(400).send('Missing hub.verify_token');
  }

  if (receivedToken !== token) {
    logger.warn(`Facebook webhook verify FAILED — received "${receivedToken}" but expected "${token}"`);
    return res.status(403).send('Forbidden: verify_token mismatch');
  }

  if (!challenge) {
    return res.status(400).send('Missing hub.challenge');
  }

  logger.info(`Facebook webhook verified ✓ (challenge=${challenge})`);
  res.status(200).send(challenge);
});

router.post('/', verifySignature, async (req, res) => {
  const body = req.body;
  if (body.object !== 'page') return res.sendStatus(404);

  for (const entry of body.entry) {
    const event = entry.messaging?.[0];
    if (event?.message?.text) {
      const senderId = event.sender.id;
      logger.info(`Facebook from ${senderId}: ${event.message.text.slice(0, 80)}`);
      const reply = await processMessage({ platform: 'facebook', userId: senderId, text: event.message.text });
      if (reply) {
        await sendFacebookReply(senderId, reply);
      }
    }
  }
  res.status(200).send('EVENT_RECEIVED');
});

module.exports = router;
