const { selectModel, chat, logTokenUsage } = require('./unified_ai');
const { getProducts, getShippingZones } = require('./order_manager');
const { saveOrder } = require('./order_manager');
const logger = require('../utils/logger');
const supabase = require('../lib/supabase');
const sse = require('../utils/sse');

function buildSystemPrompt(products, shipping) {
  let customShippingInfo = '';
  if (process.env.WILAYA_SHIPPING_PRICES) {
    try {
      const parsed = JSON.parse(process.env.WILAYA_SHIPPING_PRICES);
      customShippingInfo = `\n=== أسعار الشحن الفردية المخصصة لكل ولاية ===\n${JSON.stringify(parsed, null, 2)}`;
    } catch (e) {
      customShippingInfo = '';
    }
  }

  return `أنت مساعد متجر إلكتروني ذكي يعمل باللغة العربية والفرنسية والدارجة الجزائرية.

=== مهامك ===
1. الترحيب بالعملاء بشكل ودي
2. الإجابة على استفسارات المنتجات والأسعار
3. تأكيد الطلبات وجمع بيانات التوصيل
4. إخبار العميل بتكلفة الشحن حسب ولايته وطريقة التوصيل
5. إنشاء طلب مؤكد وإرسال التفاصيل

=== قاعدة المنتجات ===
${JSON.stringify(products, null, 2)}

=== أسعار الشحن ===
${JSON.stringify(shipping, null, 2)}
${customShippingInfo}

=== قواعد التأكيد ===
- اطلب: الاسم الكامل، رقم الهاتف، الولاية، العنوان التفصيلي، ونوع التوصيل (منزل أو مكتب شركة التوصيل)
- اسأل العميل دائماً إذا كان يفضل التوصيل للمنزل (أكثر تكلفة) أو الاستلام من مكتب شركة التوصيل (مكتب Yalidine مثلاً - أقل تكلفة).
- كرّر الطلب كاملاً قبل التأكيد النهائي موضحاً نوع التوصيل
- عند التأكيد: أنشئ رقم طلب فريد بصيغة #ORD-XXXXX
- أرسل ملخص الطلب + تكلفة الشحن المناسبة + المجموع الكلي

=== الأسلوب ===
- ودي، محترف، سريع
- استخدم إيموجي باعتدال 😊📦✅
- إذا لم يكن المنتج متوفراً، اقترح بديلاً`;
}

function classifyIntent(text) {
  const t = text.toLowerCase();
  if (t.includes('شكوى') || t.includes('تأخر') || t.includes('ما وصل') || t.includes('مشكل'))
    return { type: 'COMPLAINT', stage: null, complexity: 'HIGH', sentiment: 'NEGATIVE' };
  if (t.includes('طلب') || t.includes('بغيت') || t.includes('نطلب') || t.includes('شراء'))
    return { type: 'ORDER', stage: 'INITIATED', complexity: 'MEDIUM' };
  if (t.includes('توصيل') || t.includes('شحن') || t.includes('يوصل'))
    return { type: 'SHIPPING_QUERY', stage: null, complexity: 'LOW' };
  if (t.includes('سعر') || t.includes('ثمن') || (/\bكم\b/u.test(t) && !t.includes('عليكم') && !t.includes('لكم')))
    return { type: 'QUERY', stage: null, complexity: 'LOW' };
  if (t.includes('واش') || t.includes('عندكم') || t.includes('شنو'))
    return { type: 'QUERY', stage: null, complexity: 'LOW' };
  return { type: 'GENERAL', stage: null, complexity: 'LOW' };
}

async function ensureCustomer(platform, userId, userName) {
  const { data: existing, error: selectError } = await supabase
    .from('customers')
    .select('id, name')
    .eq('platform', platform)
    .eq('platform_id', userId)
    .maybeSingle();

  if (selectError) {
    logger.error(`customer select error: ${selectError.message}`);
    throw selectError;
  }

  if (existing) {
    if (userName && existing.name !== userName) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: userName })
        .eq('id', existing.id);
      if (updateError) {
        logger.error(`customer name update error: ${updateError.message}`);
      }
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ platform, platform_id: userId, name: userName || null })
    .select('id')
    .single();

  if (error) {
    logger.error(`customer insert error: ${error.message}`);
    if (error.code === '23505') {
      const { data: retryData, error: retryError } = await supabase
        .from('customers')
        .select('id')
        .eq('platform', platform)
        .eq('platform_id', userId)
        .maybeSingle();
      if (retryData) {
        return retryData.id;
      }
      if (retryError) {
        logger.error(`customer insert retry select error: ${retryError.message}`);
      }
    }
    throw error;
  }

  if (!data || !data.id) {
    throw new Error('customer insert returned no data');
  }

  return data.id;
}

async function processMessage({ platform, userId, text, userName }) {
  const [products, shipping] = await Promise.all([
    getProducts().catch(() => []),
    getShippingZones().catch(() => []),
  ]);

  const customerId = await ensureCustomer(platform, userId, userName);

  const { data: conv } = await supabase.from('conversations')
    .select('id, messages').eq('customer_id', customerId).eq('status', 'open')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  let history = [];
  if (conv && conv.messages) {
    try {
      history = typeof conv.messages === 'string' ? JSON.parse(conv.messages) : conv.messages;
    } catch (e) {
      history = [];
    }
  }
  if (!Array.isArray(history)) {
    history = [];
  }

  history.push({ role: 'user', content: text, timestamp: new Date().toISOString() });

  // 1. Check if AI reply is enabled for this specific platform
  const aiEnabledKey = `${platform.toUpperCase()}_AI_REPLY`;
  const aiEnabled = process.env[aiEnabledKey] !== 'false';

  if (!aiEnabled) {
    // Save message and just return null (No AI reply generated)
    if (conv?.id) {
      await supabase.from('conversations').update({
        messages: JSON.stringify(history),
        updated_at: new Date().toISOString()
      }).eq('id', conv.id);
    } else {
      await supabase.from('conversations').insert({
        customer_id: customerId, platform, status: 'open',
        messages: JSON.stringify(history),
        updated_at: new Date().toISOString(),
      });
    }
    sse.broadcastUpdate('conversation_updated', { platform, platformId: userId, customerId });
    return null;
  }

  const intent = classifyIntent(text);
  
  // 2. Select AI Provider & Model (Check for channel specific model overrides)
  let provider, model;
  const customModelSetting = process.env[`${platform.toUpperCase()}_AI_MODEL`];
  if (customModelSetting && customModelSetting.includes('/')) {
    const parts = customModelSetting.split('/');
    provider = parts[0];
    model = parts[1];
  } else {
    const selected = selectModel(text, intent);
    provider = selected.provider;
    model = selected.model;
  }

  logger.info(`Processing: ${userId} @ ${platform} | ${intent.type} → ${provider}/${model}`);

  const result = await chat(provider, model, history, buildSystemPrompt(products, shipping));
  history.push({ role: 'assistant', content: result.text, timestamp: new Date().toISOString() });

  if (conv?.id) {
    const { error: updateErr } = await supabase.from('conversations').update({
      messages: JSON.stringify(history),
      ai_model: `${provider}/${model}`,
      updated_at: new Date().toISOString()
    }).eq('id', conv.id);
    if (updateErr) logger.error('Update Conv Error: ' + updateErr.message);
  } else {
    const { error: insertErr } = await supabase.from('conversations').insert({
      customer_id: customerId, platform, status: 'open',
      ai_model: `${provider}/${model}`, messages: JSON.stringify(history),
      updated_at: new Date().toISOString(),
    });
    if (insertErr) logger.error('Insert Conv Error: ' + insertErr.message);
  }

  await logTokenUsage({
    provider: result.provider, model: result.model,
    input: result.input_tokens, output: result.output_tokens,
    platform, customer_id: userId,
  });

  if (result.text.includes('#ORD-')) {
    const orderId = await saveOrder(customerId, platform, result.text);
    logger.info(`Order created: ${orderId}`, { customer_id: customerId, platform });
  }

  // Broadcast the update via SSE
  sse.broadcastUpdate('conversation_updated', { platform, platformId: userId, customerId });

  return result.text;
}

async function getConversations() {
  const { data, error } = await supabase.from('conversations')
    .select('id, customer_id, platform, status, ai_model, messages, updated_at, customers(id, name, platform_id, phone, wilaya, address)')
    .order('updated_at', { ascending: false }).limit(50);
  if (error) {
    logger.error('Error fetching conversations: ' + error.message);
    return [];
  }
  return (data || []).map(c => {
    const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : (c.messages || []);
    const last = msgs[msgs.length - 1];
    // Find the most recent USER message (not the last assistant reply)
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    const customerInfo = c.customers || {};
    return {
      id: c.id,
      userId: c.customer_id,
      platform: c.platform,
      status: c.status,
      ai_model: c.ai_model,
      messages: msgs,
      lastMessage: last?.content || '',
      lastMessageRole: last?.role || null,
      lastUserMessage: lastUserMsg?.content || '',
      lastUserTime: lastUserMsg?.timestamp || null,
      messageCount: msgs.length,
      unreadCount: 0, // TODO: track read state
      lastUpdated: c.updated_at,
      customerName: customerInfo.name || null,
      customerPhone: customerInfo.phone || customerInfo.platform_id || null,
      customerAddress: customerInfo.address || null,
      customerWilaya: customerInfo.wilaya || null,
      platformId: customerInfo.platform_id || null
    };
  });
}

module.exports = { processMessage, classifyIntent, getConversations };
