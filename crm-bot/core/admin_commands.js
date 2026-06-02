const { appendToSheet } = require('./order_manager');
const logger = require('../utils/logger');

async function updateSheet(sheetName, rowId, column, value) {
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:Z`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return 'Sheet is empty';

  const headers = rows[0];
  const idCol = headers.indexOf('id');
  const valCol = headers.indexOf(column);
  if (idCol === -1 || valCol === -1) return 'Column not found';

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === rowId) {
      const range = `${sheetName}!${String.fromCharCode(65 + valCol)}${i + 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [[value]] },
      });
      return `Updated ${rowId} ${column} = ${value}`;
    }
  }
  return 'ID not found';
}

const ADMIN_COMMANDS = {
  'تحديث سعر': async (args) => {
    const [productId, newPrice] = args;
    const msg = await updateSheet('products', productId, 'price_dzd', newPrice);
    return msg.includes('Updated') ? `✅ تم تحديث سعر ${productId} إلى ${newPrice} دج` : msg;
  },

  'منتج جديد': async (args) => {
    const name = args[0];
    const price = args[1];
    const stock = args[2] || '10';
    const id = `P${Date.now().toString().slice(-3)}`;
    await appendToSheet('products', { id, name_ar: name, price_dzd: price, stock, active: 'true' });
    return `✅ تمت إضافة ${name} بسعر ${price} دج`;
  },

  'تحديث شحن': async (args) => {
    const [zone, newPrice] = args;
    const msg = await updateSheet('shipping_zones', zone, 'price', newPrice);
    return msg.includes('Updated') ? `✅ تم تحديث شحن ${zone} إلى ${newPrice} دج` : msg;
  },

  'إيقاف منتج': async (args) => {
    const [productId] = args;
    const msg = await updateSheet('products', productId, 'active', 'false');
    return msg.includes('Updated') ? `⛔ تم إيقاف ${productId}` : msg;
  },

  'تقرير اليوم': async () => {
    return '📊 تقارير الطلبات قريباً في الإصدار القادم';
  },
};

async function handleAdminCommand(text) {
  for (const [prefix, handler] of Object.entries(ADMIN_COMMANDS)) {
    if (text.startsWith(prefix)) {
      const args = text.slice(prefix.length).trim().split(' ').filter(Boolean);
      return await handler(args);
    }
  }
  return null;
}

module.exports = { handleAdminCommand, ADMIN_COMMANDS };
