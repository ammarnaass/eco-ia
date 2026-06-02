const express = require('express');
const { processMessage } = require('../core/message_processor');
const { verifySignature } = require('../middleware/signature');
const { sendInstagramReply } = require('../utils/meta');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

const router = express.Router();

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

// POST — Instagram messages webhook
router.post('/', verifySignature, async (req, res) => {
  const body = req.body;
  if (body.object !== 'instagram') return res.sendStatus(404);

  const dmReplyEnabled = getConfig('INSTAGRAM_DM_REPLY', 'true') !== 'false';
  const commentReplyEnabled = getConfig('INSTAGRAM_COMMENT_REPLY', 'true') !== 'false';

  for (const entry of body.entry) {
    const dm = entry.messaging?.[0];
    if (dmReplyEnabled && dm?.message?.text) {
      logger.info(`Instagram DM from ${dm.sender.id}: ${dm.message.text.slice(0, 80)}`);
      const reply = await processMessage({ platform: 'instagram', userId: dm.sender.id, text: dm.message.text });
      if (reply) {
        await sendInstagramReply(dm.sender.id, reply);
      }
    }

    const comment = entry.changes?.find(c => c.field === 'comments');
    if (commentReplyEnabled && comment?.value?.text) {
      logger.info(`Instagram comment from ${comment.value.from.id}: ${comment.value.text.slice(0, 80)}`);
      const reply = await processMessage({ platform: 'instagram', userId: comment.value.from.id, text: comment.value.text });
      if (reply) {
        await sendInstagramReply(comment.value.from.id, `مرحباً! رأيت تعليقك 😊 ${reply}`);
      }
    }
  }
  res.sendStatus(200);
});

module.exports = router;
