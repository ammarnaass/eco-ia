# 🤖 eco-ia — نظام CRM ذكي للتجارة الإلكترونية
> **Smart CRM for E-Commerce** — AI-powered multi-channel chatbot & management dashboard for WhatsApp, Facebook Messenger & Instagram.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.15.0-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express-4.21.0-blue?logo=express" />
  <img src="https://img.shields.io/badge/React-19.2.6-blue?logo=react" />
  <img src="https://img.shields.io/badge/Vite-8.0.14-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-4.3.0-cyan?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/AI-Claude%20%7C%20Gemini%20%7C%20GPT-ff6b6b" />
</p>

---

## 📌 نظرة عامة

**eco-ia** هو نظام CRM متكامل للتجارة الإلكترونية في الجزائر والعالم العربي، يجمع بين:

- 🤖 **بوت ذكي** متعدد القنوات (واتساب + فيسبوك ماسنجر + إنستغرام)
- 📊 **لوحة تحكم** احترافية لإدارة المحادثات والطلبات والمنتجات
- 🧠 **موجه ذكي** يختار أفضل نموذج AI (Claude / Gemini / GPT) حسب نوع المحادثة
- 📦 **إدارة طلبات** كاملة مع فواتير PDF وربط شركات الشحن
- 📈 **تحليلات** استخدام الذكاء الاصطناعي وتكاليف الـ API

---

## 🏗️ البنية المعمارية

```
eco-ia/
├── crm-bot/              # Backend (Express + PostgreSQL/Supabase)
│   ├── webhook.js        # نقطة الدخول الرئيسية
│   ├── core/             # منطق الأعمال (AI Router, Orders, Messaging)
│   ├── routes/           # WhatsApp, Facebook, Instagram, REST API
│   ├── utils/            # helpers (encryption, PDF, email, SSE)
│   └── tests/            # اختبارات تكامل
├── dashboard/            # Frontend (React 19 + Vite + Tailwind CSS)
│   └── src/pages/        # Dashboard, Inbox, Orders, Settings
└── mcp-server/           # خادم MCP (Model Context Protocol)
```

### تدفق النظام

```
[WhatsApp / FB / IG Webhook] → [crm-bot webhook.js] → [message_processor.js]
                                                                  │
                                            ┌────────────────────┼────────────────────┐
                                            ▼                    ▼                    ▼
                                    [AI Router]          [order_manager]       [sendReply]
                                    (Claude/GPT)         (Orders + PDF)       (Graph API)
                                            │                    │                    │
                                            └────────────────────┼────────────────────┘
                                                                 ▼
                                                    [SSE Broadcast] → Dashboard Inbox (Real-time)
```

---

## ✨ الميزات

### 🤖 بوت ذكي متعدد القنوات
| القناة | الاستقبال | الرد التلقائي | الرد اليدوي | تعليقات |
|--------|-----------|---------------|-------------|---------|
| **واتساب** | ✅ Webhook | ✅ AI / إيقاف | ✅ | — |
| **فيسبوك ماسنجر** | ✅ Webhook | ✅ AI / إيقاف | ✅ | — |
| **إنستغرام** | ✅ Webhook | ✅ AI / إيقاف | ✅ | ✅ Toggle |

### 🧠 AI Router ذكي
- **5 أنواع نية** (intent classification): سؤال عام، طلب منتج، استفسار عن طلب، شكوى، أمر مشرف
- **اختيار النموذج التلقائي** حسب طبيعة المحادثة
- **دعم 3 مزودين**: Claude (Anthropic), Gemini (Google), GPT (OpenAI)
- **تخصيص نموذج لكل قناة** — يمكن اختيار نموذج مختلف لكل من واتساب وفيسبوك وإنستغرام

### 📊 لوحة التحكم
- **Dashboard** — إحصائيات ورسوم بيانية للمحادثات والطلبات
- **Inbox** — صندوق بريد مباشر (SSE real-time) مع ردود يدوية/ذكية
- **Orders** — إدارة الطلبات CRUD + فلترة + تحديث الحالة
- **Products** — إدارة المنتجات مع تفعيل/تعطيل
- **Token Analytics** — تحليل استهلاك الـ API وتكاليفه
- **Settings** — إعدادات متكاملة منظمة في تبويبات:
  - 📱 واتساب — حسابات + Webhook URLs
  - 💬 فيسبوك + إنستغرام — رموز وصول منفصلة + اختبار اتصال
  - 🤖 القنوات — تفعيل AI + اختيار النماذج
  - 🔑 مفاتيح API — Google / OpenAI / Anthropic
  - 🚚 الشحن — أسعار الولايات الجزائرية (58 ولاية)
  - 💰 الميزانية — حدود صرف + أمان
  - ⚙️ خدمات — Cloudinary / Sheets / Gmail SMTP

### 📦 إدارة الطلبات
- **ربط تلقائي** مع المحادثات (اكتشاف اسم + رقم + ولاية)
- **فاتورة PDF** تُولد تلقائياً مع كل طلب
- **إرسال عبر واتساب** — رابط الفاتورة PDF
- **إرسال عبر البريد** — Gmail SMTP + مرفق PDF
- **ربط شركات الشحن** — Yalidine Express, Maystro Delivery

---

## 🚀 التشغيل السريع

### المتطلبات
- Node.js **v24.15.0+**
- PostgreSQL (أو Supabase)
- حسابات API: Meta (WhatsApp/FB/IG), Google AI, OpenAI, Anthropic

### 1. استنساخ المستودع

```bash
git clone https://github.com/ammarnaass/eco-ia.git
cd eco-ia
```

### 2. الخادم Backend (`crm-bot/`)

```bash
cd crm-bot
cp .env.example .env
npm install
npm start          # الإنتاج
npm run dev        # التطوير (watch mode)
```

**متغيرات البيئة (`crm-bot/.env`):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Meta APIs
FB_VERIFY_TOKEN=your_verify_token
FB_PAGE_TOKEN=EAALxxxxx
INSTAGRAM_BUSINESS_ID=178414xxxxx
INSTAGRAM_ACCESS_TOKEN=EAALxxxxx       # اختياري — يُستخدم إن وجد
META_APP_SECRET=xxxxx

# AI Providers
GOOGLE_AI_API_KEY=AIzaSxxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Encryption
ENCRYPTION_KEY=xxxxx

# Admin
ADMIN_PHONE=213xxxxxxxxx

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=Your Store Name

# Shipping
YALIDINE_KEY=xxxxx
MAYSTRO_KEY=xxxxx
```

### 3. الواجهة الأمامية (`dashboard/`)

```bash
cd dashboard
cp .env.example .env
npm install
npm run dev        # التطوير (localhost:5173)
npm run build      # بناء الإنتاج
npm run preview    # معاينة البناء
```

**متغيرات البيئة (`dashboard/.env`):**

```env
VITE_API_URL=http://localhost:3000/api

# Supabase — قراءة مباشرة من الواجهة (Anon Key آمن للعموم)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...      # Anon/Publishable Key
```

---

## 🔌 الربط بقاعدة البيانات (Hybrid Architecture)

يستخدم المشروع **استراتيجية هجينة ذكية** للوصول إلى Supabase:

```
┌─────────────────────────────────────────────────────┐
│         Dashboard (React + Vite)                    │
├─────────────────────────────────────────────────────┤
│  dataService.js (طبقة وسيطة موحدة)                  │
│   ├─ READ  (GET)    → Supabase مباشرة ⚡            │
│   └─ WRITE + منطق  → Backend (crm-bot) 🔒          │
└─────────────────────────────────────────────────────┘
           ↓                          ↓
   (Supabase REST)            (Express + CORS)
           ↓                          ↓
           └─────────→ Supabase PostgreSQL
```

### القاعدة الذهبية
| نوع الطلب | المسار | السبب |
|---|---|---|
| **GET** (عرض، قراءة) | Supabase مباشرة | ⚡ أسرع، أبسط |
| **POST/PUT/DELETE** (كتابة) | Backend | 🔒 منطق تجاري |
| **AI, PDF, Email, Webhooks** | Backend فقط | 🧠 معالجة معقدة |
| **SSE (real-time updates)** | Backend | 🔄 streams فقط |

### الفوائد
- ⚡ **أداء عالي**: استعلامات القراءة أسرع بمرتين (skip الـ Backend)
- 🔄 **Fallback تلقائي**: لو Supabase فشل → Backend تلقائياً
- 🔒 **أمان**: Service Role Key يبقى في Backend فقط
- 🎯 **شفافية**: badge صغير يظهر مصدر البيانات ("Supabase" أو "Backend")
- 💰 **تكلفة أقل**: ضغط أقل على Backend

### الملفات الرئيسية
- `dashboard/src/lib/dataService.js` — الطبقة الوسيطة الموحدة
- `dashboard/src/utils/supabase.js` — Supabase client محسّن
- `dashboard/src/api.js` — Backend API client

### Fallback السلوك
```js
// مثال: dataService.products.list()
const { data, source } = await dataService.products.list()
// source: 'supabase' أو 'backend'
```

---

## 🔌 API Endpoints

### Webhooks (للربط مع Meta Developers)

| الطريقة | المسار | الغرض |
|---------|--------|-------|
| `GET/POST` | `/api/whatsapp/webhook` | واتساب — تحقق + رسائل |
| `GET/POST` | `/webhook/facebook` | فيسبوك ماسنجر |
| `GET/POST` | `/webhook/instagram` | إنستغرام (DM + تعليقات) |

### REST API

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/dashboard/stats` | إحصائيات لوحة التحكم |
| `GET` | `/api/products` | قائمة المنتجات |
| `POST` | `/api/products` | إضافة منتج |
| `PUT` | `/api/products/:id` | تعديل منتج |
| `DELETE` | `/api/products/:id` | حذف منتج |
| `GET` | `/api/orders` | قائمة الطلبات |
| `PUT` | `/api/orders/:id` | تعديل طلب + إعادة PDF |
| `POST` | `/api/orders/:id/send-whatsapp` | إرسال الفاتورة عبر واتساب |
| `POST` | `/api/orders/:id/send-email` | إرسال الفاتورة عبر بريد |
| `GET` | `/api/conversations` | قائمة المحادثات |
| `POST` | `/api/conversations/:id/reply` | رد يدوي على عميل |
| `POST` | `/api/ai-reply` | رد AI عبر API |
| `GET` | `/api/tokens/summary` | ملخص استهلاك الـ Tokens |
| `GET` | `/api/tokens/by-model` | حسب النموذج |
| `GET` | `/api/tokens/by-platform` | حسب المنصة |
| `GET` | `/api/config` | قراءة إعدادات النظام |
| `POST` | `/api/config` | حفظ الإعدادات |
| `GET` | `/api/whatsapp/accounts` | قائمة حسابات واتساب |
| `POST` | `/api/whatsapp/accounts` | إضافة حساب واتساب |
| `POST` | `/api/test-connection` | اختبار اتصال Meta API |
| `GET` | `/api/updates/stream` | **SSE** — تحديثات مباشرة |
| `GET` | `/health` | حالة الخادم |

---

## 🗄️ قاعدة البيانات (PostgreSQL)

الجداول الرئيسية (`crm-bot/db/schema.sql`):

- `app_config` — إعدادات النظام (key-value)
- `conversations` — المحادثات (مغلقة/مفتوحة + messages JSONB)
- `orders` — الطلبات (items JSONB + PDF link)
- `products` — المنتجات (اسم، سعر، صورة، active)
- `token_usage` — سجل استهلاك AI (model, tokens, cost, platform)
- `whatsapp_accounts` — حسابات واتساب (مشفرة AES-256-GCM)

---

## 🧪 الاختبارات

```bash
cd crm-bot
node tests/all.test.js          # 19 اختبار تكامل
node tests/meta_webhooks.test.js # اختبارات Webhooks
```

---

## 🐳 Docker

```bash
cd crm-bot
docker build -t eco-ia-bot .
docker run -p 3000:3000 --env-file .env eco-ia-bot
```

---

## ☁️ النشر

### Railway / Render
يحتوي المشروع على `Procfile` و `Dockerfile` جاهزين للنشر المباشر.

### خطوات النشر السريع
1. ربط المستودع بـ Railway / Render
2. تعيين متغيرات البيئة (Environment Variables)
3. تفعيل Webhook URLs في Meta Developers
4. تعيين الـ Callback URLs للإنتاج (`https://your-domain.com/webhook/...`)

---

## 🛡️ الأمان

- **AES-256-GCM** لتشفير رموز الوصول (WhatsApp / Meta)
- **HMAC-SHA256** للتحقق من توقيع Webhooks (X-Hub-Signature-256)
- **process.env** للمفاتيح الحساسة
- **CORS** مفعّل

---

## 📝 الترخيص

MIT License — حرية الاستخدام والتعديل والتوزيع.

---

## 🙏 تقدير

تم بناء هذا المشروع باستخدام:
- [Express](https://expressjs.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Meta Graph API](https://developers.facebook.com/)
- [Anthropic](https://anthropic.com/) / [Google AI](https://ai.google.dev/) / [OpenAI](https://openai.com/)

---

<p align="center">
  صنع بحب ❤️ في الجزائر 🇩🇿
</p>
