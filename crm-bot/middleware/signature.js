const crypto = require('crypto');
const { getConfig } = require('../core/config_store');
const logger = require('../utils/logger');

// In-memory buffer of recent webhook requests (for diagnostics)
const recentWebhooks = [];
const MAX_RECENT = 30;

function recordWebhook(req, status, reason) {
  recentWebhooks.push({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    signature: req.headers['x-hub-signature-256'] ? 'present' : 'missing',
    bodySize: req.rawBody?.length || 0,
    status,
    reason,
    preview: req.rawBody ? req.rawBody.toString('utf8').slice(0, 200) : null,
  });
  if (recentWebhooks.length > MAX_RECENT) recentWebhooks.shift();
}

function getRecentWebhooks() {
  return [...recentWebhooks].reverse();
}

function verifySignature(req, res, next) {
  const appSecret = getConfig('META_APP_SECRET');
  if (!appSecret) {
    logger.warn('META_APP_SECRET not set — skipping signature verification');
    recordWebhook(req, 200, 'no_secret_configured');
    return next();
  }

  // Diagnostic: log secret being used (first 4 chars only, for debugging)
  logger.debug(`verifySignature using secret starting with: ${appSecret.slice(0, 4)}...`);

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    logger.error('Missing X-Hub-Signature-256 header');
    recordWebhook(req, 401, 'missing_signature_header');
    return res.status(401).send('Missing signature');
  }

  // IMPORTANT: use req.rawBody when available (raw bytes from express.json verify hook)
  // Otherwise fall back to re-serializing parsed body (may differ due to key order)
  const rawBuf = req.rawBody && req.rawBody.length > 0
    ? req.rawBody
    : Buffer.from(JSON.stringify(req.body || {}));

  const expected = crypto.createHmac('sha256', appSecret).update(rawBuf).digest('hex');
  const received = signature.replace('sha256=', '');

  if (expected !== received) {
    // Detailed diagnostic (only first 8 chars of expected, not full secret leaked)
    logger.error(
      `Invalid X-Hub-Signature-256 — ` +
      `received=${received.slice(0,8)}... expected=${expected.slice(0,8)}... ` +
      `body_len=${rawBuf.length} has_rawBody=${!!req.rawBody?.length}`
    );
    // Log first 100 chars of raw body for debugging (do NOT log full body in production)
    logger.error(`Body preview: ${rawBuf.toString('utf8').slice(0, 100)}`);
    logger.error(
      `App Secret in use: first4='${appSecret.slice(0,4)}' len=${appSecret.length} ` +
      `source=${process.env.META_APP_SECRET === appSecret ? '.env' : '(overridden)'}`
    );
    recordWebhook(req, 401, `signature_mismatch:received=${received.slice(0,8)},expected=${expected.slice(0,8)},secret_first4=${appSecret.slice(0,4)}`);
    return res.status(401).send('Invalid signature');
  }

  recordWebhook(req, 200, 'signature_valid');
  next();
}

module.exports = { verifySignature, getRecentWebhooks };
