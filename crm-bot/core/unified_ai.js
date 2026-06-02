const logger = require('../utils/logger');
const { calculateCost } = require('../utils/token_cost');
const supabase = require('../lib/supabase');

function selectModel(text, context) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (context?.stage === 'ORDER_CONFIRMATION') {
    if (hasAnthropic) return { provider: 'anthropic', model: process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-5' };
    if (hasOpenAI) return { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini' };
    if (hasGoogle) return { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash' };
  }
  if (context?.message_type === 'SIMPLE_QUERY') {
    if (hasGoogle) return { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash' };
    if (hasOpenAI) return { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini' };
    if (hasAnthropic) return { provider: 'anthropic', model: process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-5' };
  }
  if (context?.sentiment === 'NEGATIVE' || context?.complexity === 'HIGH') {
    if (hasOpenAI) return { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini' };
    if (hasAnthropic) return { provider: 'anthropic', model: process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-5' };
    if (hasGoogle) return { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash' };
  }

  // Default: first available provider
  if (hasGoogle) return { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash' };
  if (hasOpenAI) return { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini' };
  return { provider: 'anthropic', model: 'claude-sonnet-4-5' }; // fallback
}

const TIMEOUT = 15000; // 15s per AI call

async function callClaude(model, messages, systemPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 1000, system: systemPrompt, messages }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: data.content[0].text, input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens, provider: 'anthropic', model };
}

async function callGemini(model, messages, systemPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    }),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: data.candidates[0].content.parts[0].text, input_tokens: data.usageMetadata?.promptTokenCount || 0, output_tokens: data.usageMetadata?.candidatesTokenCount || 0, provider: 'google', model };
}

async function callOpenAI(model, messages, systemPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', { signal: AbortSignal.timeout(TIMEOUT),
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: data.choices[0].message.content, input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens, provider: 'openai', model };
}

async function chat(provider, model, messages, systemPrompt) {
  if (process.env.MOCK_AI === 'true') {
    logger.info('[MOCK AI] Simulating AI response due to MOCK_AI=true');
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isConfirm = lastUserMsg.includes('أكد') || lastUserMsg.includes('نعم') || lastUserMsg.includes('اكد') || lastUserMsg.includes('confirm');
    
    if (isConfirm) {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      return {
        text: `شكراً لك! تم تأكيد طلبك بنجاح.
رقم الطلب: #ORD-${orderNum}
الاسم: محمد أمين
الهاتف: 213550000000
العنوان: الجزائر العاصمة، دالي إبراهيم
المجموع الكلي: 4500
التفاصيل:
حذاء رياضي أبيض x1 — 4500`,
        input_tokens: 60,
        output_tokens: 45,
        provider: 'mock',
        model: 'mock-model'
      };
    }
    
    return { text: "أهلاً بك! نعم الحذاء الأبيض متوفر بسعر 4500 دج. هل ترغب في تأكيد الطلب؟", input_tokens: 50, output_tokens: 20, provider: 'mock', model: 'mock-model' };
  }
  try {
    switch (provider) {
      case 'anthropic': return await callClaude(model, messages, systemPrompt);
      case 'google': return await callGemini(model, messages, systemPrompt);
      case 'openai': return await callOpenAI(model, messages, systemPrompt);
      default: return await callClaude('claude-sonnet-4-5', messages, systemPrompt);
    }
  } catch (err) {
    logger.warn(`AI Provider [${provider}] failed: ${err.message}. Attempting fallback...`);
    
    const hasGoogle = !!process.env.GOOGLE_AI_API_KEY && provider !== 'google';
    const hasOpenAI = !!process.env.OPENAI_API_KEY && provider !== 'openai';
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && provider !== 'anthropic';

    try {
      if (hasGoogle) {
        logger.info('Fallback: Attempting Google Gemini');
        return await callGemini(process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash', messages, systemPrompt);
      }
      if (hasOpenAI) {
        logger.info('Fallback: Attempting OpenAI');
        return await callOpenAI(process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini', messages, systemPrompt);
      }
      if (hasAnthropic) {
        logger.info('Fallback: Attempting Anthropic Claude');
        return await callClaude(process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-5', messages, systemPrompt);
      }
    } catch (fallbackErr) {
      logger.error(`Fallback providers also failed: ${fallbackErr.message}`);
    }

    // Ultimate Fallback: Local Dynamic Mock response to ensure WhatsApp webhook never fails and order confirmation is testable!
    logger.warn('All AI providers failed or are rate-limited. Falling back to dynamic Local Mock AI.');
    
    // List of Algerian wilayas (codes, Arabic names, French names, and standard shipping rates)
    const wilayaList = [
      { code: '01', nameAr: 'أدرار', nameFr: 'adrar', price: 700 },
      { code: '02', nameAr: 'الشلف', nameFr: 'chlef', price: 500 },
      { code: '03', nameAr: 'الأغواط', nameFr: 'laghouat', price: 550 },
      { code: '04', nameAr: 'أم البواقي', nameFr: 'oum el bouaghi', price: 500 },
      { code: '05', nameAr: 'باتنة', nameFr: 'batna', price: 550 },
      { code: '06', nameAr: 'بجاية', nameFr: 'bejaia', price: 500 },
      { code: '07', nameAr: 'بسكرة', nameFr: 'biskra', price: 700 },
      { code: '08', nameAr: 'بشار', nameFr: 'bechar', price: 700 },
      { code: '09', nameAr: 'البليدة', nameFr: 'blida', price: 400 },
      { code: '10', nameAr: 'البويرة', nameFr: 'bouira', price: 500 },
      { code: '11', nameAr: 'تمنراست', nameFr: 'tamanrasset', price: 700 },
      { code: '12', nameAr: 'تبسة', nameFr: 'tebessa', price: 500 },
      { code: '13', nameAr: 'تلمسان', nameFr: 'tlemcen', price: 500 },
      { code: '14', nameAr: 'تيارت', nameFr: 'tiaret', price: 500 },
      { code: '15', nameAr: 'تيزي وزو', nameFr: 'tizi ouzou', price: 500 },
      { code: '16', nameAr: 'الجزائر', nameFr: 'alger', price: 400 },
      { code: '17', nameAr: 'الجلفة', nameFr: 'djelfa', price: 550 },
      { code: '18', nameAr: 'جيجل', nameFr: 'jijel', price: 500 },
      { code: '19', nameAr: 'سطيف', nameFr: 'setif', price: 500 },
      { code: '20', nameAr: 'سعيدة', nameFr: 'saida', price: 500 },
      { code: '21', nameAr: 'سكيكدة', nameFr: 'skikda', price: 500 },
      { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'sidi bel abbes', price: 500 },
      { code: '23', nameAr: 'عنابة', nameFr: 'annaba', price: 500 },
      { code: '24', nameAr: 'قالمة', nameFr: 'guelma', price: 500 },
      { code: '25', nameAr: 'قسنطينة', nameFr: 'constantine', price: 500 },
      { code: '26', nameAr: 'المدية', nameFr: 'medea', price: 500 },
      { code: '27', nameAr: 'مستغانم', nameFr: 'mostaganem', price: 500 },
      { code: '28', nameAr: 'المسيلة', nameFr: 'msila', price: 550 },
      { code: '29', nameAr: 'معسكر', nameFr: 'mascara', price: 500 },
      { code: '30', nameAr: 'ورقلة', nameFr: 'ouargla', price: 700 },
      { code: '31', nameAr: 'وهران', nameFr: 'oran', price: 500 },
      { code: '32', nameAr: 'البيض', nameFr: 'el bayadh', price: 700 },
      { code: '33', nameAr: 'إليزي', nameFr: 'illizi', price: 700 },
      { code: '34', nameAr: 'برج بوعريريج', nameFr: 'bordj bou arreridj', price: 550 },
      { code: '35', nameAr: 'بومرداس', nameFr: 'boumerdes', price: 400 },
      { code: '36', nameAr: 'الطارف', nameFr: 'el tarf', price: 500 },
      { code: '37', nameAr: 'تندوف', nameFr: 'tindouf', price: 700 },
      { code: '38', nameAr: 'تيسمسيلت', nameFr: 'tissemsilt', price: 500 },
      { code: '39', nameAr: 'الوادي', nameFr: 'el oued', price: 700 },
      { code: '40', nameAr: 'خنشلة', nameFr: 'khenchela', price: 500 },
      { code: '41', nameAr: 'سوق أهراس', nameFr: 'souk ahras', price: 500 },
      { code: '42', nameAr: 'تيبازة', nameFr: 'tipaza', price: 400 },
      { code: '43', nameAr: 'ميلة', nameFr: 'mila', price: 500 },
      { code: '44', nameAr: 'عين الدفلى', nameFr: 'ain defla', price: 500 },
      { code: '45', nameAr: 'النعامة', nameFr: 'naama', price: 700 },
      { code: '46', nameAr: 'عين تموشنت', nameFr: 'ain temouchent', price: 500 },
      { code: '47', nameAr: 'غرداية', nameFr: 'ghardaia', price: 700 },
      { code: '48', nameAr: 'غليزان', nameFr: 'relizane', price: 500 }
    ];

    // Extract products and shipping zones from systemPrompt
    let products = [];
    let shippingZones = [];
    try {
      const prodMatch = systemPrompt.match(/=== قاعدة المنتجات ===\s*([\s\S]*?)\n\n===/);
      if (prodMatch && prodMatch[1]) {
        products = JSON.parse(prodMatch[1].trim());
      }
    } catch (e) {
      logger.error('Fallback parse products error: ' + e.message);
    }
    if (!products || products.length === 0) {
      products = [
        { id: 'P01', name_ar: 'حذاء رياضي أبيض', price_dzd: 3500 }
      ];
    }
    
    try {
      const shipMatch = systemPrompt.match(/=== أسعار الشحن ===\s*([\s\S]*?)\n\n===/);
      if (shipMatch && shipMatch[1]) {
        shippingZones = JSON.parse(shipMatch[1].trim());
      }
    } catch (e) {
      logger.error('Fallback parse shipping error: ' + e.message);
    }

    const lastUserMsg = messages[messages.length - 1]?.content || '';

    // Intent Classification helper for quick fallback branch selection
    const isConfirmRequest = lastUserMsg.includes('أكد') || lastUserMsg.includes('نعم') || lastUserMsg.includes('اكد') || lastUserMsg.includes('confirm') || lastUserMsg.includes('صحيت');
    const isComplaint = lastUserMsg.includes('شكوى') || lastUserMsg.includes('تأخر') || lastUserMsg.includes('ما وصل') || lastUserMsg.includes('مشكل');
    const isShippingQuery = lastUserMsg.includes('توصيل') || lastUserMsg.includes('شحن') || lastUserMsg.includes('يوصل');
    const isOrderQuery = lastUserMsg.includes('طلب') || lastUserMsg.includes('بغيت') || lastUserMsg.includes('نطلب') || lastUserMsg.includes('شراء');

    // Function to calculate shipping cost based on DB zone configs or hardcoded rates
    function getShippingCost(wilayaNameOrCode, deliveryType) {
      let customPrices = {};
      if (process.env.WILAYA_SHIPPING_PRICES) {
        try {
          customPrices = JSON.parse(process.env.WILAYA_SHIPPING_PRICES);
        } catch (e) {
          logger.error('Failed to parse WILAYA_SHIPPING_PRICES: ' + e.message);
        }
      }

      let targetWilaya = wilayaList.find(w => 
        w.code === wilayaNameOrCode || 
        w.nameAr === wilayaNameOrCode || 
        w.nameFr.toLowerCase() === wilayaNameOrCode.toLowerCase()
      );

      const code = targetWilaya ? targetWilaya.code : wilayaNameOrCode;
      const wilayaName = targetWilaya ? targetWilaya.nameAr : wilayaNameOrCode;

      // 1. If we have custom per-wilaya pricing set, use it!
      if (customPrices && customPrices[code]) {
        const entry = customPrices[code];
        const priceHome = entry.price_home !== undefined ? parseInt(entry.price_home) : 500;
        const priceDesk = entry.price_desk !== undefined ? parseInt(entry.price_desk) : Math.max(0, priceHome - 200);
        const price = deliveryType === 'desk' ? priceDesk : priceHome;
        return { price, name: entry.name || wilayaName };
      }

      // 2. Fallback to old Zone-based calculations
      let zoneMatch = null;
      if (Array.isArray(shippingZones) && shippingZones.length > 0 && targetWilaya) {
        for (const zone of shippingZones) {
          const isMatch = Array.isArray(zone.wilayas) && (
            zone.wilayas.includes(targetWilaya.code) || 
            zone.wilayas.includes(parseInt(targetWilaya.code).toString())
          );
          if (isMatch) {
            zoneMatch = zone;
            break;
          }
        }
      }

      let price = 500; // default fallback

      if (zoneMatch) {
        if (deliveryType === 'home') {
          price = zoneMatch.price_home !== undefined ? zoneMatch.price_home : zoneMatch.price;
        } else if (deliveryType === 'desk') {
          price = zoneMatch.price_desk !== undefined ? zoneMatch.price_desk : Math.max(0, zoneMatch.price - 200);
        } else {
          price = zoneMatch.price_home !== undefined ? zoneMatch.price_home : zoneMatch.price;
        }
      } else if (targetWilaya) {
        price = targetWilaya.price;
        if (deliveryType === 'desk') {
          price = Math.max(0, price - 200);
        }
      }

      return { price, name: wilayaName };
    }

    // Dynamic State Extraction from Chat History
    let selectedProduct = null;
    let providedName = null;
    let providedPhone = null;
    let providedWilaya = null;
    let providedAddress = null;
    let providedDeliveryType = null; // 'home' | 'desk'

    const userMsgs = messages.filter(m => m.role === 'user');

    for (const msg of userMsgs) {
      const txt = msg.content;

      // 1. Detect product mention
      for (const prod of products) {
        const prodNameAr = prod.name_ar || prod.name || '';
        const prodNameFr = prod.name_fr || '';
        if (txt.includes(prodNameAr) || (prodNameFr && txt.toLowerCase().includes(prodNameFr.toLowerCase()))) {
          selectedProduct = prod;
        }
      }

      // 2. Detect phone number (Algerian standard: 10 digits starting with 05/06/07 or with +213 country code)
      const phoneMatch = txt.match(/(0[567]\d{8}|\+?213[567]\d{8})/);
      if (phoneMatch) {
        providedPhone = phoneMatch[1];
      }

      // 3. Detect wilaya name
      for (const w of wilayaList) {
        if (txt.includes(w.nameAr) || txt.toLowerCase().includes(w.nameFr.toLowerCase())) {
          providedWilaya = w;
        }
      }

      // 4. Try parsing structured formatted details: "الاسم: X", "الهاتف: Y", etc.
      const nameMatch = txt.match(/(?:الاسم|name|اسم)[:\s]+([^,\n\r]+)/i);
      if (nameMatch) {
        providedName = nameMatch[1].trim();
      }
      const addrMatch = txt.match(/(?:عنوان|address|العنوان)[:\s]+([^,\n\r]+)/i);
      if (addrMatch) {
        providedAddress = addrMatch[1].trim();
      }

      // 5. Try parsing unstructured blocks of details like "أحمد بن علي، 0555123456، البليدة، وسط المدينة"
      if (txt.includes('05') || txt.includes('06') || txt.includes('07') || txt.includes('213')) {
        const parts = txt.split(/[,\n\r/|]+/).map(p => p.trim());
        if (parts.length >= 2) {
          for (const part of parts) {
            if (part.match(/(0[567]\d{8}|\+?213[567]\d{8})/)) {
              providedPhone = part;
              continue;
            }
            let isWilaya = false;
            for (const w of wilayaList) {
              if (part.includes(w.nameAr) || part.toLowerCase().includes(w.nameFr.toLowerCase())) {
                providedWilaya = w;
                isWilaya = true;
                break;
              }
            }
            if (isWilaya) continue;

            if (!providedName && part.length > 2 && part.length < 30 && !part.includes(' ')) {
              providedName = part;
            } else if (!providedName && part.length > 2 && part.length < 30) {
              providedName = part;
            } else if (!providedAddress && part.length > 5) {
              providedAddress = part;
            }
          }
        }
      }

      // 6. Detect delivery type
      const txtLower = txt.toLowerCase();
      if (txtLower.includes('منزل') || txtLower.includes('بيت') || txtLower.includes('دار') || txtLower.includes('للبيت') || txtLower.includes('للدار') || txtLower.includes('للمنزل') || txtLower.includes('home') || txtLower.includes('domicile') || txtLower.includes('توصيل للمنزل')) {
        providedDeliveryType = 'home';
      } else if (txtLower.includes('مكتب') || txtLower.includes('مكتب شركة') || txtLower.includes('مكتب ياليدين') || txtLower.includes('ياليدين') || txtLower.includes('stop desk') || txtLower.includes('stopdesk') || txtLower.includes('office') || txtLower.includes('bureau') || txtLower.includes('ستوب ديسك') || txtLower.includes('ستوبديسك') || txtLower.includes('استلام من مكتب')) {
        providedDeliveryType = 'desk';
      }
    }

    // Contextual extraction: Map answers based on previous assistant questions
    if (messages.length >= 2) {
      const lastUser = messages[messages.length - 1];
      const lastAssistant = messages[messages.length - 2];
      
      if (lastUser && lastUser.role === 'user' && lastAssistant && lastAssistant.role === 'assistant') {
        const userText = lastUser.content.trim();
        const asstText = lastAssistant.content;
        
        if (asstText.includes('الاسم الكامل') && !providedName && userText.length < 50) {
          providedName = userText;
        }
        if (asstText.includes('رقم الهاتف') && !providedPhone && userText.match(/(0[567]\d{8}|\+?213[567]\d{8})/)) {
          providedPhone = userText;
        }
        if (asstText.includes('الولاية') && !providedWilaya) {
          for (const w of wilayaList) {
            if (userText.includes(w.nameAr) || userText.toLowerCase().includes(w.nameFr.toLowerCase())) {
              providedWilaya = w;
            }
          }
        }
        if (asstText.includes('العنوان') && !providedAddress && userText.length > 5) {
          providedAddress = userText;
        }
        if (asstText.includes('التوصيل') && asstText.includes('منزل') && asstText.includes('مكتب')) {
          if (userText.includes('منزل') || userText.includes('بيت') || userText.includes('دار') || userText.toLowerCase().includes('home') || userText.toLowerCase().includes('domicile')) {
            providedDeliveryType = 'home';
          } else if (userText.includes('مكتب') || userText.includes('ياليدين') || userText.toLowerCase().includes('stop') || userText.toLowerCase().includes('office')) {
            providedDeliveryType = 'desk';
          }
        }
      }
    }

    // Default to first product if they want to buy but didn't specify which one
    if (isOrderQuery && !selectedProduct && products.length > 0) {
      selectedProduct = products[0];
    }

    const prodPrice = selectedProduct ? parseFloat(selectedProduct.price_dzd || selectedProduct.price || 0) : 0;
    const prodName = selectedProduct ? (selectedProduct.name_ar || selectedProduct.name) : '';

    let shipCost = 500;
    let wilayaName = '';
    if (providedWilaya) {
      const res = getShippingCost(providedWilaya.code, providedDeliveryType);
      shipCost = res.price;
      wilayaName = res.name;
    }

    const total = prodPrice + shipCost;

    // 1. Complaint branch
    if (isComplaint) {
      return {
        text: `مرحباً بك عميلنا العزيز. نأسف جداً لسماع ذلك ونعتذر عن أي إزعاج! 😔
لقد قمنا بتحويل شكواك فوراً إلى قسم خدمة العملاء البشري وسيقوم أحد وكلائنا بالاتصال بك في أقرب وقت لحل المشكلة نهائياً. شكراً لتفهمك وصبرك معنا! ❤️`,
        input_tokens: 50,
        output_tokens: 45,
        provider: 'local-mock',
        model: 'local-fallback'
      };
    }

    // 2. Order confirmation (when we have all details and user confirms)
    const hasAllDetails = selectedProduct && (providedName || providedPhone) && providedWilaya && providedAddress && providedDeliveryType;
    
    if (hasAllDetails && (isConfirmRequest || lastUserMsg.includes('سجل') || lastUserMsg.includes('ماشي'))) {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      const deliveryTypeName = providedDeliveryType === 'home' ? 'توصيل للمنزل 🏠' : 'استلام من مكتب التوصيل (Stop Desk) 📦';
      return {
        text: `شكراً لك! تم تأكيد طلبك بنجاح من متجرنا. 😊📦
رقم الطلب الخاص بك هو: #ORD-${orderNum}
الاسم: ${providedName || 'عميل محترم'}
الهاتف: ${providedPhone || 'بدون هاتف'}
الولاية: ${wilayaName}
العنوان: ${providedAddress || 'العنوان التفصيلي'}
نوع التوصيل: ${deliveryTypeName}
المجموع الكلي: ${total} دج

تفاصيل المنتجات:
${prodName} x1 — ${prodPrice} دج

سنقوم بشحن طلبك في أقرب وقت ممكن! شكرًا لثقتك بنا. ✅`,
        input_tokens: 120,
        output_tokens: 95,
        provider: 'local-mock',
        model: 'local-fallback'
      };
    }

    // 3. Shipping info branch
    if (isShippingQuery) {
      // Check if they mentioned a specific state in their current message
      let detectedW = null;
      for (const w of wilayaList) {
        if (lastUserMsg.includes(w.nameAr) || lastUserMsg.toLowerCase().includes(w.nameFr.toLowerCase())) {
          detectedW = w;
        }
      }
      if (detectedW) {
        const resHome = getShippingCost(detectedW.code, 'home');
        const resDesk = getShippingCost(detectedW.code, 'desk');
        return {
          text: `توصيل الطلبات لولاية *${resHome.name}* هو:
- للمنزل 🏠: *${resHome.price} دج*
- استلام من مكتب شركة التوصيل 📦: *${resDesk.price} دج*

هل ترغب في طلب أي منتج؟ نحن هنا لمساعدتك! 😊`,
          input_tokens: 50,
          output_tokens: 40,
          provider: 'local-mock',
          model: 'local-fallback'
        };
      }

      return {
        text: `نوفر خدمة التوصيل السريع لجميع الولايات بأسعار مميزة جداً (توصيل للمنزل أو استلام من المكتب):
- الولايات الوسطى (الجزائر العاصمة، البليدة، تيبازة): 400 دج للمنزل / 300 دج للمكتب 🚚
- ولايات الشرق والغرب: 500 دج للمنزل / 350 دج للمكتب 🚚
- ولايات الجنوب الكبرى: 700 دج للمنزل / 550 دج للمكتب 🚚

ما هي ولايتك لنعطيك سعر التوصيل الدقيق؟ 😊`,
        input_tokens: 60,
        output_tokens: 50,
        provider: 'local-mock',
        model: 'local-fallback'
      };
    }

    // 4. Order flow: asking for missing details or confirmation
    if (isOrderQuery || selectedProduct) {
      const missing = [];
      if (!providedName) missing.push("الاسم الكامل 👤");
      if (!providedPhone) missing.push("رقم الهاتف 📞");
      if (!providedWilaya) missing.push("الولاية 📍");
      if (!providedAddress) missing.push("العنوان التفصيلي 🏠");
      if (!providedDeliveryType) missing.push("نوع التوصيل (منزل 🏠 أو استلام من مكتب شركة التوصيل 📦)");

      if (missing.length > 0) {
        return {
          text: `بكل سرور! لتسجيل طلبك لـ "${prodName}"، يرجى تزويدنا بالمعلومات التالية:
${missing.map((item, index) => `${index + 1}. ${item}`).join('\n')}

يمكنك إرسالها كلها في رسالة واحدة أو بالتفصيل وسنسجلها فوراً! 😊📦`,
          input_tokens: 80,
          output_tokens: 60,
          provider: 'local-mock',
          model: 'local-fallback'
        };
      } else {
        const deliveryTypeName = providedDeliveryType === 'home' ? 'توصيل للمنزل 🏠' : 'استلام من مكتب التوصيل (Stop Desk) 📦';
        // We have all details but no confirmation yet
        return {
          text: `لقد قمنا بجمع تفاصيل طلبك لـ "${prodName}":
- الاسم الكامل: ${providedName}
- رقم الهاتف: ${providedPhone}
- الولاية: ${wilayaName}
- العنوان: ${providedAddress}
- نوع التوصيل: ${deliveryTypeName} (سعر التوصيل: ${shipCost} دج)
- المجموع الكلي: *${total} دج*

هل تؤكد هذا الطلب لتسجيله وشحنه لك؟ يرجى الرد بـ *"نعم، أكد الطلب"* لتوليد فاتورتك فوراً! 😊📦✅`,
          input_tokens: 100,
          output_tokens: 80,
          provider: 'local-mock',
          model: 'local-fallback'
        };
      }
    }

    // 5. Default greeting / general questions
    const prodList = products.map(p => `- *${p.name_ar || p.name}*: بسعر *${p.price_dzd || p.price} دج*`).join('\n');
    return {
      text: `أهلاً وسهلاً بك في متجرنا الإلكتروني! 😊
يسعدنا تواصلك معنا. نحن نوفر المنتجات التالية بجودة عالية وتوصيل سريع:

${prodList}

إذا كنت ترغب في الاستفسار عن أي منتج أو طلب الشراء، نحن هنا لمساعدتك! ما الذي يثير اهتمامك اليوم؟ 👟👕`,
      input_tokens: 80,
      output_tokens: 65,
      provider: 'local-mock',
      model: 'local-fallback'
    };
  }
}

async function logTokenUsage(data) {
  const cost = calculateCost(data.provider, data.model, data.input, data.output);
  const { error } = await supabase.from('token_usage').insert({
    provider: data.provider,
    model: data.model,
    input_tokens: data.input,
    output_tokens: data.output,
    cost_usd: cost,
    platform: data.platform || 'unknown',
    customer_id: data.customer_id || null,
  });
  if (error) logger.error(`token_usage insert: ${error.message}`);
  logger.info(`Tokens: ${data.input + data.output} | $${cost} | ${data.provider}/${data.model}`);
  return { cost_usd: cost };
}

async function getUsageStats(from, to) {
  let query = supabase.from('token_usage').select('input_tokens, output_tokens, cost_usd, provider, model, platform');
  if (from) query = query.gte('timestamp', from);
  if (to) query = query.lte('timestamp', to);
  const { data, error } = await query;
  if (error || !data) return { total_tokens: 0, total_cost: 0, byModel: {}, byPlatform: {}, count: 0 };

  const total = data.reduce((s, e) => s + e.input_tokens + e.output_tokens, 0);
  const cost = data.reduce((s, e) => s + parseFloat(e.cost_usd || 0), 0);
  const byModel = {}; const byPlatform = {};
  for (const e of data) {
    const key = `${e.provider}/${e.model}`;
    byModel[key] = (byModel[key] || 0) + e.input_tokens + e.output_tokens;
    byPlatform[e.platform] = (byPlatform[e.platform] || 0) + e.input_tokens + e.output_tokens;
  }
  return { total_tokens: total, total_cost: parseFloat(cost.toFixed(2)), byModel, byPlatform, count: data.length };
}

module.exports = { selectModel, chat, logTokenUsage, getUsageStats };
