const { getAll, getOne, runQuery } = require('./config/database');
const logger = require('./config/logger');

let influxClient = null;
let mqttClient = null;

function initIntegrations(config) {
  initInfluxDB(config.influx);
  initMQTTBridge(config.mqtt);
}

async function initInfluxDB(config) {
  if (!config?.url) {
    logger.info('InfluxDB not configured, skipping...');
    return;
  }
  
  try {
    const { InfluxDB, Point } = require('@influxdata/influxdb-client');
    influxClient = new InfluxDB({ url: config.url, token: config.token });
    logger.info('InfluxDB client initialized');
  } catch (err) {
    logger.warn('InfluxDB initialization failed:', err.message);
  }
}

async function writeSensorDataToInflux(sensorType, value, tags = {}) {
  if (!influxClient) return;
  
  try {
    const { Point } = require('@influxdata/influxdb-client');
    const writeApi = influxClient.getWriteApi(config.influx.org, config.influx.bucket);
    
    const point = new Point('sensor_data')
      .tag('type', sensorType)
      .floatField('value', value)
      .timestamp(new Date());
    
    Object.entries(tags).forEach(([key, val]) => point.tag(key, val));
    
    await writeApi.writePoint(point);
    await writeApi.close();
  } catch (err) {
    logger.error('InfluxDB write error:', err.message);
  }
}

function initMQTTBridge(config) {
  if (!config?.broker) {
    logger.info('MQTT bridge not configured, skipping...');
    return;
  }
  
  try {
    const mqtt = require('mqtt');
    mqttClient = mqtt.connect(config.broker, {
      clientId: 'ecosyntech-bridge',
      username: config.username,
      password: config.password
    });
    
    mqttClient.on('connect', () => {
      logger.info('MQTT bridge connected');
      mqttClient.subscribe('ecosyntech/#', { qos: 1 });
    });
    
    mqttClient.on('message', (topic, message) => {
      handleMQTTMessage(topic, message.toString());
    });
    
    mqttClient.on('error', (err) => {
      logger.error('MQTT bridge error:', err.message);
    });
  } catch (err) {
    logger.warn('MQTT bridge initialization failed:', err.message);
  }
}

function handleMQTTMessage(topic, message) {
  try {
    const data = JSON.parse(message);
    const parts = topic.split('/');
    
    if (parts[1] === 'sensors') {
      const sensorType = parts[2];
      runQuery(
        'INSERT INTO sensor_readings (id, sensor_type, value, timestamp) VALUES (?, ?, ?, ?)',
        [require('uuid').v4(), sensorType, data.value, new Date().toISOString()]
      );
      
      runQuery(
        'UPDATE sensors SET value = ?, timestamp = ? WHERE type = ?',
        [data.value, new Date().toISOString(), sensorType]
      );
    }
    
    if (parts[1] === 'devices') {
      const deviceId = parts[2];
      runQuery(
        'UPDATE devices SET status = ?, last_seen = ? WHERE id = ?',
        [data.status, new Date().toISOString(), deviceId]
      );
    }
  } catch (err) {
    logger.error('MQTT message handling error:', err.message);
  }
}

function publishToMQTT(topic, message) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, JSON.stringify(message), { qos: 1 });
  }
}

function getInfluxClient() {
  return influxClient;
}

function getMQTTClient() {
  return mqttClient;
}

function closeIntegrations() {
  if (mqttClient) {
    mqttClient.end();
  }
  logger.info('Integrations closed');
}

module.exports = {
  initIntegrations,
  writeSensorDataToInflux,
  publishToMQTT,
  getInfluxClient,
  getMQTTClient,
  closeIntegrations
};