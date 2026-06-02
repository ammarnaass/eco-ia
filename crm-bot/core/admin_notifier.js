const logger = require('../utils/logger');
const { getDefaultAccount } = require('./whatsapp_store');

const budgets = new Map();

function checkBudget(cost) {
  const dailyLimit = parseFloat(process.env.DAILY_BUDGET_USD) || 10;
  const monthlyLimit = parseFloat(process.env.MONTHLY_BUDGET_USD) || 150;
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);

  budgets.set(today, (budgets.get(today) || 0) + cost);
  budgets.set(month, (budgets.get(month) || 0) + cost);

  const dailyTotal = budgets.get(today);
  const monthlyTotal = budgets.get(month);

  if (dailyTotal > dailyLimit) {
    logger.warn(`Daily budget exceeded: $${dailyTotal.toFixed(2)} > $${dailyLimit}`, { type: 'budget_alert', period: 'daily', total: dailyTotal });
    return { alert: true, message: `⚠️ تجاوزت الميزانية اليومية ($${dailyTotal.toFixed(2)})` };
  }
  if (monthlyTotal > monthlyLimit) {
    logger.warn(`Monthly budget exceeded: $${monthlyTotal.toFixed(2)} > $${monthlyLimit}`, { type: 'budget_alert', period: 'monthly', total: monthlyTotal });
    return { alert: true, message: `⚠️ تجاوزت الميزانية الشهرية ($${monthlyTotal.toFixed(2)})` };
  }
  return { alert: false };
}

async function notifyAdmin(type, data) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;

  let text = '';
  switch (type) {
    case 'NEW_ORDER':
      text = `🆕 طلب جديد!\n📋 رقم: ${data.order_id}\n👤 ${data.customer}\n💳 ${data.total} دج`;
      break;
    case 'BUDGET_ALERT':
      text = data.message;
      break;
    case 'ERROR':
      text = `⚠️ خطأ في النظام: ${data.message}`;
      break;
  }

  if (!text) return;
  const account = await getDefaultAccount();
  const token = account ? account.access_token : process.env.WHATSAPP_TOKEN;
  const phoneId = account ? account.phone_number_id : process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return;

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: adminPhone, type: 'text', text: { body: text } }),
    });
    logger.info(`Admin notified: ${type}`, { adminPhone, type });
  } catch (err) {
    logger.error(`Admin notify failed: ${err.message}`, { type });
  }
}

module.exports = { checkBudget, notifyAdmin };
