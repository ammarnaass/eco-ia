const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { ArabicShaper } = require('arabic-persian-reshaper');

// Helper to check if string contains Arabic characters
function containsArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

// Advanced helper to reshape and reverse Arabic text, keeping numbers and English LTR
function formatArabicPDF(text) {
  if (text === undefined || text === null) return '';
  const str = String(text).trim();
  if (!str) return '';
  
  // Split into words to handle mixed language and layout
  const words = str.split(' ');
  const processedWords = words.map(word => {
    if (containsArabic(word)) {
      // Shape Arabic characters
      const shaped = ArabicShaper.convertArabic(word);
      // Reverse the characters of the shaped Arabic word
      return shaped.split('').reverse().join('');
    } else {
      // Keep numbers / English as is
      return word;
    }
  });

  // Reverse the order of the words for correct RTL display
  return processedWords.reverse().join(' ');
}

async function generateShippingLabel(order) {
  const orderId = order.id || order.order_id || '—';
  const shippingPhone = order.phone || (order.shipping && order.shipping.phone) || '';
  const wilaya = order.wilaya || '';
  
  let clientName = 'العميل';
  let clientAddress = 'غير محدد';
  
  if (order.shipping && order.shipping.name) {
    clientName = order.shipping.name;
    clientAddress = order.shipping.address || 'غير محدد';
  } else if (order.address) {
    const parts = order.address.split(',');
    clientName = parts[0] ? parts[0].trim() : 'العميل';
    clientAddress = parts.slice(1).join(',').trim() || 'غير محدد';
  }

  const items = order.items || [];
  const shippingCost = parseFloat(order.shipping_cost || 0);
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.qty || 1)), 0);
  // Total is subtotal + shipping cost
  const total = subtotal + shippingCost;
  
  const platform = order.platform || 'whatsapp';
  const status = order.status || 'CONFIRMED';
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('ar-DZ') : new Date().toLocaleDateString('ar-DZ');

  // Create A5 Document
  const doc = new PDFDocument({ size: 'A5', margin: 20 });
  const filename = `label_${orderId}.pdf`;
  const labelsDir = path.join(__dirname, '..', 'labels');
  const filePath = path.join(labelsDir, filename);

  if (!fs.existsSync(labelsDir)) {
    fs.mkdirSync(labelsDir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Register Amiri Arabic Font
  const fontPath = path.join(__dirname, '..', 'Amiri-Regular.ttf');
  const hasAmiri = fs.existsSync(fontPath);
  if (hasAmiri) {
    doc.registerFont('Amiri', fontPath);
  }

  // Set base font
  const arabicFont = hasAmiri ? 'Amiri' : 'Helvetica';
  const englishFont = 'Helvetica';
  
  // --- HEADER SECTION ---
  // Logo check and placement
  const logoPngPath = path.join(__dirname, '..', 'logo.png');
  const logoJpgPath = path.join(__dirname, '..', 'logo.jpg');
  const logoJpegPath = path.join(__dirname, '..', 'logo.jpeg');
  
  let finalLogoPath = null;
  if (fs.existsSync(logoPngPath)) finalLogoPath = logoPngPath;
  else if (fs.existsSync(logoJpgPath)) finalLogoPath = logoJpgPath;
  else if (fs.existsSync(logoJpegPath)) finalLogoPath = logoJpegPath;

  if (finalLogoPath) {
    try {
      // Draw store logo
      doc.image(finalLogoPath, 20, 20, { width: 55, height: 55 });
    } catch (e) {
      logger.error(`Error rendering logo image in PDF: ${e.message}`);
    }
  } else {
    // Draw an elegant dotted placeholder where the logo can be uploaded
    doc.save();
    doc.strokeColor('#cbd5e1').lineWidth(1).dash(4, { space: 2 });
    doc.rect(20, 20, 55, 55).stroke();
    doc.restore();
    
    doc.fillColor('#94a3b8');
    if (hasAmiri) {
      doc.font('Amiri').fontSize(9).text(formatArabicPDF('شعار'), 20, 35, { width: 55, align: 'center' });
      doc.fontSize(8).text(formatArabicPDF('المتجر'), 20, 48, { width: 55, align: 'center' });
    } else {
      doc.font('Helvetica').fontSize(8).text('LOGO', 20, 40, { width: 55, align: 'center' });
    }
  }

  // Store Title & Subtitle (Aligned Right)
  doc.fillColor('#1e293b');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(20).text(formatArabicPDF('متجر الذكاء الاصطناعي'), 120, 20, { align: 'right', width: doc.page.width - 140 });
    doc.fillColor('#64748b').fontSize(10).text(formatArabicPDF('حلول تقنية وخدمات ذكية متكاملة'), 120, 45, { align: 'right', width: doc.page.width - 140 });
  } else {
    doc.font('Helvetica-Bold').fontSize(16).text('AI STORE', 120, 20, { align: 'right', width: doc.page.width - 140 });
    doc.fillColor('#64748b').fontSize(9).text('Smart Integrated Solutions', 120, 42, { align: 'right', width: doc.page.width - 140 });
  }

  // Header Divider
  doc.moveTo(20, 85).lineTo(doc.page.width - 20, 85).strokeColor('#e2e8f0').lineWidth(1.5).stroke();

  // --- INFO CARDS (METADATA & CLIENT DETAILS) ---
  let yOffset = 95;

  // 1. Invoice Meta Card (Left Column)
  doc.save();
  doc.roundedRect(20, yOffset, 175, 105, 8).fillColor('#f8fafc').fill();
  doc.roundedRect(20, yOffset, 175, 105, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.restore();

  doc.fillColor('#0f172a').font(englishFont).fontSize(9);
  doc.text(`Invoice ID: #${orderId}`, 30, yOffset + 12);
  doc.text(`Date: ${dateStr}`, 30, yOffset + 32);
  doc.text(`Platform: ${platform.toUpperCase()}`, 30, yOffset + 52);
  
  // Status Badge inside Meta Card
  const statusLabelMap = {
    CONFIRMED: 'مؤكد', PROCESSING: 'قيد المعالجة', SHIPPED: 'تم الشحن',
    DELIVERED: 'تم التسليم', CANCELLED: 'ملغي', RETURNED: 'مرتجع',
  };
  const arStatus = statusLabelMap[status] || status;
  doc.fillColor('#475569');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(9.5).text(formatArabicPDF(`حالة الطلب: ${arStatus}`), 30, yOffset + 75);
  } else {
    doc.font('Helvetica').text(`Status: ${status}`, 30, yOffset + 75);
  }

  // 2. Client Details Card (Right Column, RTL style)
  doc.save();
  doc.roundedRect(205, yOffset, 194, 105, 8).fillColor('#f8fafc').fill();
  doc.roundedRect(205, yOffset, 194, 105, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.restore();

  doc.fillColor('#1e293b');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(11).text(formatArabicPDF('معلومات العميل والشحن'), 215, yOffset + 10, { align: 'right', width: 174 });
    doc.moveTo(215, yOffset + 26).lineTo(389, yOffset + 26).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
    
    doc.fillColor('#334155').fontSize(10);
    doc.text(formatArabicPDF(`العميل: ${clientName}`), 215, yOffset + 34, { align: 'right', width: 174 });
    doc.text(formatArabicPDF(`الهاتف: ${shippingPhone}`), 215, yOffset + 50, { align: 'right', width: 174 });
    
    const locationStr = wilaya ? `${wilaya} - ${clientAddress}` : clientAddress;
    doc.text(formatArabicPDF(`العنوان: ${locationStr}`), 215, yOffset + 66, { align: 'right', width: 174 });
  } else {
    doc.font('Helvetica-Bold').fontSize(10).text('SHIP TO / CLIENT', 215, yOffset + 10);
    doc.moveTo(215, yOffset + 24).lineTo(389, yOffset + 24).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(9);
    doc.text(`Name: ${clientName}`, 215, yOffset + 32);
    doc.text(`Phone: ${shippingPhone}`, 215, yOffset + 48);
    doc.text(`Address: ${wilaya} ${clientAddress}`, 215, yOffset + 64);
  }

  yOffset += 120;

  // --- ITEMS TABLE SECTION ---
  // Table Header
  doc.save();
  doc.roundedRect(20, yOffset, doc.page.width - 40, 22, 4).fillColor('#f1f5f9').fill();
  doc.restore();

  doc.fillColor('#475569');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(10);
    doc.text(formatArabicPDF('المنتج'), 205, yOffset + 5, { width: 184, align: 'right' }); // Product name on the right
    doc.text(formatArabicPDF('الكمية'), 135, yOffset + 5, { width: 60, align: 'center' });
    doc.text(formatArabicPDF('السعر المفرد'), 80, yOffset + 5, { width: 50, align: 'center' });
    doc.text(formatArabicPDF('الإجمالي'), 25, yOffset + 5, { width: 50, align: 'left' });
  } else {
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Product', 30, yOffset + 6);
    doc.text('Qty', 145, yOffset + 6, { width: 40, align: 'center' });
    doc.text('Price', 225, yOffset + 6, { width: 60, align: 'center' });
    doc.text('Total', 330, yOffset + 6, { width: 60, align: 'right' });
  }

  yOffset += 28;

  // Table Body Rows
  let index = 0;
  for (const item of items) {
    const itemPrice = parseFloat(item.price || 0);
    const itemQty = parseInt(item.qty || 1);
    const itemTotal = itemPrice * itemQty;
    const itemName = item.name || 'منتج غير معروف';

    // Alternating row background for elegant premium look
    if (index % 2 === 1) {
      doc.save();
      doc.roundedRect(20, yOffset - 3, doc.page.width - 40, 20, 2).fillColor('#f8fafc').fill();
      doc.restore();
    }

    doc.fillColor('#0f172a');
    if (hasAmiri) {
      doc.font('Amiri').fontSize(9.5);
      doc.text(formatArabicPDF(itemName), 205, yOffset, { width: 184, align: 'right' });
      doc.font(englishFont).fontSize(9);
      doc.text(itemQty.toString(), 135, yOffset + 1, { width: 60, align: 'center' });
      doc.text(formatArabicPDF(`${itemPrice.toLocaleString()} دج`), 80, yOffset + 1, { width: 50, align: 'center' });
      doc.text(formatArabicPDF(`${itemTotal.toLocaleString()} دج`), 25, yOffset + 1, { width: 50, align: 'left' });
    } else {
      doc.font('Helvetica').fontSize(9);
      doc.text(itemName, 30, yOffset, { width: 110 });
      doc.text(itemQty.toString(), 145, yOffset, { width: 40, align: 'center' });
      doc.text(`${itemPrice.toLocaleString()} DZD`, 225, yOffset, { width: 60, align: 'center' });
      doc.text(`${itemTotal.toLocaleString()} DZD`, 330, yOffset, { width: 60, align: 'right' });
    }

    yOffset += 22;
    index++;
  }

  // Row bottom line divider
  doc.moveTo(20, yOffset + 2).lineTo(doc.page.width - 20, yOffset + 2).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
  yOffset += 12;

  // --- TOTAL SUMMARY CARD ---
  // Position it neatly at the bottom
  yOffset = Math.max(yOffset, doc.page.height - 135);

  doc.save();
  doc.roundedRect(20, yOffset, doc.page.width - 40, 75, 8).fillColor('#f8fafc').fill();
  doc.roundedRect(20, yOffset, doc.page.width - 40, 75, 8).strokeColor('#cbd5e1').lineWidth(1).stroke();
  doc.restore();

  // Summary Rows
  doc.fillColor('#475569');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(9.5);
    // Subtotal Row
    doc.text(formatArabicPDF('مجموع المنتجات:'), 30, yOffset + 10, { width: 200, align: 'left' });
    doc.text(formatArabicPDF(`${subtotal.toLocaleString()} دج`), 220, yOffset + 10, { width: 170, align: 'right' });
    
    // Shipping Cost Row
    doc.text(formatArabicPDF('تكلفة التوصيل:'), 30, yOffset + 28, { width: 200, align: 'left' });
    doc.text(formatArabicPDF(`${shippingCost.toLocaleString()} دج`), 220, yOffset + 28, { width: 170, align: 'right' });
    
    // Grand Total Row (Large Highlighted)
    doc.fillColor('#1d4ed8').font('Amiri').fontSize(13);
    doc.text(formatArabicPDF('المجموع الكلي المطلوب:'), 30, yOffset + 50, { width: 200, align: 'left' });
    doc.text(formatArabicPDF(`${total.toLocaleString()} دج`), 220, yOffset + 48, { width: 170, align: 'right' });
  } else {
    doc.font('Helvetica').fontSize(9);
    // Subtotal Row
    doc.text('Subtotal:', 35, yOffset + 10);
    doc.text(`${subtotal.toLocaleString()} DZD`, 310, yOffset + 10, { width: 75, align: 'right' });
    
    // Shipping Row
    doc.text('Shipping:', 35, yOffset + 28);
    doc.text(`${shippingCost.toLocaleString()} DZD`, 310, yOffset + 28, { width: 75, align: 'right' });
    
    // Grand Total Row
    doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(12);
    doc.text('GRAND TOTAL:', 35, yOffset + 50);
    doc.text(`${total.toLocaleString()} DZD`, 300, yOffset + 50, { width: 85, align: 'right' });
  }

  // --- FOOTER SECTION ---
  doc.fillColor('#94a3b8');
  if (hasAmiri) {
    doc.font('Amiri').fontSize(8.5).text(formatArabicPDF('شكراً لتسوقكم معنا وثقتكم في متجرنا!'), 20, doc.page.height - 35, { align: 'center', width: doc.page.width - 40 });
  } else {
    doc.font('Helvetica-Oblique').fontSize(8).text('Thank you for shopping with us!', 20, doc.page.height - 35, { align: 'center', width: doc.page.width - 40 });
  }

  // End PDF Document
  doc.end();

  // Return a promise that resolves when the PDF is fully written to disk
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      logger.info(`Invoice PDF generated successfully: ${filename}`);
      resolve(filename);
    });
    writeStream.on('error', (err) => {
      logger.error(`Error saving invoice PDF: ${err.message}`);
      reject(err);
    });
  });
}

module.exports = { generateShippingLabel };
