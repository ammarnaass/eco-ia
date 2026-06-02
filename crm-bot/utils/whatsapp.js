const { getDefaultAccount } = require('../core/whatsapp_store');
const logger = require('./logger');

async function sendReply(to, text) {
  if (process.env.MOCK_WHATSAPP === 'true') {
    logger.info(`[MOCK WHATSAPP] Sending reply to ${to}: ${text}`);
    return true;
  }
  const account = await getDefaultAccount();
  const token = account ? account.access_token : process.env.WHATSAPP_TOKEN;
  const phoneId = account ? account.phone_number_id : process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    logger.warn('Cannot send WhatsApp reply — no account configured');
    return false;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    const body = await res.json();
    if (!res.ok) {
      logger.error(`Graph API Error: ${JSON.stringify(body)}`);
      return false;
    }
    logger.info(`WhatsApp reply sent to ${to}`);
    return true;
  } catch (e) {
    logger.error(`Error sending WhatsApp reply: ${e.message}`);
    return false;
  }
}

async function sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
  if (process.env.MOCK_WHATSAPP === 'true') {
    logger.info(`[MOCK WHATSAPP] Sending template "${templateName}" (${languageCode}) to ${to}`);
    return true;
  }
  const account = await getDefaultAccount();
  const token = account ? account.access_token : process.env.WHATSAPP_TOKEN;
  const phoneId = account ? account.phone_number_id : process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    logger.warn('Cannot send WhatsApp template — no account configured');
    return false;
  }
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };
    if (components && components.length > 0) {
      payload.template.components = components;
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      logger.error(`Graph API Template Error: ${JSON.stringify(body)}`);
      return false;
    }
    logger.info(`WhatsApp template "${templateName}" sent to ${to}`);
    return true;
  } catch (e) {
    logger.error(`Error sending WhatsApp template: ${e.message}`);
    return false;
  }
}

module.exports = { sendReply, sendTemplate };
