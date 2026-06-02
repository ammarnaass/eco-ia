# PROJECT MAP — CRM الذكي للتجارة الإلكترونية

**آخر تحديث:** 2026-05-28 | **Node.js:** v24.15.0 | **حالة المشروع:** ✅ كامل

---

## TECH_STACK

| الطبقة | التقنية | الإصدار | الحالة |
|--------|---------|---------|--------|
| Runtime | Node.js | 24.15.0 LTS | ✅ |
| Backend | Express | ^4.21.0 | ✅ |
| AI Router | Claude + Gemini + OpenAI | — | ✅ |
| PDF | pdfkit | ^0.15.0 | ✅ |
| Sheets | googleapis | ^140.0.0 | ✅ |
| Frontend | React | ^19.2.6 | ✅ |
| Charts | recharts | ^3.8.1 | ✅ |
| Build | Vite | ^8.0.14 | ✅ |
| CSS | Tailwind CSS | ^4.3.0 | ✅ |
| MCP Layer | Model Context Protocol SDK | ^1.12.1 | ✅ |

---

## SYSTEM_FLOW

```
[WhatsApp/FB/IG Webhook] ──POST──► [webhook.js] ──routes──► routes/
                                      │
                                      ▼
                              [message_processor.js]
                                │ classifyIntent() ← 5 أنواع
                                │ selectModel() ← AI Router
                                ▼
                              [unified_ai.js]
                                │ chat(provider, model, ...)
                                │ logTokenUsage() + cost calc
                                ▼
                        ┌───────┴────────┐
                        ▼                ▼
                  [order_manager]    [utils/whatsapp.js]
                  saveOrder()        sendReply() → Graph API
                  + generatePDF()
                  + notifyAdmin()
                  + appendToSheet()
                                         │
                                         ▼
                                    [utils/sse.js]
                                    broadcastUpdate() → SSE stream
                                         │
                                         ▼
[Frontend SPA] ◄── REST API ──── [routes/api.js]
  │             ◄── SSE Stream ──  /api/updates/stream (real-time)
  │                                 12+ endpoints
  ├── Dashboard ─── stats + charts
  ├── Inbox ─────── real-time chat workspace + manual/AI replies
  ├── Orders ────── orders CRUD
  ├── Products ──── products grid
  ├── Tokens ────── token analytics
  └── Settings ──── system config
```

---

## ARCHITECTURE

```
eco-ia/
├── PROJECT_MAP.md
│
├── crm-bot/                          # Backend
│   ├── webhook.js                    # Entry: slim Express server
│   ├── package.json
│   ├── Procfile                      # Railway/Render deployment
│   ├── Dockerfile                    # Container deployment
│   ├── .env.example
│   ├── .gitignore
│   ├── shipping_config.json
│   ├── tests/
│   │   └── all.test.js               # 20 integration tests ✅
│   ├── utils/
│   │   ├── logger.js                 # Async file logging
│   │   ├── token_cost.js             # 6 model pricing tables
│   │   ├── encryption.js             # AES-256-GCM encrypt/decrypt
│   │   ├── whatsapp.js               # Reusable WhatsApp Graph API sender
│   │   └── sse.js                    # SSE client registry + broadcast
│   ├── middleware/
│   │   └── signature.js              # X-Hub-Signature-256 verification
│   ├── core/
│   │   ├── message_processor.js      # Intent classifier + AI router + SSE broadcast
│   │   ├── unified_ai.js             # Claude/Gemini/OpenAI + token log
│   │   ├── order_manager.js          # Orders + Sheets + PDF
│   │   ├── shipping_label.js         # PDF generation
│   │   ├── admin_commands.js         # WhatsApp admin commands
│   │   ├── admin_notifier.js         # Budget alerts + notifications
│   │   └── whatsapp_store.js         # Encrypted per-account storage
│   ├── routes/
│   │   ├── whatsapp.js               # WhatsApp webhook (GET verify + POST signed)
│   │   ├── facebook.js               # Messenger webhook
│   │   ├── instagram.js              # Instagram DM + comments
│   │   └── api.js                    # REST API (12+ endpoints) + SSE stream
│   └── db/
│       └── schema.sql                # PostgreSQL (6 tables)
│
├── dashboard/                        # Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Procfile
│   ├── .env / .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                   # Router
│       ├── Layout.jsx                # Shell
│       ├── api.js                    # API client (16 methods)
│       ├── index.css                 # Tailwind base + Cairo font + scrollbar
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── StatsCard.jsx
│       └── pages/
│           ├── Dashboard.jsx         # API-connected ✅
│           ├── Inbox.jsx             # Real-time chat workspace + SSE ✅
│           ├── Orders.jsx            # API-connected ✅
│           ├── Products.jsx          # API-connected ✅
│           ├── TokenAnalytics.jsx    # API-connected ✅
│           └── Settings.jsx          # WhatsApp connect + config
│
├── mcp-server/                       # MCP Server Layer (ESM + TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # Entry point (loads env, starts transport)
│   │   ├── env.ts                    # Pre-load environment variables loader
│   │   ├── server.ts                 # Server setup and tool registry
│   │   ├── bridge.ts                 # CJS-to-ESM bridges and direct client exports
│   │   └── tools/
│   │       ├── messages.ts           # WhatsApp messaging & conversation tools (5 tools)
│   │       ├── contacts.ts           # WhatsApp account details tools (2 tools)
│   │       ├── orders.ts             # Orders lookup and management tools (2 tools)
│   │       ├── products.ts           # Products management tools (4 tools)
│   │       └── analytics.ts          # CRM stats & Token usage tools (2 tools)
│   └── dist/                         # Compiled JavaScript output
```

---

## WHATSAPP CONNECTION FLOW

```
Settings UI                      Backend                          Meta
─────────                        ──────                           ────
User enters:
  phone_number_id  ──POST──►  api/whatsapp/accounts
  access_token                     │
  verify_token                     ▼
  waba_id                   whatsapp_store.js
                            encrypt(access_token) ← ENCRYPTION_KEY
                            encrypt(verify_token)
                            stored in memory (→ DB in prod)

                               │
Meta webhook config:           ▼
  Callback URL:         GET /api/whatsapp/webhook
    ?hub.verify_token=         │
    &hub.challenge             ▼
                         findAccountByVerifyToken()
                         matches → echoes hub.challenge back
                         
                               │
Inbound message:        POST /api/whatsapp/webhook
  X-Hub-Signature-256          │
                               ▼
                         signature.js → verify HMAC ← META_APP_SECRET
                               │
                               ▼
                         message_processor.js → AI reply
                               │
                               ▼
                         utils/whatsapp.js → sendReply()
                               │  getDefaultAccount()
                               │  decrypt(access_token)
                               │  POST to Graph API
                               │
                               ▼
                         utils/sse.js → broadcastUpdate()
                               │  push to all connected dashboards
                               ▼
                         Dashboard Inbox (EventSource) → live update
```

---

## MILESTONES — ALL VERIFIED

| M | الهدف | الحالة | التحقق |
|---|-------|--------|--------|
| M1 | إعادة هيكلة backend (core/ + routes/ + db/ + utils/) | ✅ | 13 ملفاً يتحملون بدون أخطاء |
| M2 | AI Router متعدد النماذج (Claude + Gemini + OpenAI) | ✅ | selectModel() + 3 callers |
| M3 | message_processor مع تصنيف النية (5 أنواع) | ✅ | classifyIntent() + 6 اختبارات |
| M4 | REST API للوحة التحكم (12+ endpoints) | ✅ | /dashboard/stats, /products, /conversations, /orders, /tokens, /updates/stream, /conversations/:id/reply |
| M5 | ربط جميع صفحات dashboard بـ API حقيقي | ✅ | 5 من 6 صفحات متصلة (Inbox, Orders, Products, Tokens, Dashboard) |
| M6 | Token logging + حساب التكاليف + إشعارات المشرف | ✅ | unified_ai.js + admin_notifier.js |
| M7 | اختبارات تكامل (19 test) | ✅ | `node tests/all.test.js` → 19/19 ✅ |
| M8 | إعدادات النشر (Procfile, Dockerfile, .env) | ✅ | Railway/Render-ready |
| M9 | تحديثات مباشرة SSE + Inbox redesign + رد يدوي | ✅ | sse.js + EventSource + manual/AI reply |
| M10 | طبقة خادم MCP (14 أداة ذكية) | ✅ | تكامل TypeScript مع @modelcontextprotocol/sdk |

---

## PENDING (تحسينات غير حرجة)

- [ ] إضافة صفحة تسجيل دخول (JWT auth)
- [x] ~~إضافة Socket.io للتحديثات المباشرة في dashboard~~ → تم بـ SSE (أخف وبدون مكتبات إضافية)
- [ ] نشر على Railway / Render مع HTTPS
