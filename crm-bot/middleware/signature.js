const crypto = require('crypto');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

function verifySignature(req, res, next) {
  const appSecret = getConfig('META_APP_SECRET');
  if (!appSecret) {
    logger.warn('META_APP_SECRET not set — skipping signature verification');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    logger.error('Missing X-Hub-Signature-256 header');
    return res.status(401).send('Missing signature');
  }

  const body = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
  const expected = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const received = signature.replace('sha256=', '');

  if (expected !== received) {
    logger.error('Invalid X-Hub-Signature-256 — possible spoof');
    return res.status(401).send('Invalid signature');
  }

  next();
}

module.exports = { verifySignature };
