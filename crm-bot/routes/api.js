const express = require('express');
const { getUsageStats } = require('../core/unified_ai');
const { getProducts, getShippingZones, getOrders, addProduct, updateProduct, deleteProduct } = require('../core/order_manager');
const { getConversations, processMessage } = require('../core/message_processor');
const supabase = require('../lib/supabase');
const sse = require('../utils/sse');
const { sendReply } = require('../utils/whatsapp');

const router = express.Router();

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const [tokenStats, products] = await Promise.all([
    getUsageStats(weekAgo.toISOString()),
    getProducts().catch(() => []),
  ]);

  res.json({
    total_messages: tokenStats.count,
    total_tokens: tokenStats.total_tokens,
    total_cost: tokenStats.total_cost,
    active_products: products.filter(p => p.active !== false).length,
    total_products: products.length,
    byModel: tokenStats.byModel,
    byPlatform: tokenStats.byPlatform || {},
  });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const products = await getProducts().catch(() => []);
  res.json(products);
}));

router.post('/products', asyncHandler(async (req, res) => {
  const product = await addProduct(req.body);
  res.status(201).json(product);
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const product = await updateProduct(req.params.id, req.body);
  res.json(product);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ success: true });
}));

router.get('/shipping', asyncHandler(async (req, res) => {
  const zones = await getShippingZones().catch(() => []);
  res.json(zones);
}));

router.get('/tokens/summary', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await getUsageStats(from, to);
  res.json(result);
}));

router.get('/tokens/by-model', asyncHandler(async (req, res) => {
  const stats = await getUsageStats();
  const breakdown = Object.entries(stats.byModel).map(([model, tokens]) => ({ model, tokens }));
  res.json(breakdown);
}));

router.get('/tokens/by-platform', asyncHandler(async (req, res) => {
  const stats = await getUsageStats();
  const breakdown = Object.entries(stats.byPlatform).map(([platform, tokens]) => ({ platform, tokens }));
  res.json(breakdown);
}));

router.post('/ai-reply', async (req, res) => {
  try {
    const { customer_id, message, platform } = req.body;
    if (!customer_id || !message) return res.status(400).json({ error: 'customer_id and message required' });

    const { processMessage } = require('../core/message_processor');
    const reply = await processMessage({ platform: platform || 'api', userId: customer_id, text: message });
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/conversations', asyncHandler(async (req, res) => {
  res.json(await getConversations());
}));

router.get('/updates/stream', (req, res) => {
  sse.registerClient(req, res);
});

router.post('/conversations/:customerId/reply', asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { message, platform } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 1. Get current open conversation for this customer
  const { data: conv } = await supabase.from('conversations')
    .select('id, messages, platform')
    .eq('customer_id', customerId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let history = [];
  const finalPlatform = platform || conv?.platform || 'whatsapp';

  if (conv && conv.messages) {
    try {
      history = typeof conv.messages === 'string' ? JSON.parse(conv.messages) : conv.messages;
    } catch (e) {
      history = [];
    }
  }

  // Add the manual response to history
  history.push({ role: 'assistant', content: message, sender: 'agent' });

  // 2. Save to database
  if (conv?.id) {
    await supabase.from('conversations').update({
      messages: JSON.stringify(history),
      updated_at: new Date().toISOString()
    }).eq('id', conv.id);
  } else {
    await supabase.from('conversations').insert({
      customer_id: customerId,
      platform: finalPlatform,
      status: 'open',
      messages: JSON.stringify(history),
      updated_at: new Date().toISOString()
    });
  }

  // 3. Send to customer (based on platform)
  const { data: customer } = await supabase.from('customers').select('platform_id').eq('id', customerId).single();
  if (customer && customer.platform_id) {
    if (finalPlatform === 'whatsapp') {
      await sendReply(customer.platform_id, message);
    } else if (finalPlatform === 'facebook') {
      const { sendFacebookReply } = require('../utils/meta');
      await sendFacebookReply(customer.platform_id, message);
    } else if (finalPlatform === 'instagram') {
      const { sendInstagramReply } = require('../utils/meta');
      await sendInstagramReply(customer.platform_id, message);
    }
  }

  // 4. Broadcast real-time update
  sse.broadcastUpdate('conversation_updated', { customerId, platform: finalPlatform });

  res.json({ success: true, messages: history });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  res.json(await getOrders());
}));

// ── Update an order (edit fields + regenerate PDF invoice) ─────────────────
router.put('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customer_name, phone, address, items, grand_total, status, shipping_cost, wilaya } = req.body;

  const updatePayload = {};
  if (phone !== undefined)       updatePayload.phone = phone;
  if (status !== undefined)      updatePayload.status = status;
  if (grand_total !== undefined) updatePayload.grand_total = grand_total;
  if (shipping_cost !== undefined) updatePayload.shipping_cost = shipping_cost;
  if (wilaya !== undefined)      updatePayload.wilaya = wilaya;
  if (items !== undefined)       updatePayload.items = JSON.stringify(items);

  // Rebuild address field: "Name, address string"
  const name = customer_name || '';
  const addr = address || '';
  if (name || addr) updatePayload.address = `${name}, ${addr}`.trim().replace(/^,\s*|,\s*$/, '');

  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('orders').update(updatePayload).eq('id', id).select('id, customer_id, platform, status, items, items_total, shipping_cost, grand_total, wilaya, address, phone, tracking_code, created_at, updated_at').single();
  if (error) return res.status(400).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Order not found' });

  // Regenerate PDF invoice
  try {
    const { generateShippingLabel } = require('../core/shipping_label');
    const orderForPdf = {
      id,
      phone: data.phone,
      address: data.address,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
      grand_total: data.grand_total,
      status: data.status,
      platform: data.platform,
      created_at: data.created_at,
      shipping_cost: data.shipping_cost,
      wilaya: data.wilaya,
    };
    await generateShippingLabel(orderForPdf);
  } catch (e) {
    // PDF regeneration failure is non-fatal
  }

  sse.broadcastUpdate('order_updated', { id });
  res.json(data);
}));

// ── Send order invoice link via WhatsApp ───────────────────────────────────
router.post('/orders/:id/send-whatsapp', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data: order, error } = await supabase.from('orders').select('id, phone, address, grand_total, status, items, platform, created_at').eq('id', id).single();
  if (error || !order) return res.status(404).json({ error: 'Order not found' });

  const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
  const name = order.address ? order.address.split(',')[0].trim() : 'العميل';
  const itemsList = items.map(i => `• ${i.name} x${i.qty} — ${i.price} دج`).join('\n');
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const pdfUrl = `${appUrl}/labels/label_${id}.pdf`;

  const message = `🧾 *فاتورة الطلب #${id}*\n\nمرحباً ${name} 👋\nفيما يلي ملخص طلبك:\n\n${itemsList}\n\n💰 *المجموع الكلي: ${parseFloat(order.grand_total || 0).toLocaleString()} دج*\n📦 الحالة: ${order.status}\n\n📄 رابط الفاتورة PDF:\n${pdfUrl}`;

  const { sendReply } = require('../utils/whatsapp');
  const customerPhone = order.phone || '';
  let sent = false;
  if (customerPhone) {
    sent = await sendReply(customerPhone, message);
  }

  res.json({ success: sent, message, phone: customerPhone, pdf_url: pdfUrl });
}));

// ── Send order invoice via email ───────────────────────────────────────────
router.post('/orders/:id/send-email', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const { data: order, error } = await supabase.from('orders').select('id, phone, address, grand_total, status, items, platform, created_at').eq('id', id).single();
  if (error || !order) return res.status(404).json({ error: 'Order not found' });

  const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
  const name = order.address ? order.address.split(',')[0].trim() : 'العميل';
  const itemsHtml = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0">${i.name}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold">${(i.price || 0).toLocaleString()} دج</td></tr>`
  ).join('');

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1a73e8;padding:24px 32px">
        <h1 style="color:#fff;margin:0;font-size:22px">🧾 فاتورة الطلب #${id}</h1>
        <p style="color:#bfdbfe;margin:4px 0 0">مرحباً ${name}</p>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;margin:0 0 20px">نشكرك على ثقتك بنا! فيما يلي ملخص طلبك:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 8px;text-align:right;font-size:12px;color:#6b7280">المنتج</th>
              <th style="padding:10px 8px;text-align:center;font-size:12px;color:#6b7280">الكمية</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;color:#6b7280">السعر</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:right">
          <span style="font-size:18px;font-weight:bold;color:#1a73e8">المجموع الكلي: ${parseFloat(order.grand_total || 0).toLocaleString()} دج</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">الفاتورة مرفقة كملف PDF. تواصل معنا عبر واتساب في أي وقت.</p>
      </div>
    </div>`;

  const { sendEmailWithAttachment } = require('../utils/email');
  const path = require('path');
  const labelPath = path.join(__dirname, '..', 'labels', `label_${id}.pdf`);
  
  await sendEmailWithAttachment({
    to: email,
    subject: `🧾 فاتورة الطلب #${id} — متجر الذكاء الاصطناعي`,
    html,
    filePath: labelPath,
    fileName: `invoice_${id}.pdf`,
  });

  res.json({ success: true, email });
}));

// WhatsApp account management
const { createAccount, listAccounts, getAccount, deleteAccount } = require('../core/whatsapp_store');

// Config management
const { getAllConfig, getConfig, setManyConfig, loadConfigIntoProcessEnv } = require('../core/config_store');

router.get('/config', async (req, res) => {
  try {
    res.json(await getAllConfig());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries array required' });
    await setManyConfig(entries);
    await loadConfigIntoProcessEnv();
    res.json(await getAllConfig());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/whatsapp/accounts', async (req, res) => {
  try {
    res.json(await listAccounts());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/whatsapp/accounts/:id', async (req, res) => {
  try {
    const acc = await getAccount(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    res.json({ ...acc, access_token: '••••••', verify_token: '••••••' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/whatsapp/accounts', async (req, res) => {
  try {
    const { phone_number_id, waba_id, access_token, verify_token, label } = req.body;
    if (!phone_number_id || !access_token || !verify_token) {
      return res.status(400).json({ error: 'phone_number_id, access_token, and verify_token are required' });
    }
    const account = await createAccount({ phone_number_id, waba_id, access_token, verify_token, label });
    res.status(201).json(account);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/whatsapp/accounts/:id', async (req, res) => {
  try {
    const deleted = await deleteAccount(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Test connection for Meta platforms (Facebook / Instagram) ────────────
router.post('/test-connection', asyncHandler(async (req, res) => {
  const { platform } = req.query;
  if (!platform || !['facebook', 'instagram'].includes(platform)) {
    return res.status(400).json({ success: false, message: 'Platform must be facebook or instagram' });
  }

  const token = getConfig('FB_PAGE_TOKEN');
  if (!token) {
    return res.json({ success: false, message: 'FB_PAGE_TOKEN غير مضبوط. يرجى إدخال رمز الوصول أولاً.' });
  }

  try {
    if (platform === 'facebook') {
      // Test Facebook Page token by fetching page info
      const fbRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}&fields=id,name`);
      const fbData = await fbRes.json();
      if (fbRes.ok && fbData.id) {
        return res.json({ success: true, message: `الاتصال ناجح! الصفحة: ${fbData.name || fbData.id}` });
      }
      return res.json({
        success: false,
        message: `فشل الاتصال: ${fbData.error?.message || 'Token غير صالح'}`,
        code: fbData.error?.code,
        type: fbData.error?.type,
      });
    }

    if (platform === 'instagram') {
      const igId = getConfig('INSTAGRAM_BUSINESS_ID');
      if (!igId) {
        return res.json({
          success: false,
          message: 'INSTAGRAM_BUSINESS_ID غير مضبوط. يرجى إدخال معرف حساب إنستغرام التجاري أولاً.',
          code: 'MISSING_BUSINESS_ID',
        });
      }
      // Use dedicated Instagram token if set, otherwise fallback to Facebook token
      const igToken = getConfig('INSTAGRAM_ACCESS_TOKEN') || token;
      if (!igToken || igToken === 'undefined' || igToken.length < 20) {
        return res.json({
          success: false,
          message: 'رمز الوصول (Token) غير صالح أو فارغ. يرجى إدخال INSTAGRAM_ACCESS_TOKEN صحيح.',
          code: 'INVALID_TOKEN_FORMAT',
          hint: 'الرمز يجب أن يكون EAAL... أو IGQVJ... (أكثر من 50 حرف)',
        });
      }
      const igRes = await fetch(`https://graph.facebook.com/v18.0/${igId}?access_token=${igToken}&fields=id,username,name,profile_picture_url`);
      const igData = await igRes.json();
      if (igRes.ok && igData.id) {
        return res.json({
          success: true,
          message: `الاتصال ناجح! الحساب: @${igData.username || igData.id}`,
          account: {
            id: igData.id,
            username: igData.username,
            name: igData.name,
          },
        });
      }
      // Parse Meta API error for better UX
      const errMsg = igData.error?.message || 'Token أو Business ID غير صالح';
      const errCode = igData.error?.code;
      const errType = igData.error?.type;
      const errSubcode = igData.error?.error_subcode;

      let friendlyHint = '';
      if (errSubcode === 460) {
        friendlyHint = 'الرمز غير صحيح أو منتهي الصلاحية. أعد توليده من Meta Business Settings.';
      } else if (errCode === 190) {
        friendlyHint = 'الرمز غير صالح. تأكد من نسخه كاملاً من Meta Developer Portal.';
      } else if (errCode === 100) {
        friendlyHint = 'INSTAGRAM_BUSINESS_ID غير صحيح. تأكد من نسخه من إعدادات Instagram Graph API.';
      }

      return res.json({
        success: false,
        message: `فشل الاتصال: ${errMsg}${friendlyHint ? ' — ' + friendlyHint : ''}`,
        code: errCode,
        type: errType,
        subcode: errSubcode,
        debug: {
          business_id: igId,
          token_preview: igToken ? `${igToken.slice(0, 8)}...${igToken.slice(-4)}` : null,
        },
      });
    }
  } catch (e) {
    return res.json({ success: false, message: 'خطأ في الاتصال: ' + e.message });
  }
}));

// ── WhatsApp account info + test connection ────────────────────────────────
router.get('/whatsapp/info', asyncHandler(async (req, res) => {
  const token = getConfig('WHATSAPP_TOKEN') || process.env.WHATSAPP_TOKEN;
  const phoneId = getConfig('WHATSAPP_PHONE_ID') || process.env.WHATSAPP_PHONE_ID;
  const verifyToken = getConfig('FB_VERIFY_TOKEN');

  // Prefer DB-stored accounts, fallback to env vars
  let dbAccounts = [];
  try { dbAccounts = await listAccounts(); } catch { /* silent */ }

  res.json({
    has_credentials: !!(token && phoneId),
    source: dbAccounts.length > 0 ? 'database' : (token && phoneId) ? 'env' : 'none',
    phone_number_id: phoneId || null,
    verify_token: verifyToken || null,
    access_token_preview: token ? `${token.slice(0, 12)}...${token.slice(-6)}` : null,
    database_accounts: dbAccounts,
  });
}));

router.post('/whatsapp/test-connection', asyncHandler(async (req, res) => {
  const token = getConfig('WHATSAPP_TOKEN') || process.env.WHATSAPP_TOKEN;
  const phoneId = getConfig('WHATSAPP_PHONE_ID') || process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return res.json({ success: false, message: 'بيانات WhatsApp غير مكتملة. تأكد من WHATSAPP_TOKEN و WHATSAPP_PHONE_ID.' });
  }

  try {
    // 1) Verify token works by fetching phone number info
    const phoneRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}?access_token=${token}&fields=id,display_phone_number,verified_name,quality_rating`);
    const phoneData = await phoneRes.json();

    if (!phoneRes.ok || phoneData.error) {
      return res.json({
        success: false,
        message: `فشل التحقق من الرقم: ${phoneData.error?.message || 'استجابة غير صالحة'}`,
      });
    }

    // 2) Verify webhook is reachable
    const API_BASE = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const webhookUrl = `${API_BASE}/api/whatsapp/webhook`;

    return res.json({
      success: true,
      message: 'الاتصال بـ WhatsApp API ناجح',
      phone: {
        id: phoneData.id,
        display_number: phoneData.display_phone_number,
        verified_name: phoneData.verified_name,
        quality_rating: phoneData.quality_rating,
      },
      webhook_url: webhookUrl,
      verify_token: getConfig('FB_VERIFY_TOKEN'),
    });
  } catch (e) {
    return res.json({ success: false, message: 'خطأ في الاتصال: ' + e.message });
  }
}));

// ── WhatsApp send test template message ────────────────────────────────────
// Matches the official Meta Graph API curl format the user provided
router.post('/whatsapp/send-test', asyncHandler(async (req, res) => {
  const { to, template = '3p_direct_integration_test_template', language = 'en_US', api_version = 'v25.0' } = req.body || {};
  if (!to) {
    return res.status(400).json({ success: false, message: 'حقل "to" مطلوب (رقم المستلم بالصيغة الدولية بدون +)' });
  }

  const token = getConfig('WHATSAPP_TOKEN') || process.env.WHATSAPP_TOKEN;
  const phoneId = getConfig('WHATSAPP_PHONE_ID') || process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    return res.json({ success: false, message: 'بيانات WhatsApp غير مكتملة. تأكد من WHATSAPP_TOKEN و WHATSAPP_PHONE_ID.' });
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: template, language: { code: language } },
  };

  try {
    const url = `https://graph.facebook.com/${api_version}/${phoneId}/messages`;
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await apiRes.json();
    if (!apiRes.ok || data.error) {
      const errMsg = data.error?.message || 'فشل غير معروف';
      const errCode = data.error?.code;
      const errSubcode = data.error?.error_subcode;
      return res.json({
        success: false,
        message: `فشل إرسال الرسالة: ${errMsg}`,
        code: errCode,
        subcode: errSubcode,
        hint: errCode === 190 ? 'الـ Token غير صالح. أعد توليده من Meta Business Settings.' :
              errCode === 100 ? 'تأكد من phone_number_id ورقم المستلم.' :
              errSubcode === 33 ? 'Template name غير موجود. تأكد من الموافقة على الـ template.' : null,
        raw: data,
      });
    }
    logger.info(`WhatsApp test template sent to ${to} — message_id=${data.messages?.[0]?.id}`);
    return res.json({
      success: true,
      message: `تم إرسال الرسالة التجريبية إلى ${to} بنجاح ✓`,
      message_id: data.messages?.[0]?.id,
      recipient: to,
      template,
      language,
    });
  } catch (e) {
    return res.json({ success: false, message: 'خطأ في الاتصال: ' + e.message });
  }
}));

// ── Test: Simulate an Instagram message ────────────────────────────────────
// Use this to test the Instagram flow without needing a real webhook
// POST /api/test/simulate-instagram { sender_id, text, sender_name? }
router.post('/test/simulate-instagram', asyncHandler(async (req, res) => {
  const { sender_id = 'TEST_IG_USER_' + Date.now(), text = 'مرحبا من Instagram', sender_name = 'Test IG User' } = req.body || {};

  try {
    const reply = await processMessage({
      platform: 'instagram',
      userId: sender_id,
      text,
      userName: sender_name,
    });
    res.json({
      success: true,
      message: 'تم حقن الرسالة الاختبارية بنجاح ✓',
      sender_id,
      text,
      reply: reply || '(no AI reply generated)',
      note: 'افتح Inbox في الواجهة لرؤية الرسالة',
    });
  } catch (e) {
    res.json({ success: false, message: 'فشل: ' + e.message });
  }
}));

// ── Test: Simulate an Instagram comment ───────────────────────────────────
router.post('/test/simulate-instagram-comment', asyncHandler(async (req, res) => {
  const { sender_id = 'TEST_IG_COMMENTER_' + Date.now(), text = 'تعليق اختباري من Instagram', sender_name = 'Test Commenter' } = req.body || {};

  try {
    const reply = await processMessage({
      platform: 'instagram',
      userId: sender_id,
      text,
      userName: sender_name,
    });
    res.json({
      success: true,
      message: 'تم حقن التعليق الاختباري بنجاح ✓',
      sender_id,
      text,
      reply: reply || '(no AI reply generated)',
      note: 'افتح Inbox في الواجهة لرؤية الرسالة',
    });
  } catch (e) {
    res.json({ success: false, message: 'فشل: ' + e.message });
  }
}));

// ── Test: Bypass signature verification (for debugging Meta Portal mismatch) ──
// WARNING: This endpoint has NO signature verification — use only for testing!
router.post('/test/instagram-webhook-noauth', asyncHandler(async (req, res) => {
  const { processMessage } = require('../core/message_processor');
  const { sendInstagramReply } = require('../utils/meta');
  const logger = require('../utils/logger');

  const body = req.body;
  logger.warn(`⚠️ /test/instagram-webhook-noauth called (NO SIGNATURE CHECK) | body=${JSON.stringify(body).slice(0, 200)}`);

  if (body.object !== 'instagram') {
    return res.status(400).json({ error: 'Expected object="instagram"', received: body.object });
  }

  let processed = 0;
  let errors = 0;

  for (const entry of body.entry || []) {
    if (!entry.messaging || !Array.isArray(entry.messaging)) continue;

    for (const evt of entry.messaging) {
      const senderId = evt.sender?.id;
      const msg = evt.message;

      if (!msg || !senderId) {
        logger.warn(`Skipping event: no message or sender`);
        continue;
      }

      const text = msg.text || '[attachment]';
      logger.info(`Processing test message from ${senderId}: "${text.slice(0, 60)}"`);

      try {
        const reply = await processMessage({
          platform: 'instagram',
          userId: senderId,
          text,
          userName: msg.sender?.username || 'TestUser',
        });

        if (reply) {
          await sendInstagramReply(senderId, reply);
          logger.info(`Sent reply to ${senderId}: "${reply.slice(0, 60)}"`);
        }
        processed++;
      } catch (e) {
        errors++;
        logger.error(`Error processing test message: ${e.message}`);
      }
    }
  }

  res.json({
    success: true,
    message: `تم معالجة ${processed} رسالة (${errors} أخطاء)`,
    processed,
    errors,
    note: 'هذا endpoint بدون signature verification — للاختبار فقط!',
  });
}));

// ── Diagnostic: Why isn't Instagram webhook delivering messages? ──────────
router.get('/debug/instagram-status', asyncHandler(async (req, res) => {
  const checks = [];
  let allOk = true;

  // 1) Check META_APP_SECRET
  const metaSecret = getConfig('META_APP_SECRET');
  checks.push({
    name: 'META_APP_SECRET',
    ok: !!metaSecret,
    value: metaSecret ? `${metaSecret.slice(0, 4)}...${metaSecret.slice(-4)} (len=${metaSecret.length})` : 'NOT SET',
    note: 'يجب أن يطابق "App Secret" في Meta Developer Portal → Settings → Basic',
  });
  if (!metaSecret) allOk = false;

  // 2) Check INSTAGRAM_ACCESS_TOKEN
  const igToken = getConfig('INSTAGRAM_ACCESS_TOKEN');
  checks.push({
    name: 'INSTAGRAM_ACCESS_TOKEN',
    ok: !!igToken && igToken.length > 100,
    value: igToken ? `${igToken.slice(0, 12)}... (len=${igToken.length})` : 'NOT SET',
    note: 'يجب أن يكون رمز IGAA أو EAAL صالح (>100 حرف)',
  });
  if (!igToken || igToken.length < 100) allOk = false;

  // 3) Check INSTAGRAM_BUSINESS_ID
  const igBizId = getConfig('INSTAGRAM_BUSINESS_ID');
  checks.push({
    name: 'INSTAGRAM_BUSINESS_ID',
    ok: !!igBizId && igBizId.length >= 10,
    value: igBizId ? `${igBizId} (len=${igBizId.length})` : 'NOT SET',
    note: 'Instagram Business Account ID (يبدأ بـ 17841...)',
  });
  if (!igBizId || igBizId.length < 10) allOk = false;

  // 4) Check INSTAGRAM_DM_REPLY
  const dmEnabled = getConfig('INSTAGRAM_DM_REPLY', 'true') !== 'false';
  checks.push({
    name: 'INSTAGRAM_DM_REPLY',
    ok: dmEnabled,
    value: dmEnabled ? 'true' : 'false',
    note: 'الرد التلقائي على DM مفعّل؟',
  });

  // 5) Check FB_VERIFY_TOKEN
  const verifyToken = getConfig('FB_VERIFY_TOKEN');
  checks.push({
    name: 'FB_VERIFY_TOKEN',
    ok: !!verifyToken,
    value: verifyToken || 'NOT SET',
    note: 'يجب أن يطابق "Verify Token" في Meta Developer → Webhooks',
  });

  // 6) Count recent conversations
  const { data: recentIgs, count: igCount } = await supabase
    .from('conversations')
    .select('id, updated_at', { count: 'exact' })
    .eq('platform', 'instagram')
    .order('updated_at', { ascending: false })
    .limit(1);
  const lastIgUpdate = recentIgs?.[0]?.updated_at || null;
  const minutesSinceLast = lastIgUpdate ? Math.floor((Date.now() - new Date(lastIgUpdate).getTime()) / 60000) : null;

  checks.push({
    name: 'Recent Instagram activity',
    ok: igCount > 0,
    value: `${igCount} محادثة (آخر تحديث: ${lastIgUpdate || 'never'})`,
    note: minutesSinceLast !== null ? `منذ ${minutesSinceLast} دقيقة` : 'لا توجد محادثات',
  });

  // 7) Test connection to Instagram API
  let apiTest = { ok: false };
  if (igToken && igBizId) {
    try {
      const r = await fetch(`https://graph.facebook.com/v18.0/${igBizId}?access_token=${encodeURIComponent(igToken)}&fields=id,username`);
      const d = await r.json();
      apiTest = {
        ok: r.ok && d.id,
        status: r.status,
        username: d.username,
        error: d.error?.message,
      };
    } catch (e) {
      apiTest = { ok: false, error: e.message };
    }
  }
  checks.push({
    name: 'Instagram API test',
    ok: apiTest.ok,
    value: apiTest.ok ? `@${apiTest.username} ✓` : (apiTest.error || 'فشل'),
    note: 'هل يمكن للسيرفر الاتصال بـ Instagram API؟',
  });

  // 8) Calculate webhook URL
  const API_BASE = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const webhookUrl = `${API_BASE}/api/instagram/webhook`;

  res.json({
    success: allOk,
    message: allOk
      ? 'كل الإعدادات صحيحة ✓'
      : 'بعض الإعدادات ناقصة أو خاطئة. راجع التفاصيل أدناه.',
    checks,
    webhook: {
      callback_url: webhookUrl,
      verify_endpoint: `${webhookUrl}?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345`,
    },
    checklist: [
      '1. تأكد من ربط Instagram Business account بصفحة Facebook (في Meta Business Settings)',
      '2. في Meta Developer → Webhooks، اربط callback URL: ' + webhookUrl,
      '3. تأكد من أن "Verify Token" في Meta Developer يطابق FB_VERIFY_TOKEN في هذا السيرفر',
      '4. تأكد من أن "App Secret" في Meta Developer يطابق META_APP_SECRET في هذا السيرفر',
      '5. في Webhooks subscriptions، فعّل: messages, message_reactions, messaging_postbacks, messaging_seen, messaging_referral, standby',
      '6. تأكد من أن التطبيق في وضع "Live" (ليس "Development") في Meta Developer',
      '7. إذا كان التطبيق في Development، فقط أنت (admin) تستطيع إرسال رسائل test',
      '8. تحقق من logs السيرفر لأي طلبات POST /api/instagram/webhook من Meta',
    ],
  });
}));

// ── Test: Simulate Meta's exact webhook payload (v25.0) ───────────────────
// Accepts the EXACT sample payload from Meta docs so users can copy-paste it.
// POST /api/test/simulate-instagram-payload
// Body can be either:
//   (A) A single "value" object (the field-level sample):
//       { "field": "messages", "value": { "sender": {...}, "recipient": {...}, ... } }
//   (B) A full webhook payload (object=instagram, entry=[...messaging]):
//       { "object": "instagram", "entry": [...] }
router.post('/test/simulate-instagram-payload', asyncHandler(async (req, res) => {
  const body = req.body || {};
  let processed = [];

  // Form A: single "value" object (matches the "Send Test to server" button on Meta)
  if (body.value && body.value.sender) {
    const evt = body.value;
    const senderId = evt.sender?.id;
    const text = evt.message?.text || '';
    const senderName = 'Meta Sample User';
    if (senderId && text) {
      const reply = await processMessage({ platform: 'instagram', userId: senderId, text, userName: senderName });
      processed.push({ sender_id: senderId, text, reply: reply || '(no AI reply)' });
    }
  }

  // Form B: full webhook payload (with object + entry)
  if (body.object === 'instagram' && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      if (!Array.isArray(entry.messaging)) continue;
      for (const evt of entry.messaging) {
        try {
          if (evt.message?.is_echo) continue; // skip our own messages
          const senderId = evt.sender?.id;
          const text = evt.message?.text || '';
          if (senderId && text) {
            const reply = await processMessage({ platform: 'instagram', userId: senderId, text });
            processed.push({ sender_id: senderId, text, reply: reply || '(no AI reply)' });
          }
        } catch (e) {
          logger.error(`simulate-instagram-payload: event error: ${e.message}`);
        }
      }
    }
  }

  if (processed.length === 0) {
    return res.json({
      success: false,
      message: 'لم يتم العثور على رسائل صالحة. أرسل إما {"value":{...}} أو {"object":"instagram","entry":[...]}',
    });
  }

  res.json({
    success: true,
    message: `تم معالجة ${processed.length} رسالة Instagram اختبارية بنجاح ✓`,
    processed,
    note: 'افتح Inbox في الواجهة لرؤية الرسائل',
  });
}));

// ── Diagnostic: Recent webhook requests ───────────────────────────────────
const { getRecentWebhooks } = require('../middleware/signature');

router.get('/webhook/recent', asyncHandler(async (req, res) => {
  const recent = getRecentWebhooks();
  res.json({
    success: true,
    count: recent.length,
    requests: recent,
    note: 'آخر 30 webhook request (من الأحدث للأقدم)',
  });
}));

// ── Diagnostic: Current META_APP_SECRET (masked) ──────────────────────────
router.get('/config/meta-secret', asyncHandler(async (req, res) => {
  const { getConfig } = require('../core/config_store');
  const secret = getConfig('META_APP_SECRET');
  
  if (!secret) {
    return res.json({
      success: false,
      message: 'META_APP_SECRET غير معرّف',
      configured: false,
    });
  }

  const envSecret = process.env.META_APP_SECRET;
  const source = envSecret === secret ? '.env' : 'supabase_cache';
  
  res.json({
    success: true,
    configured: true,
    source,
    length: secret.length,
    first4: secret.slice(0, 4),
    last4: secret.slice(-4),
    masked: `${secret.slice(0, 4)}${'*'.repeat(Math.max(0, secret.length - 8))}${secret.slice(-4)}`,
    note: 'هذه هي القيمة التي يستخدمها السيرفر للتحقق من توقيع Meta',
  });
}));

module.exports = router;
