const logger = require('./logger');

let clients = [];

function registerClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  logger.info(`SSE Client connected. Total clients: ${clients.length}`);

  // Send an initial heartbeat/ping
  res.write(': ping\n\n');

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    logger.info(`SSE Client disconnected. Total clients: ${clients.length}`);
  });
}

function broadcastUpdate(type, data) {
  logger.info(`Broadcasting SSE event: ${type}`);
  const payload = JSON.stringify({ type, data });
  
  clients.forEach(c => {
    try {
      c.write(`data: ${payload}\n\n`);
    } catch (e) {
      logger.error(`Error sending SSE to client: ${e.message}`);
    }
  });
}

module.exports = {
  registerClient,
  broadcastUpdate
};
