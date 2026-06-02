require('dotenv').config({ override: true });
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

const { loadConfigIntoProcessEnv } = require('./core/config_store');
loadConfigIntoProcessEnv();

const express = require('express');
const path = require('path');
const cors = require('cors');
const logger = require('./utils/logger');

// Routes
const whatsappRouter  = require('./routes/whatsapp');
const facebookRouter  = require('./routes/facebook');
const instagramRouter = require('./routes/instagram');
const apiRouter       = require('./routes/api');

const app = express();
app.use(cors());
app.get('/labels/label_:id.pdf', async (req, res, next) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, 'labels', `label_${id}.pdf`);
  const fs = require('fs');
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  try {
    const supabase = require('./lib/supabase');
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error || !order) {
      return res.status(404).send('Order not found');
    }
    
    const { generateShippingLabel } = require('./core/shipping_label');
    const orderForPdf = {
      id,
      phone: order.phone,
      address: order.address,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []),
      grand_total: order.grand_total,
      status: order.status,
      platform: order.platform,
      created_at: order.created_at,
      shipping_cost: order.shipping_cost,
      wilaya: order.wilaya,
    };
    
    await generateShippingLabel(orderForPdf);
    
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else {
      return res.status(500).send('Failed to generate PDF');
    }
  } catch (e) {
    logger.error(`Dynamic PDF generation failed: ${e.message}`);
    return res.status(500).send(`Error generating PDF: ${e.message}`);
  }
});
app.use('/labels', express.static(path.join(__dirname, 'labels')));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Webhooks
app.use('/webhook/whatsapp',  whatsappRouter);
app.use('/webhook/facebook',  facebookRouter);
app.use('/webhook/instagram', instagramRouter);

// Meta-expected webhook path (under /api for convenience)
app.use('/api/whatsapp/webhook', whatsappRouter);

// REST API
app.use('/api', apiRouter);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage().rss });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled: ${err.message}`);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`CRM Bot running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET|POST /api/whatsapp/webhook              ← Meta webhook (verify + messages)`);
  console.log(`  POST     /webhook/whatsapp`);
  console.log(`  POST     /webhook/facebook`);
  console.log(`  POST     /webhook/instagram`);
  console.log(`  GET      /api/dashboard/stats`);
  console.log(`  GET      /api/products`);
  console.log(`  GET|POST /api/whatsapp/accounts             ← WhatsApp account CRUD`);
  console.log(`  POST     /api/ai-reply`);
  console.log(`  GET      /api/updates/stream                ← SSE real-time stream`);
  console.log(`  POST     /api/conversations/:id/reply       ← Manual agent reply`);
});
