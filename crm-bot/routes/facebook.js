const express = require('express');
const { processMessage } = require('../core/message_processor');
const { verifySignature } = require('../middleware/signature');
const { sendFacebookReply } = require('../utils/meta');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  const token = getConfig('FB_VERIFY_TOKEN', 'my_secret_token');
  if (req.query['hub.verify_token'] === token) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
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
