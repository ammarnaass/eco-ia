const fs = require('fs');
const path = require('path');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const logDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...(meta || {}) };
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(path.join(logDir, `${level}.log`), line, () => {});
  if (levels[level] <= levels.info) {
    const prefix = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '✓';
    console.log(`${prefix} [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
