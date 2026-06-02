const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Send an email with an attachment using SMTP settings from the environment configuration.
 * @param {Object} params
 * @param {string} params.to Recipient email address
 * @param {string} params.subject Subject line
 * @param {string} params.html HTML content of the email
 * @param {string} params.filePath Absolute path of file to attach
 * @param {string} params.fileName Desired name of attachment in email
 * @returns {Promise<boolean>} Success state
 */
async function sendEmailWithAttachment({ to, subject, html, filePath, fileName }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass) {
    logger.warn('Cannot send email — SMTP_USER or SMTP_PASS not configured');
    throw new Error('SMTP credentials are not configured in Settings.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${from.split('@')[0]}" <${from}>`,
      to,
      subject,
      html,
    };

    if (filePath && fs.existsSync(filePath)) {
      mailOptions.attachments = [
        {
          filename: fileName || path.basename(filePath),
          path: filePath,
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (e) {
    logger.error(`Error sending email: ${e.message}`);
    throw e;
  }
}

module.exports = { sendEmailWithAttachment };
