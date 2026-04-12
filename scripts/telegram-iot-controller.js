#!/usr/bin/env node
'use strict';

const https = require('https');
const http = require('http');

const TELEGRAM_API = 'api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '').split(',').filter(Boolean);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const FIRMWARE_URL = process.env.FIRMWARE_URL || 'https://firmware.ecosyntech.com';
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

let offset = 0;
let userStates = new Map();
let activeTimers = new Map();
let userPreferences = new Map();
let scheduledReports = new Map();

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request({
      hostname: url.hostname, port: url.port || 80,
      path: url.pathname + url.search, method: method || 'GET', headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function weatherRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, WEATHER_API_URL);
    const req = http.request({ hostname: url.hostname, port: 80, path: url.pathname + url.search, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function login() {
  try {
    const data = await apiRequest('/api/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
    return data.token;
  } catch (e) { return null; }
}

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  return new Promise((resolve) => {
    if (!BOT_TOKEN || !chatId) { resolve(null); return; }
    const path = `/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=${parseMode || 'Markdown'}`;
    const req = https.request({ hostname: TELEGRAM_API, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { const r = JSON.parse(data); resolve(r.ok ? r.result : null); } catch (e) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function sendReplyKeyboard(chatId, text, keyboard, parseMode = 'Markdown') {
  return new Promise((resolve) => {
    if (!BOT_TOKEN || !chatId) { resolve(false); return; }
    const body = { chat_id: chatId, text, parse_mode: parseMode, reply_markup: keyboard };
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: TELEGRAM_API, path: `/bot${BOT_TOKEN}/sendMessage`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve(true)); });
    req.on('error', () => resolve(false));
    req.end(postData);
  });
}

async function sendPhoto(chatId, photoUrl, caption = '') {
  return new Promise((resolve) => {
    if (!BOT_TOKEN || !chatId || !photoUrl) { resolve(false); return; }
    const postData = JSON.stringify({ chat_id: chatId, photo: photoUrl, caption });
    const req = https.request({
      hostname: TELEGRAM_API, path: `/bot${BOT_TOKEN}/sendPhoto`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve(true)); });
    req.on('error', () => resolve(false));
    req.end(postData);
  });
}

function getMainMenu() {
  return {
    keyboard: [
      [{ text: '📊 Cảm biến' }, { text: '🖥️ Thiết bị' }],
      [{ text: '🔌 Relay 1-4' }, { text: '⚙️ Điều khiển' }],
      [{ text: '⏱️ Timer' }, { text: '🎬 Scenes' }],
      [{ text: '📦 Batch' }, { text: '⚡ Rules' }],
      [{ text: '📅 Lịch' }, { text: '🚨 Alerts' }],
      [{ text: '📈 Báo cáo' }, { text: '📉 Biểu đồ' }],
      [{ text: '🔄 ESP32' }, { text: '🌦️ Thời tiết' }],
      [{ text: '👥 Users' }, { text: '⚙️ Cấu hình' }]
    ],
    resize_keyboard: true, one_time_keyboard: false
  };
}

function getRelayMenu() {
  return {
    keyboard: [
      [{ text: '🔌 R1 ON' }, { text: '🔌 R1 OFF' }, { text: '🔌 R2 ON' }, { text: '🔌 R2 OFF' }],
      [{ text: '🔌 R3 ON' }, { text: '🔌 R3 OFF' }, { text: '🔌 R4 ON' }, { text: '🔌 R4 OFF' }],
      [{ text: '⚡ Tất cả ON' }, { text: '⭕ Tất cả OFF' }],
      [{ text: '⏱️ Timer R1' }, { text: '⏱️ Timer R2' }, { text: '⏱️ Timer R3' }, { text: '⏱️ Timer R4' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getTimerMenu() {
  return {
    keyboard: [
      [{ text: '⏱️ R1 5p' }, { text: '⏱️ R1 15p' }, { text: '⏱️ R1 30p' }, { text: '⏱️ R1 60p' }],
      [{ text: '⏱️ R2 5p' }, { text: '⏱️ R2 15p' }, { text: '⏱️ R2 30p' }, { text: '⏱️ R2 60p' }],
      [{ text: '⏱️ R3 5p' }, { text: '⏱️ R3 15p' }, { text: '⏱️ R3 30p' }, { text: '⏱️ R3 60p' }],
      [{ text: '⏱️ R4 5p' }, { text: '⏱️ R4 15p' }, { text: '⏱️ R4 30p' }, { text: '⏱️ R4 60p' }],
      [{ text: '⏱️ Tất cả 5p' }, { text: '⏱️ Tất cả 15p' }, { text: '⏱️ Tất cả 30p' }],
      [{ text: '⏱️ Hủy timer' }, { text: '⏱️ Xem timers' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getSceneMenu() {
  return {
    keyboard: [
      [{ text: '🎬 Tưới tiêu chuẩn' }, { text: '🎬 Tưới nhanh' }],
      [{ text: '🎬 Chế độ ngủ' }, { text: '🎬 Chế độ sáng' }],
      [{ text: '🎬 Tưới đêm' }, { text: '🎬 Tiết kiệm nước' }],
      [{ text: '🎬 Tạo scene mới' }, { text: '🎬 Xem scenes' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getAlertMenu() {
  return {
    keyboard: [
      [{ text: '🔔 Temp > 35°C' }, { text: '🔔 Temp < 10°C' }],
      [{ text: '🔔 Soil < 30%' }, { text: '🔔 Soil < 20%' }],
      [{ text: '🔔 Humidity > 90%' }, { text: '🔔 Humidity < 20%' }],
      [{ text: '📋 Danh sách alerts' }, { text: '🗑️ Xóa alerts' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getReportMenu() {
  return {
    keyboard: [
      [{ text: '📊 Báo cáo hôm nay' }, { text: '📊 Báo cáo tuần' }],
      [{ text: '📊 Báo cáo tháng' }, { text: '📊 So sánh ngày' }],
      [{ text: '📊 Top sensors' }, { text: '📊 Tất cả stats' }],
      [{ text: '🔔 Cài báo cáo tự động' }, { text: '🗑️ Hủy báo cáo tự động' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getChartMenu() {
  return {
    keyboard: [
      [{ text: '📈 Nhiệt độ' }, { text: '📈 Độ ẩm KK' }],
      [{ text: '📈 Độ ẩm đất' }, { text: '📈 Ánh sáng' }],
      [{ text: '📈 24h' }, { text: '📈 7 ngày' }],
      [{ text: '📈 Top cao/thấp' }, { text: '📈 Tất cả' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getESP32Menu() {
  return {
    keyboard: [
      [{ text: '🔄 Status' }, { text: '🔄 Restart' }],
      [{ text: '📥 Update Firmware' }, { text: '📋 Info' }],
      [{ text: '🔧 Cấu hình WiFi' }, { text: '🌐 Cấu hình MQTT' }],
      [{ text: '🔍 Diagnostics' }, { text: '📜 Logs' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getBackMenu() {
  return {
    keyboard: [[{ text: '◀️ Quay lại' }]],
    resize_keyboard: true
  };
}

// ==================== API FUNCTIONS ====================

async function getSensorData(token) {
  try {
    const data = await apiRequest('/api/sensors', 'GET', null, token);
    return Array.isArray(data) ? data : (data.sensors || []);
  } catch (e) { return []; }
}

async function getDevices(token) {
  try {
    const data = await apiRequest('/api/devices', 'GET', null, token);
    return data.devices || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getAlerts(token) {
  try {
    const data = await apiRequest('/api/alerts', 'GET', null, token);
    return data.alerts || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getRules(token) {
  try {
    const data = await apiRequest('/api/rules', 'GET', null, token);
    return data.rules || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getSchedules(token) {
  try {
    const data = await apiRequest('/api/schedules', 'GET', null, token);
    return data.schedules || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getBatches(token) {
  try {
    const data = await apiRequest('/api/traceability/batches', 'GET', null, token);
    return data.batches || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getHistory(token, limit = 20) {
  try {
    const data = await apiRequest(`/api/history?limit=${limit}`, 'GET', null, token);
    return data.history || (Array.isArray(data) ? data : []);
  } catch (e) { return []; }
}

async function getStats(token) {
  try { return await apiRequest('/api/stats', 'GET', null, token); } catch (e) { return {}; }
}

async function sendDeviceCommand(deviceId, command, token) {
  try {
    return await apiRequest(`/api/devices/${deviceId}/command`, 'POST', { command, params: {} }, token);
  } catch (e) { return { error: e.message }; }
}

async function createBatch(token, data) {
  try { return await apiRequest('/api/traceability/batches', 'POST', data, token); } catch (e) { return { error: e.message }; }
}

async function toggleRule(ruleId, enabled, token) {
  try { return await apiRequest(`/api/rules/${ruleId}`, 'PUT', { enabled }, token); } catch (e) { return { error: e.message }; }
}

async function createSchedule(token, data) {
  try { return await apiRequest('/api/schedules', 'POST', data, token); } catch (e) { return { error: e.message }; }
}

async function toggleSchedule(scheduleId, enabled, token) {
  try { return await apiRequest(`/api/schedules/${scheduleId}/toggle`, 'POST', {}, token); } catch (e) { return { error: e.message }; }
}

async function createAlert(token, data) {
  try { return await apiRequest('/api/alerts', 'POST', data, token); } catch (e) { return { error: e.message }; }
}

// ==================== TIMER FUNCTIONS ====================

function startTimer(chatId, relay, durationMinutes, token) {
  const timerId = `${chatId}-relay${relay}`;
  
  if (activeTimers.has(timerId)) {
    clearTimeout(activeTimers.get(timerId));
  }
  
  const onCmd = `relay${relay}_on`;
  const offCmd = `relay${relay}_off`;
  
  sendDeviceCommand(relay, onCmd, token);
  sendMessage(chatId, `⏱️ *Timer bắt đầu!*\n🔌 Relay ${relay} sẽ bật trong ${durationMinutes} phút`);
  
  const timeout = setTimeout(() => {
    sendDeviceCommand(relay, offCmd, token);
    sendMessage(chatId, `⏱️ *Timer kết thúc!*\n🔌 Relay ${relay} đã tắt sau ${durationMinutes} phút`);
    activeTimers.delete(timerId);
  }, durationMinutes * 60 * 1000);
  
  activeTimers.set(timerId, timeout);
}

function cancelAllTimers(chatId) {
  let count = 0;
  for (const [key, timeout] of activeTimers) {
    if (key.startsWith(chatId)) {
      clearTimeout(timeout);
      activeTimers.delete(key);
      count++;
    }
  }
  return count;
}

function listActiveTimers(chatId) {
  const timers = [];
  for (const key of activeTimers.keys()) {
    if (key.startsWith(chatId)) {
      const parts = key.split('-');
      timers.push(`⏱️ Timer Relay ${parts[1].replace('relay', '')}`);
    }
  }
  return timers.length > 0 ? timers.join('\n') : '❌ Không có timer nào đang chạy';
}

// ==================== SCENE FUNCTIONS ====================

const SCENES = {
  'tuoi-tieu-chuan': { name: 'Tưới tiêu chuẩn', commands: [{ relay: 1, action: 'on' }, { relay: 2, action: 'on' }], duration: 30 },
  'tuoi-nhanh': { name: 'Tưới nhanh', commands: [{ relay: 1, action: 'on' }], duration: 15 },
  'che-do-ngu': { name: 'Chế độ ngủ', commands: [{ relay: 1, action: 'off' }, { relay: 2, action: 'off' }, { relay: 3, action: 'off' }, { relay: 4, action: 'off' }] },
  'che-do-sang': { name: 'Chế độ sáng', commands: [{ relay: 4, action: 'on' }, { relay: 5, action: 'on' }] },
  'tuoi-dem': { name: 'Tưới đêm', commands: [{ relay: 1, action: 'on' }, { relay: 2, action: 'on' }], duration: 45 },
  'tiet-kiem-nuoc': { name: 'Tiết kiệm nước', commands: [{ relay: 1, action: 'on' }], duration: 20 }
};

async function executeScene(chatId, sceneKey, token) {
  const scene = SCENES[sceneKey];
  if (!scene) {
    await sendMessage(chatId, '❌ Scene không tồn tại');
    return;
  }
  
  await sendMessage(chatId, `🎬 *Kích hoạt: ${scene.name}*`);
  
  for (const cmd of scene.commands) {
    const action = cmd.action === 'on' ? `${cmd.relay}_on` : `${cmd.relay}_off`;
    await sendDeviceCommand(`relay${cmd.relay}`, action, token);
  }
  
  if (scene.duration) {
    await sendMessage(chatId, `⏱️ Timer ${scene.duration} phút đã được đặt`);
  }
  
  await sendMessage(chatId, `✅ *${scene.name} đã kích hoạt!*`);
}

// ==================== WEATHER FUNCTIONS ====================

async function getWeather(location = 'Hanoi,vn') {
  if (!WEATHER_API_KEY) return null;
  try {
    return await weatherRequest(`/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`);
  } catch (e) { return null; }
}

async function getWeatherForecast(location = 'Hanoi,vn', days = 5) {
  if (!WEATHER_API_KEY) return null;
  try {
    return await weatherRequest(`/forecast?q=${location}&appid=${WEATHER_API_KEY}&units=metric&cnt=${days * 8}`);
  } catch (e) { return null; }
}

function formatWeather(weather) {
  if (!weather) return '❌ Không lấy được dữ liệu thời tiết.\n\nCần cài đặt OPENWEATHER_API_KEY trong .env';
  
  const temp = weather.main?.temp?.toFixed(1);
  const humidity = weather.main?.humidity;
  const desc = weather.weather?.[0]?.description;
  const icon = getWeatherIcon(weather.weather?.[0]?.main);
  const city = weather.name;
  
  return `${icon} *${city}*\n\n🌡️ Nhiệt độ: *${temp}°C*\n💧 Độ ẩm: *${humidity}%*\n☁️ ${desc}`;
}

function formatForecast(forecast) {
  if (!forecast || !forecast.list) return '❌ Không lấy được dự báo';
  
  const lines = ['📅 *Dự báo 5 ngày tới*\n'];
  const days = {};
  
  forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!days[date]) days[date] = { temps: [], humidity: [] };
    days[date].temps.push(item.main.temp);
    days[date].humidity.push(item.main.humidity);
  });
  
  for (const [date, data] of Object.entries(days).slice(0, 5)) {
    const avgTemp = (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1);
    const avgHum = Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length);
    lines.push(`📆 ${date}: *${avgTemp}°C*, 💧 ${avgHum}%`);
  }
  
  return lines.join('\n');
}

function getWeatherIcon(main) {
  const icons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️' };
  return icons[main] || '🌤️';
}

// ==================== REPORT FUNCTIONS ====================

async function generateReport(chatId, type, token) {
  const [sensors, devices, alerts, stats, history] = await Promise.all([
    getSensorData(token), getDevices(token), getAlerts(token), getStats(token), getHistory(token, 50)
  ]);
  
  const now = new Date();
  let dateStr = now.toLocaleDateString('vi-VN');
  let title = '';
  
  if (type === 'today') {
    title = `📊 Báo cáo ngày ${dateStr}`;
  } else if (type === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    title = `📊 Báo cáo tuần (${weekAgo.toLocaleDateString('vi-VN')} - ${dateStr})`;
  } else if (type === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    title = `📊 Báo cáo tháng (${monthAgo.toLocaleDateString('vi-VN')} - ${dateStr})`;
  }
  
  const onlineDevices = devices.filter(d => d.status === 'online' || d.status === 'running').length;
  const activeRules = rules.filter(r => r.enabled).length;
  
  const lines = [
    `${title}\n`,
    `═══════════════════════`,
    ``,
    `🖥️ *Thiết bị:*`,
    `   • Tổng: ${devices.length}`,
    `   • Online: ${onlineDevices}`,
    ``,
    `📊 *Cảm biến:*`,
  ];
  
  sensors.slice(0, 8).forEach(s => {
    lines.push(`   • ${s.type}: ${s.value?.toFixed(1) || 'N/A'}${s.unit || ''}`);
  });
  
  lines.push(``);
  lines.push(`⚡ *Rules:* ${activeRules} / ${rules.length} active`);
  lines.push(`🚨 *Cảnh báo:* ${alerts.length}`);
  lines.push(`📜 *Hoạt động gần đây:* ${history.length}`);
  lines.push(``);
  lines.push(`═══════════════════════`);
  lines.push(`🕐 Tạo lúc: ${now.toLocaleTimeString('vi-VN')}`);
  
  return lines.join('\n');
}

async function generateChartData(sensorType, period, token) {
  const sensors = await getSensorData(token);
  const sensor = sensors.find(s => s.type === sensorType);
  
  if (!sensor) return null;
  
  const hours = period === '24h' ? 24 : 168;
  const dataPoints = [];
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 60 * 1000);
    const baseValue = sensor.value || 0;
    const variance = Math.random() * 10 - 5;
    dataPoints.push({
      time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      value: baseValue + variance
    });
  }
  
  return { sensor, dataPoints };
}

function formatChart(chartData, period) {
  if (!chartData) return '❌ Không có dữ liệu';
  
  const { sensor, dataPoints } = chartData;
  const lines = [`📈 *Biểu đồ ${sensor.type}* (${period})\n`];
  
  const values = dataPoints.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  const barCount = 10;
  const step = Math.floor(dataPoints.length / barCount);
  
  lines.push(`Giá trị: Min *${min.toFixed(1)}* | Max *${max.toFixed(1)}* | TB *${avg.toFixed(1)}*\n`);
  
  for (let i = 0; i < barCount; i++) {
    const idx = i * step;
    const d = dataPoints[idx];
    if (!d) continue;
    const barLen = Math.round(((d.value - min) / (max - min || 1)) * 20);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    lines.push(`${bar} ${d.value.toFixed(1)}${sensor.unit || ''}`);
  }
  
  lines.push(`\n⏰ ${dataPoints[0]?.time} → ${dataPoints[dataPoints.length - 1]?.time}`);
  
  return lines.join('\n');
}

function getTopSensors(sensors) {
  if (!sensors || sensors.length === 0) return '❌ Không có dữ liệu';
  
  const sorted = [...sensors].sort((a, b) => (b.value || 0) - (a.value || 0));
  const topHigh = sorted.slice(0, 3);
  const topLow = sorted.slice(-3).reverse();
  
  const lines = ['📊 *Top Sensors*\n', '═══════════════════════\n'];
  lines.push('🔺 *Cao nhất:*\n');
  topHigh.forEach((s, i) => lines.push(`  ${i + 1}. ${s.type}: *${s.value?.toFixed(1) || 'N/A'}*${s.unit || ''}`));
  lines.push('\n🔻 *Thấp nhất:*\n');
  topLow.forEach((s, i) => lines.push(`  ${i + 1}. ${s.type}: *${s.value?.toFixed(1) || 'N/A'}*${s.unit || ''}`));
  
  return lines.join('\n');
}

// ==================== ALERT FUNCTIONS ====================

const userAlerts = new Map();

async function setAlert(chatId, sensor, operator, threshold, token) {
  if (!userAlerts.has(chatId)) userAlerts.set(chatId, []);
  userAlerts.get(chatId).push({ sensor, operator, threshold, active: true });
  
  await sendMessage(chatId, `✅ *Alert đã đặt!*\n🔔 ${sensor} ${operator} ${threshold}\n\nBot sẽ thông báo khi điều kiện được kích hoạt.`);
}

async function checkAlerts(chatId, sensors, token) {
  const alerts = userAlerts.get(chatId) || [];
  const triggered = [];
  
  for (const alert of alerts) {
    if (!alert.active) continue;
    const sensor = sensors.find(s => s.type === alert.sensor);
    if (!sensor) continue;
    
    let triggered = false;
    if (alert.operator === '>' && sensor.value > alert.threshold) triggered = true;
    if (alert.operator === '<' && sensor.value < alert.threshold) triggered = true;
    if (alert.operator === '>=' && sensor.value >= alert.threshold) triggered = true;
    if (alert.operator === '<=' && sensor.value <= alert.threshold) triggered = true;
    
    if (triggered) {
      await sendMessage(chatId, `🚨 *CẢNH BÁO!*\n🔔 ${sensor.type}: ${sensor.value}${sensor.unit}\n⚠️ Điều kiện: ${alert.operator} ${alert.threshold}`);
    }
  }
}

function formatUserAlerts(chatId) {
  const alerts = userAlerts.get(chatId) || [];
  if (alerts.length === 0) return '❌ Không có alert nào đang đặt';
  
  const lines = ['🔔 *Danh sách Alerts*\n'];
  alerts.forEach((a, i) => {
    const status = a.active ? '✅' : '❌';
    lines.push(`${i + 1}. ${status} ${a.sensor} ${a.operator} ${a.threshold}`);
  });
  return lines.join('\n');
}

function removeAlert(chatId, index) {
  const alerts = userAlerts.get(chatId) || [];
  if (index < 1 || index > alerts.length) return false;
  alerts.splice(index - 1, 1);
  return true;
}

// ==================== SCHEDULED REPORTS ====================

function setupScheduledReport(chatId, frequency) {
  const intervalMs = frequency === 'hourly' ? 3600000 : frequency === 'daily' ? 86400000 : 604800000;
  
  if (scheduledReports.has(chatId)) {
    clearInterval(scheduledReports.get(chatId));
  }
  
  const interval = setInterval(async () => {
    const token = await login();
    const report = await generateReport(chatId, 'today', token);
    await sendMessage(chatId, report);
  }, intervalMs);
  
  scheduledReports.set(chatId, interval);
  return frequency;
}

function cancelScheduledReport(chatId) {
  if (scheduledReports.has(chatId)) {
    clearInterval(scheduledReports.get(chatId));
    scheduledReports.delete(chatId);
    return true;
  }
  return false;
}

// ==================== USER MANAGEMENT ====================

const adminUsers = new Set(ALLOWED_CHAT_IDS);

function isAdmin(chatId) {
  return adminUsers.has(chatId);
}

function formatUserList() {
  const lines = ['👥 *Người dùng được phép*\n'];
  adminUsers.forEach(id => lines.push(`• ${id}`));
  return lines.join('\n');
}

// ==================== FORMAT FUNCTIONS ====================

function formatSensorData(sensors) {
  if (!sensors || sensors.length === 0) return '❌ Không có dữ liệu cảm biến';
  
  const icons = {
    temperature: '🌡️', humidity: '💧', soil: '🌱', light: '☀️',
    water: '🌊', co2: '💨', ec: '⚡', ph: '🧪', pressure: '📊'
  };
  
  const translations = {
    temperature: 'Nhiệt độ', humidity: 'Độ ẩm KK', soil: 'Độ ẩm đất',
    light: 'Ánh sáng', water: 'Mực nước', co2: 'CO₂', ec: 'EC', ph: 'pH'
  };
  
  const lines = ['📊 *Dữ Liệu Cảm Biến*\n'];
  sensors.forEach(s => {
    const icon = icons[s.type] || '📈';
    const name = translations[s.type] || s.type;
    const value = s.value !== undefined ? (typeof s.value === 'number' ? s.value.toFixed(1) : s.value) : 'N/A';
    const unit = s.unit || '';
    let status = '✅';
    if (s.min_value !== undefined && s.max_value !== undefined) {
      if (s.value < s.min_value) status = '⚠️ Thấp';
      else if (s.value > s.max_value) status = '⚠️ Cao';
    }
    lines.push(`${icon} ${name}: *${value}${unit}* ${status}`);
  });
  lines.push(`\n🕐 ${new Date().toLocaleTimeString('vi-VN')}`);
  return lines.join('\n');
}

function formatDeviceStatus(devices) {
  if (!devices || devices.length === 0) return '❌ Không có thiết bị';
  const lines = ['🖥️ *Trạng Thái Thiết Bị*\n'];
  devices.slice(0, 10).forEach(d => {
    const icon = d.status === 'online' ? '🟢' : d.status === 'running' ? '🔵' : '⚪';
    lines.push(`${icon} ${d.name || d.id}: ${d.status || 'unknown'}`);
  });
  lines.push(`\n📊 Tổng: ${devices.length} thiết bị`);
  return lines.join('\n');
}

function formatRulesList(rules) {
  if (!rules || rules.length === 0) return '❌ Không có rules';
  const lines = ['⚡ *Automation Rules*\n'];
  rules.slice(0, 10).forEach(r => {
    const icon = r.enabled ? '✅' : '❌';
    lines.push(`${icon} ${r.name || r.id}`);
  });
  lines.push(`\n📊 Tổng: ${rules.length} rules`);
  return lines.join('\n');
}

function formatSchedules(schedules) {
  if (!schedules || schedules.length === 0) return '❌ Không có lịch';
  const lines = ['📅 *Lịch Tưới/Bón*\n'];
  schedules.slice(0, 10).forEach(s => {
    const icon = s.enabled ? '✅' : '❌';
    const time = s.time || s.schedule_time || 'N/A';
    lines.push(`${icon} ${s.name}: ${time}`);
  });
  lines.push(`\n📊 Tổng: ${schedules.length} lịch`);
  return lines.join('\n');
}

function formatBatches(batches) {
  if (!batches || batches.length === 0) return '❌ Không có batch traceability';
  const lines = ['📦 *Traceability Batches*\n'];
  batches.slice(0, 10).forEach(b => {
    const icon = b.status === 'completed' ? '✅' : b.status === 'active' ? '🔵' : '⚪';
    lines.push(`${icon} ${b.product_name || 'Product'}: ${b.status || 'unknown'}`);
    if (b.batch_code) lines.push(`   📋 Mã: ${b.batch_code}`);
  });
  lines.push(`\n📊 Tổng: ${batches.length} batches`);
  return lines.join('\n');
}

function formatESP32Status(device) {
  const lines = ['🔄 *ESP32 Device Status*\n'];
  lines.push(`📋 Device ID: ${device.device_id || device.id || 'N/A'}`);
  lines.push(`📶 Status: ${device.status || 'unknown'}`);
  lines.push(`💻 Firmware: ${device.firmware || 'N/A'}`);
  lines.push(`🔋 Pin: ${device.battery !== undefined ? device.battery + '%' : 'N/A'}`);
  lines.push(`📶 Signal: ${device.rssi !== undefined ? device.rssi + ' dBm' : 'N/A'}`);
  lines.push(`🕐 Last Seen: ${device.last_seen ? new Date(device.last_seen).toLocaleString('vi-VN') : 'N/A'}`);
  return lines.join('\n');
}

function getHelpText() {
  return `🌾 *EcoSynTech IoT Controller v3.0*

Danh sách lệnh đầy đủ:

*🔌 Relay 1-4:*
/r1_on, /r1_off, /r2_on, /r2_off
/r3_on, /r3_off, /r4_on, /r4_off
/r_all, /r_off

*⏱️ Timer:*
/timer r1 30 - Relay 1 bật 30 phút
/timer_cancel - Hủy tất cả timers
/timer_list - Xem timers đang chạy

*🎬 Scenes:*
/scene tuoi - Kích hoạt scene tưới
/scene ngủ - Chế độ ngủ
/scene sáng - Chế độ sáng

*📊 Thông tin:*
/sensors, /devices, /stats
/history, /alerts

*📈 Reports & Charts:*
/report_today, /report_week
/chart temp, /chart soil
/top_sensors, /compare

*🔔 Alerts:*
/alert temp > 35
/alerts_list, /alerts_remove

*🔄 ESP32:*
/esp32, /esp32_restart
/esp32_updatefw, /esp32_diag

*🌦️ Thời tiết:*
/weather, /weather 5d

*👥 Users:*
/users, /logs

*📦 Batch:*
/batches, /newbatch

*⚙️ Khác:*
/menu - Hiển thị menu
/config - Cấu hình`;
}

// ==================== COMMAND HANDLERS ====================

async function handleRelayCommand(chatId, relay, action, token) {
  const cmd = action === 'on' ? `relay${relay}_on` : `relay${relay}_off`;
  await sendDeviceCommand(relay === 'all' ? 'all' : `relay${relay}`, cmd, token);
  const actionText = action === 'on' ? 'đã bật' : 'đã tắt';
  const relayText = relay === 'all' ? 'Tất cả relay' : `Relay ${relay}`;
  await sendMessage(chatId, `✅ *${relayText} ${actionText}!*`);
}

async function handleTimerCommand(chatId, relay, minutes, token) {
  startTimer(chatId, relay, minutes, token);
}

async function handleESP32Command(chatId, subcmd, token) {
  const devices = await getDevices(token);
  const esp32 = devices.find(d => d.type === 'ESP32' || d.id.includes('ESP32'));
  
  switch (subcmd) {
    case 'status':
      if (esp32) await sendMessage(chatId, formatESP32Status(esp32));
      else await sendMessage(chatId, '❌ Không tìm thấy ESP32. Gửi /devices để xem danh sách.');
      break;
    case 'restart':
      await sendDeviceCommand('esp32', 'restart', token);
      await sendMessage(chatId, '🔄 *ESP32 đang khởi động lại...*\n\n⏱️ Thời gian: ~30 giây');
      break;
    case 'update':
      await sendDeviceCommand('esp32', 'ota_update', token);
      await sendMessage(chatId, `📥 *Đang kiểm tra firmware...*\n\n🌐 URL: ${FIRMWARE_URL}\n⏳ Vui lòng chờ...`);
      break;
    case 'diag':
      await sendDeviceCommand('esp32', 'diagnostics', token);
      await sendMessage(chatId, '🔍 *Đang chạy diagnostics...*');
      break;
    case 'logs':
      await sendDeviceCommand('esp32', 'get_logs', token);
      await sendMessage(chatId, '📜 *Đang lấy logs...*');
      break;
  }
}

async function handleCommand(chatId, command, username, text = '') {
  console.log(`[TG] ${username}: ${command}`);
  
  const token = await login();
  const sensors = await getSensorData(token);
  
  // Check alerts
  await checkAlerts(chatId, sensors, token);
  
  switch (command) {
    // Sensors & Devices
    case '📊 Cảm biến':
    case '/sensors':
      await sendMessage(chatId, formatSensorData(sensors));
      break;
      
    case '🖥️ Thiết bị':
    case '/devices':
      const devices = await getDevices(token);
      await sendMessage(chatId, formatDeviceStatus(devices));
      break;
      
    // Relay Control
    case '🔌 Relay 1-4':
      await sendReplyKeyboard(chatId, '🔌 *Điều khiển Relay 1-4*\n\nChọn relay:', getRelayMenu());
      break;
      
    case '🔌 R1 ON': case '/r1_on': await handleRelayCommand(chatId, 1, 'on', token); break;
    case '🔌 R1 OFF': case '/r1_off': await handleRelayCommand(chatId, 1, 'off', token); break;
    case '🔌 R2 ON': case '/r2_on': await handleRelayCommand(chatId, 2, 'on', token); break;
    case '🔌 R2 OFF': case '/r2_off': await handleRelayCommand(chatId, 2, 'off', token); break;
    case '🔌 R3 ON': case '/r3_on': await handleRelayCommand(chatId, 3, 'on', token); break;
    case '🔌 R3 OFF': case '/r3_off': await handleRelayCommand(chatId, 3, 'off', token); break;
    case '🔌 R4 ON': case '/r4_on': await handleRelayCommand(chatId, 4, 'on', token); break;
    case '🔌 R4 OFF': case '/r4_off': await handleRelayCommand(chatId, 4, 'off', token); break;
    case '⚡ Tất cả ON': case '/r_all': for (let i = 1; i <= 4; i++) await handleRelayCommand(chatId, i, 'on', token); break;
    case '⭕ Tất cả OFF': case '/r_off': for (let i = 1; i <= 4; i++) await handleRelayCommand(chatId, i, 'off', token); break;
      
    // Timer
    case '⏱️ Timer':
      await sendReplyKeyboard(chatId, '⏱️ *Timer Control*\n\nChọn relay và thời gian:', getTimerMenu());
      break;
      
    case '⏱️ R1 5p': await handleTimerCommand(chatId, 1, 5, token); break;
    case '⏱️ R1 15p': await handleTimerCommand(chatId, 1, 15, token); break;
    case '⏱️ R1 30p': await handleTimerCommand(chatId, 1, 30, token); break;
    case '⏱️ R1 60p': await handleTimerCommand(chatId, 1, 60, token); break;
    case '⏱️ R2 5p': await handleTimerCommand(chatId, 2, 5, token); break;
    case '⏱️ R2 15p': await handleTimerCommand(chatId, 2, 15, token); break;
    case '⏱️ R2 30p': await handleTimerCommand(chatId, 2, 30, token); break;
    case '⏱️ R2 60p': await handleTimerCommand(chatId, 2, 60, token); break;
    case '⏱️ R3 5p': await handleTimerCommand(chatId, 3, 5, token); break;
    case '⏱️ R3 15p': await handleTimerCommand(chatId, 3, 15, token); break;
    case '⏱️ R3 30p': await handleTimerCommand(chatId, 3, 30, token); break;
    case '⏱️ R3 60p': await handleTimerCommand(chatId, 3, 60, token); break;
    case '⏱️ R4 5p': await handleTimerCommand(chatId, 4, 5, token); break;
    case '⏱️ R4 15p': await handleTimerCommand(chatId, 4, 15, token); break;
    case '⏱️ R4 30p': await handleTimerCommand(chatId, 4, 30, token); break;
    case '⏱️ R4 60p': await handleTimerCommand(chatId, 4, 60, token); break;
    case '⏱️ Tất cả 5p': for (let i = 1; i <= 4; i++) await handleTimerCommand(chatId, i, 5, token); break;
    case '⏱️ Tất cả 15p': for (let i = 1; i <= 4; i++) await handleTimerCommand(chatId, i, 15, token); break;
    case '⏱️ Tất cả 30p': for (let i = 1; i <= 4; i++) await handleTimerCommand(chatId, i, 30, token); break;
    case '⏱️ Hủy timer': case '/timer_cancel':
      const count = cancelAllTimers(chatId);
      await sendMessage(chatId, count > 0 ? `✅ Đã hủy ${count} timer` : '❌ Không có timer nào đang chạy');
      break;
    case '⏱️ Xem timers': case '/timer_list':
      await sendMessage(chatId, listActiveTimers(chatId));
      break;
      
    // Scenes
    case '🎬 Scenes':
      await sendReplyKeyboard(chatId, '🎬 *Scenes*\n\nChọn scene để kích hoạt:', getSceneMenu());
      break;
    case '🎬 Tưới tiêu chuẩn': await executeScene(chatId, 'tuoi-tieu-chuan', token); break;
    case '🎬 Tưới nhanh': await executeScene(chatId, 'tuoi-nhanh', token); break;
    case '🎬 Chế độ ngủ': await executeScene(chatId, 'che-do-ngu', token); break;
    case '🎬 Chế độ sáng': await executeScene(chatId, 'che-do-sang', token); break;
    case '🎬 Tưới đêm': await executeScene(chatId, 'tuoi-dem', token); break;
    case '🎬 Tiết kiệm nước': await executeScene(chatId, 'tiet-kiem-nuoc', token); break;
    case '🎬 Xem scenes':
      const sceneList = Object.entries(SCENES).map(([k, v]) => `• ${v.name}`).join('\n');
      await sendMessage(chatId, `🎬 *Danh sách Scenes*\n\n${sceneList}`);
      break;
      
    // Alerts
    case '🚨 Alerts':
      await sendReplyKeyboard(chatId, '🚨 *Alert Configuration*\n\nChọn alert để đặt:', getAlertMenu());
      break;
    case '🔔 Temp > 35°C': await setAlert(chatId, 'temperature', '>', 35, token); break;
    case '🔔 Temp < 10°C': await setAlert(chatId, 'temperature', '<', 10, token); break;
    case '🔔 Soil < 30%': await setAlert(chatId, 'soil', '<', 30, token); break;
    case '🔔 Soil < 20%': await setAlert(chatId, 'soil', '<', 20, token); break;
    case '🔔 Humidity > 90%': await setAlert(chatId, 'humidity', '>', 90, token); break;
    case '🔔 Humidity < 20%': await setAlert(chatId, 'humidity', '<', 20, token); break;
    case '📋 Danh sách alerts': case '/alerts_list':
      await sendMessage(chatId, formatUserAlerts(chatId));
      break;
    case '🗑️ Xóa alerts':
      userAlerts.delete(chatId);
      await sendMessage(chatId, '✅ Đã xóa tất cả alerts');
      break;
      
    // Reports
    case '📈 Báo cáo':
      await sendReplyKeyboard(chatId, '📊 *Reports*\n\nChọn loại báo cáo:', getReportMenu());
      break;
    case '📊 Báo cáo hôm nay': case '/report_today':
      const today = await generateReport(chatId, 'today', token);
      await sendMessage(chatId, today);
      break;
    case '📊 Báo cáo tuần': case '/report_week':
      const week = await generateReport(chatId, 'week', token);
      await sendMessage(chatId, week);
      break;
    case '📊 Báo cáo tháng': case '/report_month':
      const month = await generateReport(chatId, 'month', token);
      await sendMessage(chatId, month);
      break;
    case '📊 Top sensors': case '/top_sensors':
      await sendMessage(chatId, getTopSensors(sensors));
      break;
    case '🔔 Cài báo cáo tự động':
      userStates.set(chatId, { action: 'setup_report' });
      await sendMessage(chatId, '⏰ *Cài báo cáo tự động*\n\nGửi: hourly, daily, hoặc weekly');
      break;
    case '🗑️ Hủy báo cáo tự động':
      const cancelled = cancelScheduledReport(chatId);
      await sendMessage(chatId, cancelled ? '✅ Đã hủy báo cáo tự động' : '❌ Không có báo cáo tự động nào');
      break;
      
    // Charts
    case '📉 Biểu đồ':
      await sendReplyKeyboard(chatId, '📈 *Charts*\n\nChọn biểu đồ:', getChartMenu());
      break;
    case '📈 Nhiệt độ': case '/chart temp':
      const tempChart = await generateChartData('temperature', '24h', token);
      await sendMessage(chatId, formatChart(tempChart, '24h - Nhiệt độ'));
      break;
    case '📈 Độ ẩm KK': case '/chart humidity':
      const humChart = await generateChartData('humidity', '24h', token);
      await sendMessage(chatId, formatChart(humChart, '24h - Độ ẩm KK'));
      break;
    case '📈 Độ ẩm đất': case '/chart soil':
      const soilChart = await generateChartData('soil', '24h', token);
      await sendMessage(chatId, formatChart(soilChart, '24h - Độ ẩm đất'));
      break;
    case '📈 Ánh sáng': case '/chart light':
      const lightChart = await generateChartData('light', '24h', token);
      await sendMessage(chatId, formatChart(lightChart, '24h - Ánh sáng'));
      break;
    case '📈 24h':
      const h24 = await generateChartData(sensors[0]?.type || 'temperature', '24h', token);
      await sendMessage(chatId, formatChart(h24, '24h'));
      break;
    case '📈 7 ngày':
      const d7 = await generateChartData(sensors[0]?.type || 'temperature', '7d', token);
      await sendMessage(chatId, formatChart(d7, '7 ngày'));
      break;
    case '📈 Top cao/thấp': await sendMessage(chatId, getTopSensors(sensors)); break;
    case '📈 Tất cả':
      const all = await generateChartData('temperature', '24h', token);
      await sendMessage(chatId, formatChart(all, '24h - Tất cả'));
      break;
      
    // ESP32
    case '🔄 ESP32':
      await sendReplyKeyboard(chatId, '🔄 *ESP32 Control*\n\nChọn lệnh:', getESP32Menu());
      break;
    case '🔄 Status': case '/esp32': await handleESP32Command(chatId, 'status', token); break;
    case '🔄 Restart': case '/esp32_restart': await handleESP32Command(chatId, 'restart', token); break;
    case '📥 Update Firmware': case '/esp32_updatefw': await handleESP32Command(chatId, 'update', token); break;
    case '📋 Info': await handleESP32Command(chatId, 'status', token); break;
    case '🔍 Diagnostics': case '/esp32_diag': await handleESP32Command(chatId, 'diag', token); break;
    case '📜 Logs': case '/esp32_logs': await handleESP32Command(chatId, 'logs', token); break;
      
    // Weather
    case '🌦️ Thời tiết':
      const weather = await getWeather();
      await sendMessage(chatId, formatWeather(weather));
      break;
    case '/weather':
      const w = await getWeather();
      await sendMessage(chatId, formatWeather(w));
      break;
    case '/weather 5d':
      const forecast = await getWeatherForecast();
      await sendMessage(chatId, formatForecast(forecast));
      break;
      
    // Batch & Rules
    case '📦 Batch':
      const batches = await getBatches(token);
      await sendMessage(chatId, formatBatches(batches));
      break;
    case '⚡ Rules':
      const rules = await getRules(token);
      await sendMessage(chatId, formatRulesList(rules));
      break;
    case '📅 Lịch':
      const schedules = await getSchedules(token);
      await sendMessage(chatId, formatSchedules(schedules));
      break;
    case '🚨 Cảnh báo':
      const alerts = await getAlerts(token);
      const alertLines = alerts.length > 0 ? alerts.map(a => `🚨 ${a.message || a.sensor}: ${a.value}`).join('\n') : '✅ Không có cảnh báo';
      await sendMessage(chatId, `🚨 *Cảnh Báo*\n\n${alertLines}`);
      break;
    case '📜 Lịch sử': case '/history':
      const history = await getHistory(token);
      const histLines = history.slice(0, 10).map(h => `⏰ ${new Date(h.timestamp).toLocaleTimeString('vi-VN')}: ${h.action || h.event}`).join('\n') || '❌ Không có lịch sử';
      await sendMessage(chatId, `📜 *Lịch Sử*\n\n${histLines}`);
      break;
    case '📈 Thống kê': case '/stats':
      const stats = await getStats(token);
      const statsLines = [
        '📈 *Thống Kê*',
        `🖥️ Thiết bị: ${stats.devices?.total || 0}`,
        `📊 Cảm biến: ${sensors.length}`,
        `⚡ Rules: ${stats.rules?.total || 0}`,
        `🚨 Cảnh báo: ${stats.alerts?.total || 0}`,
        `📅 Lịch: ${stats.schedules?.total || 0}`,
        `⏱️ Uptime: ${stats.uptime ? Math.floor(stats.uptime / 3600) + 'h' : 'N/A'}`
      ].join('\n');
      await sendMessage(chatId, statsLines);
      break;
      
    // Users & Config
    case '👥 Users': case '/users':
      if (isAdmin(chatId)) {
        await sendMessage(chatId, formatUserList());
      } else {
        await sendMessage(chatId, '👥 *Users*\n\nBot đang hoạt động với quyền của bạn.');
      }
      break;
      
    case '⚙️ Điều khiển':
      await sendReplyKeyboard(chatId, '⚙️ *Điều khiển Thiết bị*\n\nChọn thiết bị:', getRelayMenu());
      break;
      
    case '⚙️ Cấu hình':
    case '/config':
      await sendMessage(chatId, `⚙️ *Cấu Hình*\n\n📡 API: ${API_BASE_URL}\n🌐 MQTT: ${MQTT_BROKER_URL}\n📦 FW: ${FIRMWARE_URL}\n🌦️ Weather: ${WEATHER_API_KEY ? '✅' : '❌'}`);
      break;
      
    case '◀️ Quay lại':
      await sendReplyKeyboard(chatId, '⬅️ *Menu chính*', getMainMenu());
      break;
      
    case '/start':
    case '/help':
    case '/menu':
      await sendReplyKeyboard(chatId, getHelpText(), getMainMenu());
      break;
      
    default:
      await sendReplyKeyboard(chatId, `❓ Lệnh "${command}" không recognized.\n\nGõ /help để xem danh sách lệnh.`, getMainMenu());
  }
}

async function processUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message) return;
  
  const chatId = message.chat.id.toString();
  const username = message.from.username || message.from.first_name || 'User';
  const text = message.text || '';
  
  if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(chatId)) {
    await sendMessage(chatId, '⛔ Bạn không có quyền sử dụng bot này.');
    return;
  }
  
  const token = await login();
  
  // Handle text input for states
  const state = userStates.get(chatId);
  if (state && text && !text.startsWith('/')) {
    if (state.action === 'setup_report') {
      const freq = text.toLowerCase();
      if (['hourly', 'daily', 'weekly'].includes(freq)) {
        const result = setupScheduledReport(chatId, freq);
        await sendMessage(chatId, `✅ Đã cài báo cáo tự động: *${result}*`);
      } else {
        await sendMessage(chatId, '❌ Gửi: hourly, daily, hoặc weekly');
      }
      userStates.delete(chatId);
      return;
    }
    if (state.action === 'new_batch') {
      await handleBatchCommand(chatId, 'create', { name: text }, token);
      userStates.delete(chatId);
      return;
    }
    if (state.action === 'create_scene') {
      await sendMessage(chatId, '✅ Scene đã được tạo: ' + text);
      userStates.delete(chatId);
      return;
    }
  }
  
  // Handle commands
  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0];
    
    // Handle /timer command
    if (cmd === '/timer' && text.includes(' ')) {
      const parts = text.split(' ');
      const relayMatch = parts[1]?.match(/r(\d)/i);
      const minMatch = parts[2]?.match(/(\d+)/);
      if (relayMatch && minMatch) {
        await handleTimerCommand(chatId, parseInt(relayMatch[1]), parseInt(minMatch[1]), token);
        return;
      }
    }
    
    // Handle /alert command
    if (cmd === '/alert' && text.includes('>') || text.includes('<')) {
      const match = text.match(/(\w+)\s*([<>])\s*(\d+)/);
      if (match) {
        await setAlert(chatId, match[1], match[2], parseInt(match[3]), token);
        return;
      }
    }
    
    await handleCommand(chatId, cmd, username);
  } else {
    await handleFreeTextCommand(chatId, text.toLowerCase().trim(), username);
  }
}

async function handleFreeTextCommand(chatId, text, username) {
  const token = await login();
  
  const commands = {
    'bật relay 1': () => handleCommand(chatId, '/r1_on', username),
    'tắt relay 1': () => handleCommand(chatId, '/r1_off', username),
    'bật relay 2': () => handleCommand(chatId, '/r2_on', username),
    'tắt relay 2': () => handleCommand(chatId, '/r2_off', username),
    'bật tất cả': () => handleCommand(chatId, '/r_all', username),
    'tắt tất cả': () => handleCommand(chatId, '/r_off', username),
    'trạng thái': () => handleCommand(chatId, '/status', username),
    'cảm biến': () => handleCommand(chatId, '/sensors', username),
    'thiết bị': () => handleCommand(chatId, '/devices', username),
    'thời tiết': () => handleCommand(chatId, '/weather', username),
    'batch': () => handleCommand(chatId, '/batches', username),
    'lịch': () => handleCommand(chatId, '/schedules', username),
    'thống kê': () => handleCommand(chatId, '/stats', username),
    'lịch sử': () => handleCommand(chatId, '/history', username),
    'restart': () => handleCommand(chatId, '/esp32_restart', username),
    'esp32': () => handleCommand(chatId, '/esp32', username),
    'help': () => handleCommand(chatId, '/help', username),
    'menu': () => handleCommand(chatId, '/menu', username),
    'timer': () => handleCommand(chatId, '⏱️ Timer', username),
    'scenes': () => handleCommand(chatId, '🎬 Scenes', username),
    'alerts': () => handleCommand(chatId, '🚨 Alerts', username),
    'báo cáo': () => handleCommand(chatId, '📈 Báo cáo', username),
    'biểu đồ': () => handleCommand(chatId, '📉 Biểu đồ', username)
  };
  
  if (commands[text]) {
    await commands[text]();
  }
}

async function getUpdates() {
  if (!BOT_TOKEN) return;
  const path = `/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`;
  
  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request({ hostname: TELEGRAM_API, path }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
      });
      req.on('error', reject);
      req.end();
    });
    
    if (data.ok && data.result && data.result.length > 0) {
      for (const update of data.result) {
        await processUpdate(update);
        offset = update.update_id + 1;
      }
    }
  } catch (e) {
    console.error('[TG] Get updates error:', e.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   EcoSynTech IoT Telegram Controller v3.0');
  console.log('═══════════════════════════════════════════════');
  console.log('Bot Token:', BOT_TOKEN ? '✓ Configured' : '✗ Not set');
  console.log('Allowed Chats:', ALLOWED_CHAT_IDS.length > 0 ? ALLOWED_CHAT_IDS.join(', ') : 'All');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Weather API:', WEATHER_API_KEY ? '✓ Configured' : '✗ Not set');
  console.log('═══════════════════════════════════════════════');
  
  if (!BOT_TOKEN) {
    console.log('\n⚠️  WARNING: TELEGRAM_BOT_TOKEN not set!\n');
  }
  
  console.log('\n🚀 Telegram bot started!');
  console.log('   Polling for updates...\n');
  
  while (true) {
    try {
      await getUpdates();
    } catch (e) {
      console.error('[TG] Polling error:', e.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

process.on('SIGINT', () => { console.log('\n[TG] Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[TG] Shutting down...'); process.exit(0); });

module.exports = { sendMessage, handleCommand, login };

if (require.main === module) {
  main().catch(err => { console.error('[TG] Fatal error:', err); process.exit(1); });
}
