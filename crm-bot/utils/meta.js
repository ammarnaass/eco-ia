const { getConfig } = require('../core/config_store');
const logger = require('./logger');

/**
 * Send a Facebook Messenger text reply to a user (PSID)
 * @param {string} to Recipient Facebook Page-Scoped ID
 * @param {string} text The message body text
 * @returns {Promise<boolean>} Success state
 */
async function sendFacebookReply(to, text) {
  if (process.env.MOCK_META === 'true') {
    logger.info(`[MOCK FB] Sending reply to ${to}: ${text}`);
    return true;
  }
  const token = getConfig('FB_PAGE_TOKEN');
  if (!token) {
    logger.warn('Cannot send Facebook reply — FB_PAGE_TOKEN not configured');
    return false;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: to }, message: { text } }),
    });
    const body = await res.json();
    if (!res.ok) {
      logger.error(`Facebook Graph API Error: ${JSON.stringify(body)}`);
      return false;
    }
    logger.info(`Facebook reply sent to ${to}`);
    return true;
  } catch (e) {
    logger.error(`Error sending Facebook reply: ${e.message}`);
    return false;
  }
}

/**
 * Send an Instagram text reply or comment response to a user (Scoped User ID)
 * @param {string} to Recipient Instagram Scoped User ID
 * @param {string} text The message body text
 * @returns {Promise<boolean>} Success state
 */
async function sendInstagramReply(to, text) {
  if (process.env.MOCK_META === 'true') {
    logger.info(`[MOCK IG] Sending reply to ${to}: ${text}`);
    return true;
  }
  // Use dedicated Instagram token first, fall back to Facebook Page token
  const token = getConfig('INSTAGRAM_ACCESS_TOKEN') || getConfig('FB_PAGE_TOKEN');
  const igId = getConfig('INSTAGRAM_BUSINESS_ID');
  if (!token || !igId) {
    logger.warn('Cannot send Instagram reply — INSTAGRAM_ACCESS_TOKEN (or FB_PAGE_TOKEN) or INSTAGRAM_BUSINESS_ID not configured');
    return false;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${igId}/messages?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: to }, message: { text } }),
    });
    const body = await res.json();
    if (!res.ok) {
      logger.error(`Instagram Graph API Error: ${JSON.stringify(body)}`);
      return false;
    }
    logger.info(`Instagram reply sent to ${to}`);
    return true;
  } catch (e) {
    logger.error(`Error sending Instagram reply: ${e.message}`);
    return false;
  }
}

module.exports = { sendFacebookReply, sendInstagramReply };
