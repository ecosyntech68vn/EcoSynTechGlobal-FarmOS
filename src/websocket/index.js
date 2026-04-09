const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

let wss = null;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    ws.clientId = clientId;
    ws.isAlive = true;
    clients.add(ws);

    logger.info(`WebSocket client connected: ${clientId}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(ws, data);
      } catch (err) {
        logger.error('Failed to parse WebSocket message:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket error for ${clientId}:`, err);
      clients.delete(ws);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString()
    }));
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WebSocket server initialized');
  return wss;
}

function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'auth':
      handleAuth(ws, data);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
    case 'subscribe':
      handleSubscribe(ws, data);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, data);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${data.type}` }));
  }
}

function handleAuth(ws, data) {
  const { token } = data;
  
  if (!token) {
    ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Token required' }));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    ws.user = decoded;
    ws.send(JSON.stringify({ 
      type: 'auth', 
      success: true, 
      user: { id: decoded.id, email: decoded.email, role: decoded.role }
    }));
    logger.info(`WebSocket client authenticated: ${decoded.email}`);
  } catch (err) {
    ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Invalid token' }));
  }
}

function handleSubscribe(ws, data) {
  const { topics } = data;
  
  if (!ws.subscriptions) {
    ws.subscriptions = new Set();
  }
  
  if (Array.isArray(topics)) {
    topics.forEach(topic => ws.subscriptions.add(topic));
  } else if (topics) {
    ws.subscriptions.add(topics);
  }
  
  ws.send(JSON.stringify({ 
    type: 'subscribed', 
    topics: Array.from(ws.subscriptions)
  }));
}

function handleUnsubscribe(ws, data) {
  const { topics } = data;
  
  if (!ws.subscriptions) return;
  
  if (Array.isArray(topics)) {
    topics.forEach(topic => ws.subscriptions.delete(topic));
  } else if (topics) {
    ws.subscriptions.delete(topics);
  }
  
  ws.send(JSON.stringify({ 
    type: 'unsubscribed', 
    topics: Array.from(ws.subscriptions)
  }));
}

function broadcast(data, topics = null) {
  const message = JSON.stringify(data);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (topics && client.subscriptions) {
        const hasMatchingTopic = topics.some(topic => client.subscriptions.has(topic));
        if (!hasMatchingTopic) return;
      }
      client.send(message);
    }
  });
}

function broadcastSensorUpdate(sensorData) {
  broadcast({
    type: 'sensor-update',
    data: sensorData,
    timestamp: new Date().toISOString()
  }, 'sensors');
}

function broadcastAlert(alertData) {
  broadcast({
    type: 'alert',
    data: alertData,
    timestamp: new Date().toISOString()
  }, 'alerts');
}

function broadcastDeviceUpdate(deviceData) {
  broadcast({
    type: 'device-update',
    data: deviceData,
    timestamp: new Date().toISOString()
  }, 'devices');
}

function getConnectedClients() {
  return clients.size;
}

module.exports = {
  initWebSocket,
  broadcast,
  broadcastSensorUpdate,
  broadcastAlert,
  broadcastDeviceUpdate,
  getConnectedClients
};
