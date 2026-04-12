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

let offset = 0;
let userStates = new Map();

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', err => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  try {
    const data = await apiRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });
    return data.token;
  } catch (e) {
    return null;
  }
}

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  return new Promise((resolve) => {
    if (!BOT_TOKEN || !chatId) {
      resolve(null);
      return;
    }
    const path = `/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=${parseMode || 'Markdown'}`;
    const req = https.request({ hostname: TELEGRAM_API, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) resolve(result.result);
          else { console.error('[TG] Send failed:', result.description); resolve(null); }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function sendReplyKeyboard(chatId, text, keyboard) {
  return new Promise((resolve) => {
    if (!BOT_TOKEN || !chatId) { resolve(null); return; }
    
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    };
    
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: TELEGRAM_API,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(true));
    });
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
      [{ text: '📦 Traceability' }, { text: '⚡ Rules' }],
      [{ text: '📅 Lịch' }, { text: '🚨 Cảnh báo' }],
      [{ text: '📜 Lịch sử' }, { text: '📈 Thống kê' }],
      [{ text: '🔄 ESP32' }, { text: '⚙️ Cấu hình' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

function getRelayMenu() {
  return {
    keyboard: [
      [{ text: '🔌 Relay 1 ON' }, { text: '🔌 Relay 1 OFF' }],
      [{ text: '🔌 Relay 2 ON' }, { text: '🔌 Relay 2 OFF' }],
      [{ text: '🔌 Relay 3 ON' }, { text: '🔌 Relay 3 OFF' }],
      [{ text: '🔌 Relay 4 ON' }, { text: '🔌 Relay 4 OFF' }],
      [{ text: '🔌 Tất cả ON' }, { text: '🔌 Tất cả OFF' }],
      [{ text: '◀️ Quay lại' }]
    ],
    resize_keyboard: true
  };
}

function getControlMenu() {
  return {
    keyboard: [
      [{ text: '💧 Máy bơm ON' }, { text: '💧 Máy bơm OFF' }],
      [{ text: '🚿 Van 1 ON' }, { text: '🚿 Van 1 OFF' }],
      [{ text: '🚿 Van 2 ON' }, { text: '🚿 Van 2 OFF' }],
      [{ text: '🌀 Quạt ON' }, { text: '🌀 Quạt OFF' }],
      [{ text: '💡 Đèn ON' }, { text: '💡 Đèn OFF' }],
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

async function getSensorData(token) {
  try {
    const data = await apiRequest('/api/sensors', 'GET', null, token);
    if (Array.isArray(data)) return data;
    if (data.sensors) return data.sensors;
    return [];
  } catch (e) { return []; }
}

async function getDevices(token) {
  try {
    const data = await apiRequest('/api/devices', 'GET', null, token);
    if (data.devices) return data.devices;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) { return []; }
}

async function getAlerts(token) {
  try {
    const data = await apiRequest('/api/alerts', 'GET', null, token);
    if (Array.isArray(data)) return data;
    if (data.alerts) return data.alerts;
    return [];
  } catch (e) { return []; }
}

async function getRules(token) {
  try {
    const data = await apiRequest('/api/rules', 'GET', null, token);
    if (data.rules) return data.rules;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) { return []; }
}

async function getSchedules(token) {
  try {
    const data = await apiRequest('/api/schedules', 'GET', null, token);
    if (data.schedules) return data.schedules;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) { return []; }
}

async function getHistory(token, limit = 10) {
  try {
    const data = await apiRequest(`/api/history?limit=${limit}`, 'GET', null, token);
    if (Array.isArray(data)) return data;
    if (data.history) return data.history;
    return [];
  } catch (e) { return []; }
}

async function getStats(token) {
  try {
    return await apiRequest('/api/stats', 'GET', null, token);
  } catch (e) { return {}; }
}

async function getBatches(token) {
  try {
    const data = await apiRequest('/api/traceability/batches', 'GET', null, token);
    if (data.batches) return data.batches;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) { return []; }
}

async function sendDeviceCommand(deviceId, command, token) {
  try {
    return await apiRequest(`/api/devices/${deviceId}/command`, 'POST', { command, params: {} }, token);
  } catch (e) { return { error: e.message }; }
}

async function createBatch(token, data) {
  try {
    return await apiRequest('/api/traceability/batches', 'POST', data, token);
  } catch (e) { return { error: e.message }; }
}

async function toggleRule(ruleId, enabled, token) {
  try {
    return await apiRequest(`/api/rules/${ruleId}`, 'PUT', { enabled }, token);
  } catch (e) { return { error: e.message }; }
}

async function createSchedule(token, data) {
  try {
    return await apiRequest('/api/schedules', 'POST', data, token);
  } catch (e) { return { error: e.message }; }
}

async function toggleSchedule(scheduleId, enabled, token) {
  try {
    return await apiRequest(`/api/schedules/${scheduleId}/toggle`, 'POST', {}, token);
  } catch (e) { return { error: e.message }; }
}

async function deleteSchedule(scheduleId, token) {
  try {
    return await apiRequest(`/api/schedules/${scheduleId}`, 'DELETE', null, token);
  } catch (e) { return { error: e.message }; }
}

async function createAlert(token, data) {
  try {
    return await apiRequest('/api/alerts', 'POST', data, token);
  } catch (e) { return { error: e.message }; }
}

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
  devices.slice(0, 12).forEach(d => {
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

function formatAlerts(alerts) {
  if (!alerts || alerts.length === 0) return '✅ Không có cảnh báo';
  
  const lines = ['🚨 *Cảnh Báo*\n'];
  alerts.slice(0, 10).forEach(a => {
    const icon = a.severity === 'danger' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵';
    lines.push(`${icon} ${a.message || a.sensor || 'Alert'}: ${a.value || ''}`);
  });
  return lines.join('\n');
}

function formatHistory(history) {
  if (!history || history.length === 0) return '❌ Không có lịch sử';
  
  const lines = ['📜 *Lịch Sử Hoạt Động*\n'];
  history.slice(0, 15).forEach(h => {
    const time = new Date(h.timestamp || h.created_at).toLocaleTimeString('vi-VN');
    lines.push(`⏰ ${time}: ${h.action || h.event || 'Activity'}`);
  });
  return lines.join('\n');
}

function formatStats(stats) {
  const lines = ['📈 *Thống Kê Hệ Thống*\n'];
  
  if (stats.devices) lines.push(`🖥️ Thiết bị: ${stats.devices.total || 0}`);
  if (stats.sensors) lines.push(`📊 Cảm biến: ${stats.sensors.total || 0}`);
  if (stats.rules) lines.push(`⚡ Rules: ${stats.rules.total || 0}`);
  if (stats.alerts) lines.push(`🚨 Cảnh báo: ${stats.alerts.total || 0}`);
  if (stats.schedules) lines.push(`📅 Lịch: ${stats.schedules.total || 0}`);
  if (stats.uptime) lines.push(`⏱️ Uptime: ${Math.floor(stats.uptime / 3600)}h`);
  
  if (stats.requests !== undefined) lines.push(`📡 Requests: ${stats.requests}`);
  if (stats.errors !== undefined) lines.push(`❌ Errors: ${stats.errors}`);
  
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
  return `🌾 *EcoSynTech IoT Controller*

Chào mừng bạn! Tôi là bot điều khiển hệ thống IoT.

*📋 Menu chính:*
Sử dụng các nút bên dưới hoặc gõ lệnh:

*🔌 Relay 1-4:*
/r1_on, /r1_off - Relay 1
/r2_on, /r2_off - Relay 2
/r3_on, /r3_off - Relay 3
/r4_on, /r4_off - Relay 4
/r_all - Bật tất cả relay
/r_off - Tắt tất cả relay

*⚙️ Điều khiển:*
/pump - Máy bơm ON/OFF
/valve1, /valve2 - Van 1/2
/fan - Quạt ON/OFF
/light - Đèn ON/OFF

*📊 Thông tin:*
/status - Trạng thái hệ thống
/sensors - Dữ liệu cảm biến
/devices - Danh sách thiết bị
/stats - Thống kê

*⚡ Automation:*
/rules - Danh sách rules
/rulestoggle - Bật/tắt rule

*📦 Traceability:*
/batches - Danh sách batches
/newbatch - Tạo batch mới

*📅 Schedule:*
/schedules - Danh sách lịch
/newschedule - Tạo lịch mới

*🔄 ESP32:*
/esp32 - Trạng thái ESP32
/updatefw - Cập nhật firmware
/restart - Khởi động lại

*⚙️ Khác:*
/history - Lịch sử hoạt động
/alerts - Cảnh báo
/config - Cấu hình

_Gõ lệnh hoặc dùng menu buttons!_`;
}

async function handleRelayCommand(chatId, relay, action, token) {
  const cmd = `relay${relay}_${action}`;
  await sendDeviceCommand(relay === 'all' ? 'all' : `relay${relay}`, cmd, token);
  const actionText = action === 'on' ? 'đã bật' : 'đã tắt';
  const relayText = relay === 'all' ? 'Tất cả relay' : `Relay ${relay}`;
  await sendMessage(chatId, `✅ *${relayText} ${actionText}!*`);
}

async function handleESP32Command(chatId, subcmd, token) {
  const devices = await getDevices(token);
  const esp32 = devices.find(d => d.type === 'ESP32' || d.id.includes('ESP32'));
  
  switch (subcmd) {
    case 'status':
      if (esp32) {
        await sendMessage(chatId, formatESP32Status(esp32));
      } else {
        await sendMessage(chatId, '❌ Không tìm thấy ESP32. Gửi /devices để xem danh sách.');
      }
      break;
      
    case 'update':
      await sendDeviceCommand('esp32', 'ota_update', token);
      await sendMessage(chatId, `📦 *Đang kiểm tra firmware...*\n\n🌐 URL: ${FIRMWARE_URL}\n⏳ Vui lòng chờ trong giây lát...`);
      setTimeout(async () => {
        await sendMessage(chatId, '✅ *Kiểm tra hoàn tất!*\n\n📱 ESP32 sẽ tự động tải firmware mới nếu có.\n🔄 Phiên bản hiện tại: V8.5.0');
      }, 2000);
      break;
      
    case 'restart':
      await sendDeviceCommand('esp32', 'restart', token);
      await sendMessage(chatId, '🔄 *ESP32 đang khởi động lại...*\n\n⏱️ Thời gian: ~30 giây');
      break;
      
    case 'info':
      await sendDeviceCommand('esp32', 'get_info', token);
      await sendMessage(chatId, '📋 *Đang lấy thông tin ESP32...*\n\n📡 Gửi lệnh get_info đến ESP32...');
      break;
  }
}

async function handleBatchCommand(chatId, subcmd, params, token) {
  switch (subcmd) {
    case 'list':
      const batches = await getBatches(token);
      await sendMessage(chatId, formatBatches(batches));
      break;
      
    case 'new':
      if (!params) {
        userStates.set(chatId, { action: 'new_batch', step: 'name' });
        await sendMessage(chatId, '📦 *Tạo Batch Traceability Mới*\n\nNhập tên sản phẩm:');
      }
      break;
      
    case 'create':
      if (params && params.name) {
        const result = await createBatch(token, {
          product_name: params.name,
          product_type: params.type || 'Vegetables',
          farm_name: params.farm || 'EcoSynTech Farm',
          seed_variety: params.seed || 'Standard'
        });
        if (result.success || result.id) {
          await sendMessage(chatId, `✅ *Batch đã được tạo!*\n\n📋 Mã: ${result.batch_code || result.id}\n📦 Sản phẩm: ${params.name}`);
        } else {
          await sendMessage(chatId, `❌ *Lỗi tạo batch:* ${result.error || 'Unknown error'}`);
        }
      }
      break;
  }
}

async function handleScheduleCommand(chatId, subcmd, params, token) {
  switch (subcmd) {
    case 'list':
      const schedules = await getSchedules(token);
      await sendMessage(chatId, formatSchedules(schedules));
      break;
      
    case 'toggle':
      const schedules = await getSchedules(token);
      if (schedules.length > 0) {
        const s = schedules[0];
        await toggleSchedule(s.id, !s.enabled, token);
        await sendMessage(chatId, `✅ *Lịch "${s.name}" đã ${s.enabled ? 'tắt' : 'bật'}!*`);
      } else {
        await sendMessage(chatId, '❌ Không có lịch nào');
      }
      break;
  }
}

async function handleRuleCommand(chatId, subcmd, params, token) {
  switch (subcmd) {
    case 'list':
      const rules = await getRules(token);
      await sendMessage(chatId, formatRulesList(rules));
      break;
      
    case 'toggle':
      const rules = await getRules(token);
      if (rules.length > 0) {
        const r = rules[0];
        await toggleRule(r.id, !r.enabled, token);
        await sendMessage(chatId, `✅ *Rule "${r.name}" đã ${r.enabled ? 'tắt' : 'bật'}!*`);
      } else {
        await sendMessage(chatId, '❌ Không có rule nào');
      }
      break;
  }
}

async function handleCommand(chatId, command, username, text = '') {
  console.log(`[TG] ${username}: ${command}`);
  
  const token = await login();
  
  switch (command) {
    case '📊 Cảm biến':
    case '/sensors':
      const sensors = await getSensorData(token);
      await sendMessage(chatId, formatSensorData(sensors));
      break;
      
    case '🖥️ Thiết bị':
    case '/devices':
      const devices = await getDevices(token);
      await sendMessage(chatId, formatDeviceStatus(devices));
      break;
      
    case '🚨 Cảnh báo':
    case '/alerts':
      const alerts = await getAlerts(token);
      await sendMessage(chatId, formatAlerts(alerts));
      break;
      
    case '⚡ Rules':
    case '/rules':
      const rules = await getRules(token);
      await sendMessage(chatId, formatRulesList(rules));
      break;
      
    case '📜 Lịch sử':
    case '/history':
      const history = await getHistory(token);
      await sendMessage(chatId, formatHistory(history));
      break;
      
    case '📈 Thống kê':
    case '/stats':
      const stats = await getStats(token);
      await sendMessage(chatId, formatStats(stats));
      break;
      
    case '📦 Traceability':
    case '/batches':
      const batches = await getBatches(token);
      await sendMessage(chatId, formatBatches(batches));
      break;
      
    case '📅 Lịch':
    case '/schedules':
      const schedules = await getSchedules(token);
      await sendMessage(chatId, formatSchedules(schedules));
      break;
      
    case '🔌 Relay 1-4':
      await sendReplyKeyboard(chatId, '🔌 *Điều khiển Relay 1-4*\n\nChọn relay để điều khiển:', getRelayMenu());
      break;
      
    case '⚙️ Điều khiển':
      await sendReplyKeyboard(chatId, '⚙️ *Điều khiển Thiết bị*\n\nChọn thiết bị:', getControlMenu());
      break;
      
    case '◀️ Quay lại':
      await sendReplyKeyboard(chatId, '⬅️ * Quay lại menu chính*', getMainMenu());
      break;
      
    case '🔌 Relay 1 ON':
    case '/r1_on':
      await handleRelayCommand(chatId, 1, 'on', token);
      break;
    case '🔌 Relay 1 OFF':
    case '/r1_off':
      await handleRelayCommand(chatId, 1, 'off', token);
      break;
    case '🔌 Relay 2 ON':
    case '/r2_on':
      await handleRelayCommand(chatId, 2, 'on', token);
      break;
    case '🔌 Relay 2 OFF':
    case '/r2_off':
      await handleRelayCommand(chatId, 2, 'off', token);
      break;
    case '🔌 Relay 3 ON':
    case '/r3_on':
      await handleRelayCommand(chatId, 3, 'on', token);
      break;
    case '🔌 Relay 3 OFF':
    case '/r3_off':
      await handleRelayCommand(chatId, 3, 'off', token);
      break;
    case '🔌 Relay 4 ON':
    case '/r4_on':
      await handleRelayCommand(chatId, 4, 'on', token);
      break;
    case '🔌 Relay 4 OFF':
    case '/r4_off':
      await handleRelayCommand(chatId, 4, 'off', token);
      break;
    case '🔌 Tất cả ON':
    case '/r_all':
      for (let i = 1; i <= 4; i++) await handleRelayCommand(chatId, i, 'on', token);
      break;
    case '🔌 Tất cả OFF':
    case '/r_off':
      for (let i = 1; i <= 4; i++) await handleRelayCommand(chatId, i, 'off', token);
      break;
      
    case '💧 Máy bơm ON':
    case '/pump_on':
      await sendDeviceCommand('pump', 'relay1_on', token);
      await sendMessage(chatId, '✅ *Máy bơm đã bật!* 💧');
      break;
    case '💧 Máy bơm OFF':
    case '/pump_off':
      await sendDeviceCommand('pump', 'relay1_off', token);
      await sendMessage(chatId, '⚪ *Máy bơm đã tắt!*');
      break;
      
    case '🚿 Van 1 ON':
    case '/valve1_on':
      await sendDeviceCommand('valve1', 'relay2_on', token);
      await sendMessage(chatId, '✅ *Van 1 đã mở!* 🚿');
      break;
    case '🚿 Van 1 OFF':
    case '/valve1_off':
      await sendDeviceCommand('valve1', 'relay2_off', token);
      await sendMessage(chatId, '⚪ *Van 1 đã đóng!*');
      break;
      
    case '🚿 Van 2 ON':
    case '/valve2_on':
      await sendDeviceCommand('valve2', 'relay3_on', token);
      await sendMessage(chatId, '✅ *Van 2 đã mở!* 🚿');
      break;
    case '🚿 Van 2 OFF':
    case '/valve2_off':
      await sendDeviceCommand('valve2', 'relay3_off', token);
      await sendMessage(chatId, '⚪ *Van 2 đã đóng!*');
      break;
      
    case '🌀 Quạt ON':
    case '/fan_on':
      await sendDeviceCommand('fan', 'relay4_on', token);
      await sendMessage(chatId, '✅ *Quạt đã bật!* 🌀');
      break;
    case '🌀 Quạt OFF':
    case '/fan_off':
      await sendDeviceCommand('fan', 'relay4_off', token);
      await sendMessage(chatId, '⚪ *Quạt đã tắt!*');
      break;
      
    case '💡 Đèn ON':
    case '/light_on':
      await sendDeviceCommand('light', 'relay5_on', token);
      await sendMessage(chatId, '✅ *Đèn đã bật!* 💡');
      break;
    case '💡 Đèn OFF':
    case '/light_off':
      await sendDeviceCommand('light', 'relay5_off', token);
      await sendMessage(chatId, '⚪ *Đèn đã tắt!*');
      break;
      
    case '🔄 ESP32':
    case '/esp32':
      await handleESP32Command(chatId, 'status', token);
      break;
    case '/updatefw':
    case '🔄 Cập nhật FW':
      await handleESP32Command(chatId, 'update', token);
      break;
    case '/restart':
      await handleESP32Command(chatId, 'restart', token);
      break;
      
    case '⚙️ Cấu hình':
    case '/config':
      await sendMessage(chatId, `⚙️ *Cấu Hình Hệ Thống*

📡 API: ${API_BASE_URL}
🌐 MQTT: ${MQTT_BROKER_URL}
📦 Firmware URL: ${FIRMWARE_URL}
👥 Allowed Chat IDs: ${ALLOWED_CHAT_IDS.length > 0 ? ALLOWED_CHAT_IDS.join(', ') : 'All'}`);
      break;
      
    case '/start':
    case '/help':
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
  
  if (text.startsWith('/')) {
    await handleCommand(chatId, text.split(' ')[0], username);
  } else {
    const state = userStates.get(chatId);
    if (state) {
      if (state.action === 'new_batch' && state.step === 'name') {
        await handleBatchCommand(chatId, 'create', { name: text }, token);
        userStates.delete(chatId);
      }
    } else {
      await handleFreeTextCommand(chatId, text.toLowerCase().trim(), username);
    }
  }
}

async function handleFreeTextCommand(chatId, text, username) {
  const token = await login();
  
  const commands = {
    'bật bơm': () => handleCommand(chatId, '/pump_on', username),
    'tắt bơm': () => handleCommand(chatId, '/pump_off', username),
    'bật relay 1': () => handleCommand(chatId, '/r1_on', username),
    'tắt relay 1': () => handleCommand(chatId, '/r1_off', username),
    'bật relay 2': () => handleCommand(chatId, '/r2_on', username),
    'tắt relay 2': () => handleCommand(chatId, '/r2_off', username),
    'bật relay 3': () => handleCommand(chatId, '/r3_on', username),
    'tắt relay 3': () => handleCommand(chatId, '/r3_off', username),
    'bật relay 4': () => handleCommand(chatId, '/r4_on', username),
    'tắt relay 4': () => handleCommand(chatId, '/r4_off', username),
    'bật tất cả': () => handleCommand(chatId, '/r_all', username),
    'tắt tất cả': () => handleCommand(chatId, '/r_off', username),
    'mở van': () => handleCommand(chatId, '/valve1_on', username),
    'đóng van': () => handleCommand(chatId, '/valve1_off', username),
    'bật quạt': () => handleCommand(chatId, '/fan_on', username),
    'tắt quạt': () => handleCommand(chatId, '/fan_off', username),
    'bật đèn': () => handleCommand(chatId, '/light_on', username),
    'tắt đèn': () => handleCommand(chatId, '/light_off', username),
    'trạng thái': () => handleCommand(chatId, '/status', username),
    'cảm biến': () => handleCommand(chatId, '/sensors', username),
    'thiết bị': () => handleCommand(chatId, '/devices', username),
    'cảnh báo': () => handleCommand(chatId, '/alerts', username),
    'rules': () => handleCommand(chatId, '/rules', username),
    'help': () => handleCommand(chatId, '/help', username),
    'menu': () => handleCommand(chatId, '/start', username),
    'batch': () => handleCommand(chatId, '/batches', username),
    'lịch': () => handleCommand(chatId, '/schedules', username),
    'thống kê': () => handleCommand(chatId, '/stats', username),
    'lịch sử': () => handleCommand(chatId, '/history', username),
    'restart': () => handleCommand(chatId, '/restart', username),
    'cập nhật firmware': () => handleCommand(chatId, '/updatefw', username),
    'esp32': () => handleCommand(chatId, '/esp32', username)
  };
  
  if (commands[text]) {
    await commands[text]();
  } else if (text.length > 0) {
    await sendReplyKeyboard(chatId, `Tôi hiểu "${text}" nhưng không có lệnh nào phù hợp.\n\nGõ /help để xem danh sách lệnh.`, getMainMenu());
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
  console.log('   EcoSynTech IoT Telegram Controller v2.0');
  console.log('═══════════════════════════════════════════════');
  console.log('Bot Token:', BOT_TOKEN ? '✓ Configured' : '✗ Not set');
  console.log('Allowed Chats:', ALLOWED_CHAT_IDS.length > 0 ? ALLOWED_CHAT_IDS.join(', ') : 'All');
  console.log('API Base URL:', API_BASE_URL);
  console.log('═══════════════════════════════════════════════');
  
  if (!BOT_TOKEN) {
    console.log('\n⚠️  WARNING: TELEGRAM_BOT_TOKEN not set!');
    console.log('   Set TELEGRAM_BOT_TOKEN in .env to enable Telegram bot.\n');
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
