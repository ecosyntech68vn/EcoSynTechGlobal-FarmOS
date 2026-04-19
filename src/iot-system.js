const ThemeManager = {
  STORAGE_KEY: 'ecosyntech-theme',
  
  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    this.setTheme(theme);
    this.setupToggle();
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },
  
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  },
  
  setupToggle() {
    const existingToggle = document.getElementById('themeToggle');
    if (existingToggle) return;
    
    const header = document.querySelector('.topbar');
    if (!header) return;
    
    const toggle = document.createElement('button');
    toggle.id = 'themeToggle';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    
    toggle.addEventListener('click', () => this.toggle());
    
    header.appendChild(toggle);
  }
};

const NotificationService = {
  permission: 'default',
  
  async init() {
    if (!('Notification' in window)) return false;
    
    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      const result = await Notification.requestPermission();
      this.permission = result;
    }
    
    return this.permission === 'granted';
  },
  
  async requestPermission() {
    if (!('Notification' in window)) return false;
    
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  },
  
  show(title, options = {}) {
    if (this.permission !== 'granted') return null;
    
    const notification = new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'ecosyn-notification',
      requireInteraction: false,
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };
    
    setTimeout(() => notification.close(), options.duration || 10000);
    
    return notification;
  },
  
  showSensorAlert(sensor, value, severity) {
    const titles = {
      warning: 'Cảnh báo cảm biến',
      danger: 'Nguy hiểm! Cảnh báo khẩn'
    };
    
    const messages = {
      temperature: `${value}°C - Nhiệt độ ${severity === 'danger' ? 'quá cao' : 'cao'}`,
      soil: `${value}% - Độ ẩm đất ${severity === 'danger' ? 'quá thấp' : 'thấp'}`,
      water: `${value}% - Mực nước ${severity === 'danger' ? 'nguy hiểm' : 'thấp'}`,
      humidity: `${value}% - Độ ẩm không khí cao`
    };
    
    this.show(titles[severity] || 'Cảnh báo', {
      body: messages[sensor] || `Giá trị: ${value}`,
      tag: `sensor-${sensor}`,
      requireInteraction: severity === 'danger'
    });
  },
  
  showSystemMessage(message, type = 'info') {
    const toasts = document.getElementById('toastContainer') || this.createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toasts.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },
  
  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }
};

const WebSocketClient = {
  ws: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  subscriptions: new Set(),
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      this.scheduleReconnect();
    }
  },
  
  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
      NotificationService.showSystemMessage('Đã kết nối WebSocket', 'success');
      
      if (IoTSystem.token) {
        this.authenticate(IoTSystem.token);
      }
      
      this.resubscribe();
    };
    
    this.ws.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code, event.reason);
      this.updateConnectionStatus(false);
      this.scheduleReconnect();
    };
    
    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };
  },
  
  handleMessage(data) {
    switch (data.type) {
    case 'connected':
      console.log('[WS] Client ID:', data.clientId);
      break;
        
    case 'sensor-update':
      if (IoTSystem && IoTSystem.handleSensorData) {
        IoTSystem.handleSensorData(data.data);
      }
      break;
        
    case 'alert':
      if (data.action === 'created' && IoTSystem && IoTSystem.handleAlert) {
        IoTSystem.handleAlert(data.data);
      }
      break;
        
    case 'device-update':
    case 'device':
      if (IoTSystem && IoTSystem.handleDeviceUpdate) {
        IoTSystem.handleDeviceUpdate(data.data);
      }
      break;
        
    case 'rule-triggered':
    case 'rule':
      if (IoTSystem && IoTSystem.handleRuleUpdate) {
        IoTSystem.handleRuleUpdate(data);
      }
      break;
        
    case 'history':
      if (IoTSystem && IoTSystem.handleHistoryUpdate) {
        IoTSystem.handleHistoryUpdate(data.data);
      }
      break;
        
    case 'pong':
      break;
        
    default:
      console.log('[WS] Unknown message type:', data.type);
    }
  },
  
  authenticate(token) {
    this.send({ type: 'auth', token });
  },
  
  subscribe(topics) {
    if (typeof topics === 'string') {
      this.subscriptions.add(topics);
    } else if (Array.isArray(topics)) {
      topics.forEach(t => this.subscriptions.add(t));
    }
    
    if (this.isConnected()) {
      this.send({ type: 'subscribe', topics: Array.from(this.subscriptions) });
    }
  },
  
  resubscribe() {
    if (this.subscriptions.size > 0) {
      this.send({ type: 'subscribe', topics: Array.from(this.subscriptions) });
    }
  },
  
  send(data) {
    if (this.isConnected()) {
      this.ws.send(JSON.stringify(data));
    }
  },
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  },
  
  updateConnectionStatus(connected) {
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
      indicator.classList.toggle('online', connected);
      indicator.classList.toggle('offline', !connected);
    }
  },
  
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      NotificationService.showSystemMessage('Không thể kết nối WebSocket', 'error');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  },
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
};

const IoTSystem = {
  token: null,
  updateInterval: null,
  baseUrl: '/api',
  sensors: {},
  devices: [],
  rules: [],
  schedules: [],
  history: [],
  alerts: [],
  
  async init() {
    this.checkAuth();
    await this.loadInitialData();
    this.initEventListeners();
    this.initCharts();
    this.startRealTimeUpdates();
    this.subscribeToEvents();
    
    NotificationService.init();
  },
  
  checkAuth() {
    this.token = localStorage.getItem('ecosyntech_token');
  },
  
  async loadInitialData() {
    try {
      const [stats, devices, rules, schedules, history, alerts] = await Promise.all([
        this.fetch('/stats'),
        this.fetch('/devices'),
        this.fetch('/rules'),
        this.fetch('/schedules'),
        this.fetch('/history?limit=50'),
        this.fetch('/alerts')
      ]);
      
      if (stats) {
        this.sensors = stats.sensors || {};
        this.updateSensorCards(stats.sensors);
        this.updateStatsDisplay(stats);
      }
      
      if (devices) this.devices = devices;
      if (rules) this.rules = rules;
      if (schedules) this.schedules = schedules;
      if (history) this.history = history;
      if (alerts) this.alerts = alerts;
      
      this.renderRules();
      this.renderSchedules();
      this.renderHistory();
      this.renderAlerts();
      this.updateAlertCount();
      
    } catch (err) {
      console.error('Failed to load initial data:', err);
      NotificationService.showSystemMessage('Không thể tải dữ liệu', 'error');
    }
  },
  
  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (err) {
      console.error(`API Error (${endpoint}):`, err);
      throw err;
    }
  },
  
  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async delete(endpoint) {
    return this.fetch(endpoint, {
      method: 'DELETE'
    });
  },
  
  handleAuthError() {
    this.token = null;
    localStorage.removeItem('ecosyntech_token');
    NotificationService.showSystemMessage('Phiên đăng nhập hết hạn', 'warning');
  },
  
  updateSensorCards(sensors) {
    if (!sensors) return;
    
    Object.entries(sensors).forEach(([type, data]) => {
      const card = document.querySelector(`.sensor-card[data-sensor="${type}"]`);
      if (!card) return;
      
      const valueEl = card.querySelector('.sensor-value');
      if (valueEl && data.value !== undefined) {
        const unit = valueEl.querySelector('span')?.textContent || data.unit || '';
        valueEl.innerHTML = `${data.value}<span>${unit}</span>`;
      }
      
      this.checkSensorAlert(card, type, data.value, data.min, data.max);
      this.updateSensorChart(card, type, data.value);
    });
  },
  
  checkSensorAlert(card, type, value, min, max) {
    if (value === undefined || min === undefined || max === undefined) return;
    
    card.classList.remove('alert-warning', 'alert-danger');
    
    const warningThreshold = type === 'temperature' ? (max * 0.9) : (min * 1.15);
    const dangerThreshold = type === 'temperature' ? (max * 1.05) : (min * 0.85);
    
    if (value > dangerThreshold || value < (min * 0.7)) {
      card.classList.add('alert-danger');
      this.triggerAlert(type, value, 'danger');
    } else if (value > warningThreshold || value < (min * 0.85)) {
      card.classList.add('alert-warning');
    }
  },
  
  updateSensorChart(card, type, value) {
    const chart = card.querySelector('.sensor-chart');
    if (!chart) return;
    
    const bars = chart.querySelectorAll('span');
    if (bars.length === 0) return;
    
    for (let i = 0; i < bars.length - 1; i++) {
      bars[i].style.height = bars[i + 1].style.height;
    }
    
    const normalizedHeight = Math.min(Math.max((value / 100) * 100, 5), 95);
    bars[bars.length - 1].style.height = `${normalizedHeight}%`;
    
    const waterFill = card.querySelector('.water-fill');
    if (waterFill && type === 'water') {
      waterFill.style.height = `${value}%`;
    }
  },
  
  handleSensorData(data) {
    if (!data || !data.type) return;
    
    this.sensors[data.type] = data;
    
    const card = document.querySelector(`.sensor-card[data-sensor="${data.type}"]`);
    if (!card) return;
    
    const valueEl = card.querySelector('.sensor-value');
    if (valueEl) {
      const unit = valueEl.querySelector('span')?.textContent || data.unit || '';
      valueEl.innerHTML = `${data.value}<span>${unit}</span>`;
    }
    
    this.updateSensorChart(card, data.type, data.value);
    this.checkSensorAlert(card, data.type, data.value, data.min, data.max);
    
    this.updateLastUpdateTime();
  },
  
  handleAlert(alertData) {
    this.alerts.unshift(alertData);
    this.alerts = this.alerts.slice(0, 20);
    
    this.renderAlerts();
    this.updateAlertCount();
    
    if (alertData.severity === 'danger' || alertData.severity === 'warning') {
      NotificationService.showSensorAlert(alertData.sensor, alertData.value, alertData.severity);
    }
  },
  
  handleDeviceUpdate(deviceData) {
    const index = this.devices.findIndex(d => d.id === deviceData.id);
    if (index >= 0) {
      this.devices[index] = { ...this.devices[index], ...deviceData };
    }
  },
  
  handleRuleUpdate(data) {
    if (data.action === 'created' || data.action === 'updated') {
      const index = this.rules.findIndex(r => r.id === data.data.id);
      if (index >= 0) {
        this.rules[index] = data.data;
      } else {
        this.rules.push(data.data);
      }
    } else if (data.action === 'deleted') {
      this.rules = this.rules.filter(r => r.id !== data.data.id);
    }
    
    this.renderRules();
  },
  
  handleHistoryUpdate(historyData) {
    this.history.unshift(historyData);
    this.history = this.history.slice(0, 50);
    this.renderHistory();
  },
  
  triggerAlert(sensor, value, severity) {
    const alert = {
      id: `alert-${Date.now()}`,
      type: 'sensor',
      severity,
      sensor,
      value,
      message: `Sensor ${sensor} reading ${value} is ${severity === 'danger' ? 'critical' : 'warning'}`,
      timestamp: new Date().toISOString()
    };
    
    this.handleAlert(alert);
  },
  
  initEventListeners() {
    document.getElementById('refreshDashboard')?.addEventListener('click', () => this.refreshData());
    document.getElementById('exportData')?.addEventListener('click', () => this.exportData());
    document.getElementById('fullscreenDashboard')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('addRuleBtn')?.addEventListener('click', () => this.openRuleModal());
    document.getElementById('addScheduleBtn')?.addEventListener('click', () => this.openScheduleModal());
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    document.getElementById('ruleForm')?.addEventListener('submit', (e) => this.handleRuleSubmit(e));
    document.getElementById('closeRuleModal')?.addEventListener('click', () => this.closeRuleModal());
    document.getElementById('cancelRule')?.addEventListener('click', () => this.closeRuleModal());
    
    document.getElementById('alertPanel')?.addEventListener('click', (e) => {
      if (e.target.id === 'closeAlerts') {
        document.getElementById('alertPanel')?.classList.remove('open');
      }
    });
    
    document.querySelector('.alert-mark-all')?.addEventListener('click', () => this.acknowledgeAllAlerts());
    
    const devicesList = document.querySelector('.devices-list');
    if (devicesList) {
      devicesList.addEventListener('click', (e) => this.handleDeviceAction(e));
    }
    
    const rulesList = document.getElementById('rulesList');
    if (rulesList) {
      rulesList.addEventListener('click', (e) => this.handleRuleAction(e));
    }
  },
  
  initCharts() {
    document.querySelectorAll('.sensor-chart').forEach(chart => {
      const sensorCard = chart.closest('.sensor-card');
      const sensorType = sensorCard?.dataset.sensor;
      const valueEl = sensorCard?.querySelector('.sensor-value');
      
      if (!sensorType || !valueEl) return;
      
      const currentValue = parseFloat(valueEl.textContent) || 50;
      chart.innerHTML = this.generateChartBars(sensorType, currentValue);
    });
  },
  
  generateChartBars(type, currentValue) {
    const variance = type === 'ph' ? 0.3 : (type === 'ec' ? 0.2 : 5);
    const bars = [];
    
    for (let i = 0; i < 12; i++) {
      const offset = (Math.random() - 0.5) * variance;
      const value = Math.max(0, Math.min(100, currentValue + offset));
      const height = Math.min(Math.max((value / 100) * 100, 10), 100);
      bars.push(`<span style="height: ${height}%"></span>`);
    }
    
    bars.push(`<span style="height: ${(currentValue / 100) * 100}%"></span>`);
    
    return bars.join('');
  },
  
  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateLastUpdateTime();
    }, 5000);
  },
  
  updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = 'vừa xong';
    }
  },
  
  subscribeToEvents() {
    if (typeof WebSocketClient !== 'undefined') {
      WebSocketClient.connect();
      WebSocketClient.subscribe(['sensors', 'alerts', 'devices', 'rules', 'history']);
    }
  },
  
  async refreshData() {
    const btn = document.getElementById('refreshDashboard');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Đang tải...';
    }
    
    try {
      await this.loadInitialData();
      NotificationService.showSystemMessage('Đã cập nhật dữ liệu', 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi cập nhật dữ liệu', 'error');
    }
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>✓</span> Đã cập nhật';
      setTimeout(() => {
        btn.innerHTML = '<span>🔄</span> Làm mới dữ liệu';
      }, 2000);
    }
  },
  
  updateStatsDisplay(stats) {
    const onlineEls = document.querySelectorAll('.device-count.online');
    const offlineEls = document.querySelectorAll('.device-count.offline');
    
    if (stats.devices) {
      onlineEls.forEach(el => { el.textContent = stats.devices.online; });
      offlineEls.forEach(el => { el.textContent = stats.devices.offline; });
      const totalOnline = document.querySelectorAll('.iot-status span')[1];
      if (totalOnline) {
        totalOnline.textContent = `${stats.devices.total} thiết bị`;
      }
    }
  },
  
  renderRules() {
    const rulesList = document.getElementById('rulesList');
    if (!rulesList) return;
    
    rulesList.innerHTML = this.rules.map(rule => `
      <div class="rule-card" data-rule-id="${rule.id}">
        <div class="rule-card-header">
          <div>
            <span class="rule-name">${rule.name}</span>
            <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 4px;">${rule.description || ''}</p>
          </div>
          <label class="rule-toggle">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle-rule" data-id="${rule.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="rule-conditions">
          <span class="condition-tag">IF ${this.getConditionText(rule.condition)}</span>
          <span class="logic-and">THEN</span>
          <span class="action-tag">${this.getActionText(rule.action)}</span>
        </div>
        <div class="rule-footer">
          <span class="rule-meta">
            Lần cuối: ${rule.lastTriggered ? this.formatTime(rule.lastTriggered) : 'Chưa chạy'} · Đã kích hoạt: ${rule.triggerCount || 0} lần
          </span>
          <div class="rule-actions">
            <button data-action="edit-rule" data-id="${rule.id}">Sửa</button>
            <button data-action="delete-rule" data-id="${rule.id}">Xóa</button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  renderSchedules() {
    const scheduleGrid = document.querySelector('.schedule-grid');
    if (!scheduleGrid) return;
    
    const zoneNames = {
      zone1: 'Zone 1', zone2: 'Zone 2', zone3: 'Zone 3',
      zone4: 'Zone 4', zone5: 'Zone 5', all: 'Tất cả'
    };
    
    scheduleGrid.innerHTML = this.schedules.map(sched => `
      <div class="schedule-card" data-id="${sched.id}">
        <div class="schedule-card-header">
          <h4>${sched.name}</h4>
          <label class="rule-toggle small">
            <input type="checkbox" ${sched.enabled ? 'checked' : ''} data-action="toggle-schedule" data-id="${sched.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p>${sched.time} - ${sched.duration} phút</p>
        <span class="schedule-status ${sched.enabled ? 'active' : ''}">${sched.enabled ? 'Đang hoạt động' : 'Tạm dừng'}</span>
        <div class="schedule-zones">
          ${(sched.zones || []).map(z => `<span>${zoneNames[z] || z}</span>`).join('')}
        </div>
        <div class="schedule-days">
          ${(sched.days || []).map(d => `<span class="day-tag">${d}</span>`).join('')}
        </div>
        <div class="schedule-actions">
          <button class="ghost" data-action="edit-schedule" data-id="${sched.id}">Sửa</button>
          <button class="ghost" data-action="delete-schedule" data-id="${sched.id}">Xóa</button>
        </div>
      </div>
    `).join('');
  },
  
  renderHistory() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    if (this.history.length === 0) {
      historyList.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">Chưa có lịch sử hoạt động</p>';
      return;
    }
    
    historyList.innerHTML = this.history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <span class="history-time">${this.formatTime(item.timestamp)}</span>
        <span class="history-action">${item.action}</span>
        <span class="history-trigger">${item.trigger || ''}</span>
        <span class="history-status ${item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'error'}">${item.status === 'success' ? 'Thành công' : item.status === 'warning' ? 'Cảnh báo' : 'Lỗi'}</span>
      </div>
    `).join('');
  },
  
  renderAlerts() {
    const alertList = document.querySelector('.alert-list');
    if (!alertList) return;
    
    const icons = { warning: '⚠️', danger: '🚨', info: 'ℹ️' };
    
    alertList.innerHTML = (this.alerts || []).slice(0, 10).map(alert => `
      <div class="alert-item ${alert.severity || 'info'}">
        <span class="alert-icon">${icons[alert.severity] || icons.info}</span>
        <div class="alert-content">
          <strong>${this.getSensorName(alert.sensor)}</strong>
          <p>${alert.message || `Giá trị: ${alert.value}`}</p>
          <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
        </div>
      </div>
    `).join('');
  },
  
  updateAlertCount() {
    const countEl = document.querySelector('.alert-count');
    if (countEl) {
      const unacknowledged = (this.alerts || []).filter(a => !a.acknowledged).length;
      countEl.textContent = unacknowledged;
      countEl.style.display = unacknowledged > 0 ? 'inline' : 'none';
    }
  },
  
  getConditionText(condition) {
    const sensorNames = {
      soil: 'Độ ẩm đất', temperature: 'Nhiệt độ', humidity: 'Độ ẩm KK',
      light: 'Ánh sáng', ph: 'pH', water: 'Mực nước'
    };
    const opSymbols = { '<': '<', '>': '>', '<=': '≤', '>=': '≥', '==': '=' };
    
    return `${sensorNames[condition.sensor] || condition.sensor} ${opSymbols[condition.operator] || condition.operator} ${condition.value}`;
  },
  
  getActionText(action) {
    const actionNames = {
      valve_open: 'Mở van tưới', valve_close: 'Đóng van tưới',
      pump_start: 'Bật bơm', pump_stop: 'Tắt bơm',
      fan_on: 'Bật quạt', fan_off: 'Tắt quạt',
      light_on: 'Bật đèn', light_off: 'Tắt đèn',
      alert: 'Gửi cảnh báo'
    };
    
    const targetNames = {
      zone1: 'Zone 1', zone2: 'Zone 2', zone3: 'Zone 3',
      zone4: 'Zone 4', zone5: 'Zone 5', all: 'Tất cả'
    };
    
    return `${actionNames[action.type] || action.type} (${targetNames[action.target] || action.target})`;
  },
  
  getSensorName(sensor) {
    const names = {
      temperature: 'Nhiệt độ', humidity: 'Độ ẩm', soil: 'Độ ẩm đất',
      light: 'Ánh sáng', ph: 'pH', water: 'Mực nước'
    };
    return names[sensor] || sensor || 'Cảm biến';
  },
  
  formatTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  },
  
  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
  },
  
  handleRuleAction(e) {
    const target = e.target;
    const action = target.dataset.action;
    const ruleId = target.dataset.id;
    
    if (!action || !ruleId) return;
    
    if (action === 'toggle-rule') {
      this.toggleRule(ruleId, target.checked);
    } else if (action === 'edit-rule') {
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule) this.openRuleModal(rule);
    } else if (action === 'delete-rule') {
      if (confirm('Bạn có chắc muốn xóa rule này?')) {
        this.deleteRule(ruleId);
      }
    }
  },
  
  async toggleRule(ruleId, enabled) {
    try {
      await this.post(`/rules/${ruleId}/toggle`, { enabled });
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule) rule.enabled = enabled;
      this.renderRules();
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi cập nhật rule', 'error');
    }
  },
  
  async deleteRule(ruleId) {
    try {
      await this.delete(`/rules/${ruleId}`);
      this.rules = this.rules.filter(r => r.id !== ruleId);
      this.renderRules();
      NotificationService.showSystemMessage('Đã xóa rule', 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi xóa rule', 'error');
    }
  },
  
  openRuleModal(rule = null) {
    const modal = document.getElementById('ruleModal');
    const form = document.getElementById('ruleForm');
    
    if (rule) {
      form.elements.ruleName.value = rule.name;
      form.elements.ruleDescription.value = rule.description || '';
      form.elements.sensorType.value = rule.condition.sensor;
      form.elements.operator.value = rule.condition.operator;
      form.elements.threshold.value = rule.condition.value;
      form.elements.actionType.value = rule.action.type;
      form.elements.targetZone.value = rule.action.target;
      form.elements.enabled.checked = rule.enabled;
      form.dataset.editingId = rule.id;
    } else {
      form.reset();
      delete form.dataset.editingId;
    }
    
    modal.classList.add('open');
  },
  
  closeRuleModal() {
    document.getElementById('ruleModal').classList.remove('open');
  },
  
  async handleRuleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editingId = form.dataset.editingId;
    
    const ruleData = {
      name: form.elements.ruleName.value,
      description: form.elements.ruleDescription.value,
      enabled: form.elements.enabled.checked,
      condition: {
        sensor: form.elements.sensorType.value,
        operator: form.elements.operator.value,
        value: parseFloat(form.elements.threshold.value)
      },
      action: {
        type: form.elements.actionType.value,
        target: form.elements.targetZone.value
      }
    };
    
    try {
      if (editingId) {
        const updated = await this.put(`/rules/${editingId}`, ruleData);
        const index = this.rules.findIndex(r => r.id === editingId);
        if (index >= 0) this.rules[index] = updated;
      } else {
        const created = await this.post('/rules', ruleData);
        this.rules.push(created);
      }
      
      this.renderRules();
      this.closeRuleModal();
      NotificationService.showSystemMessage(editingId ? 'Đã cập nhật rule' : 'Đã tạo rule mới', 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi lưu rule', 'error');
    }
  },
  
  openScheduleModal(schedule = null) {
    const modal = document.createElement('div');
    modal.className = 'rule-modal open';
    modal.id = 'scheduleModal';
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };
    
    modal.innerHTML = `
      <div class="rule-modal-content">
        <div class="rule-modal-header">
          <h3>${schedule ? 'Sửa lịch' : 'Tạo lịch mới'}</h3>
          <button class="ghost close-modal">×</button>
        </div>
        <form id="scheduleForm" data-editing-id="${schedule?.id || ''}">
          <div class="form-group">
            <label>Tên lịch</label>
            <input type="text" name="scheduleName" value="${schedule?.name || ''}" required />
          </div>
          <div class="form-group">
            <label>Thời gian</label>
            <input type="time" name="scheduleTime" value="${schedule?.time || '06:00'}" required />
          </div>
          <div class="form-group">
            <label>Thời lượng (phút)</label>
            <input type="number" name="scheduleDuration" value="${schedule?.duration || 60}" min="5" max="240" required />
          </div>
          <div class="form-group">
            <label>Zones</label>
            <div class="zone-checkboxes">
              ${['zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'all'].map(z => `
                <label><input type="checkbox" name="zones" value="${z}" ${(schedule?.zones || []).includes(z) ? 'checked' : ''}> ${z === 'all' ? 'Tất cả' : 'Zone ' + z.charAt(4)}</label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Ngày</label>
            <div class="zone-checkboxes">
              ${days.map(d => `
                <label><input type="checkbox" name="days" value="${d}" ${(schedule?.days || days).includes(d) ? 'checked' : ''}> ${dayNames[d]}</label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label><input type="checkbox" name="scheduleEnabled" ${schedule?.enabled !== false ? 'checked' : ''} /> Kích hoạt</label>
          </div>
          <div class="form-actions">
            <button type="button" class="ghost close-modal">Hủy</button>
            <button type="submit" class="cta">Lưu</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#scheduleForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const editingId = form.dataset.editingId;
      
      const scheduleData = {
        name: form.scheduleName.value,
        time: form.scheduleTime.value,
        duration: parseInt(form.scheduleDuration.value),
        zones: Array.from(form.querySelectorAll('input[name="zones"]:checked')).map(i => i.value),
        days: Array.from(form.querySelectorAll('input[name="days"]:checked')).map(i => i.value),
        enabled: form.scheduleEnabled.checked
      };
      
      try {
        if (editingId) {
          const updated = await this.put(`/schedules/${editingId}`, scheduleData);
          const index = this.schedules.findIndex(s => s.id === editingId);
          if (index >= 0) this.schedules[index] = updated;
        } else {
          const created = await this.post('/schedules', scheduleData);
          this.schedules.push(created);
        }
        
        this.renderSchedules();
        modal.remove();
        NotificationService.showSystemMessage(editingId ? 'Đã cập nhật lịch' : 'Đã tạo lịch mới', 'success');
      } catch (err) {
        NotificationService.showSystemMessage('Lỗi khi lưu lịch', 'error');
      }
    });
  },
  
  async acknowledgeAllAlerts() {
    try {
      await this.post('/alerts/acknowledge-all');
      this.alerts.forEach(a => a.acknowledged = true);
      this.renderAlerts();
      this.updateAlertCount();
      NotificationService.showSystemMessage('Đã đánh dấu tất cả đã đọc', 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi xác nhận cảnh báo', 'error');
    }
  },
  
  handleDeviceAction(e) {
    const target = e.target;
    const deviceItem = target.closest('.device-item');
    if (!deviceItem) return;
    
    const deviceName = deviceItem.querySelector('h4')?.textContent || '';
    const deviceId = deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    if (target.closest('button')?.title === 'Bật/Tắt') {
      const stateEl = deviceItem.querySelector('.device-state');
      if (stateEl) {
        const isRunning = stateEl.classList.contains('running');
        stateEl.textContent = isRunning ? 'ĐANG CHỜ' : 'ĐANG CHẠY';
        stateEl.classList.toggle('running', !isRunning);
        stateEl.classList.toggle('idle', isRunning);
        
        this.sendDeviceCommand(deviceId, isRunning ? 'stop' : 'start');
      }
    } else if (target.closest('button')?.title === 'Cấu hình') {
      this.openDeviceConfigModal(deviceId, deviceName);
    }
  },
  
  async sendDeviceCommand(deviceId, command) {
    try {
      await this.post(`/devices/${deviceId}/command`, { command });
      NotificationService.showSystemMessage(`Đã gửi lệnh ${command}`, 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi gửi lệnh', 'error');
    }
  },
  
  openDeviceConfigModal(deviceId, deviceName) {
    const modal = document.getElementById('deviceConfigModal');
    const form = document.getElementById('deviceConfigForm');
    
    form.elements.deviceName.value = deviceName;
    form.dataset.deviceId = deviceId;
    
    modal.classList.add('open');
  },
  
  toggleFullscreen() {
    const dashboard = document.getElementById('iot-dashboard');
    if (!dashboard) return;
    
    if (!document.fullscreenElement) {
      dashboard.requestFullscreen?.() || dashboard.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  },
  
  async exportData() {
    try {
      const data = await this.post('/export', {});
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecosyntech-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      NotificationService.showSystemMessage('Đã xuất dữ liệu', 'success');
    } catch (err) {
      NotificationService.showSystemMessage('Lỗi khi xuất dữ liệu', 'error');
    }
  },
  
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  
  if (document.getElementById('iot-dashboard')) {
    IoTSystem.init();
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
});

window.IoTSystem = IoTSystem;
window.WebSocketClient = WebSocketClient;
window.NotificationService = NotificationService;
window.ThemeManager = ThemeManager;
