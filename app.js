const menuButton = document.querySelector('.menu');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(value) + '₫';

const cartButton = document.querySelector('.cart-button');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartClose = document.querySelector('.cart-close');
const cartItems = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const cartSubtotal = document.querySelector('.cart-subtotal');
const cartTotal = document.querySelector('.cart-total');
const checkoutForm = document.querySelector('.checkout');
const exportQuote = document.querySelector('#exportQuote');

const storeGrid = document.querySelector('#storeGrid');
const filterButtons = document.querySelectorAll('.filter-button');
const searchInput = document.querySelector('.search input');

const modal = document.querySelector('#productModal');
const modalTitle = document.querySelector('#modalTitle');
const modalDescription = document.querySelector('#modalDescription');
const modalSpecs = document.querySelector('#modalSpecs');
const modalDetail = document.querySelector('#modalDetail');
const modalPrice = document.querySelector('#modalPrice');
const modalAdd = document.querySelector('#modalAdd');
const modalClose = document.querySelector('#modalClose');

const fallbackProducts = [
  {
    id: 'sensor-01',
    name: 'EcoSyn SoilSense',
    price: 6800000,
    category: 'sensor',
    badge: 'Bán chạy',
    status: 'Còn hàng',
    description: 'Cảm biến đất 4 trong 1: độ ẩm, pH, EC, nhiệt độ.',
    specs: ['LoRaWAN 15 km', 'Pin 24 tháng', 'IP67'],
    detail: 'Phù hợp cho rau màu, cây ăn trái. Tự hiệu chuẩn mỗi 30 ngày, sai số thấp trong môi trường ẩm cao.'
  },
  {
    id: 'sensor-02',
    name: 'EcoSyn AirPulse',
    price: 5200000,
    category: 'sensor',
    badge: 'Mới',
    status: 'Còn hàng',
    description: 'Cảm biến vi khí hậu: nhiệt độ, độ ẩm, ánh sáng, gió.',
    specs: ['Chống sương mù', 'Pin 18 tháng', 'IP66'],
    detail: 'Giám sát khí hậu tầng tán, cảnh báo sớm khô hạn và sốc nhiệt cho cây trồng.'
  },
  {
    id: 'gateway-01',
    name: 'EcoSyn Bridge X2',
    price: 15800000,
    category: 'gateway',
    badge: 'Pro',
    status: 'Còn hàng',
    description: 'Gateway LoRaWAN + 4G/LTE, tối ưu cho vùng nông thôn.',
    specs: ['SIM kép', 'UPS 8 giờ', 'AI edge'],
    detail: 'Tối ưu kết nối cho vùng sâu, cho phép đồng bộ dữ liệu ngay cả khi mất điện lưới.'
  },
  {
    id: 'automation-01',
    name: 'EcoSyn Valve Kit',
    price: 9400000,
    category: 'automation',
    badge: 'Tiết kiệm',
    status: 'Còn hàng',
    description: 'Bộ điều khiển 2 van tưới + cảm biến áp suất.',
    specs: ['Điều khiển zone', 'Điện 12V', 'IP65'],
    detail: 'Điều khiển theo lịch hoặc theo điều kiện độ ẩm đất, giảm thất thoát nước.'
  },
  {
    id: 'automation-02',
    name: 'EcoSyn Pump Brain',
    price: 12400000,
    category: 'automation',
    badge: 'Kho bãi',
    status: 'Còn hàng',
    description: 'Điều khiển bơm trung tâm, đo lưu lượng và cảnh báo rò rỉ.',
    specs: ['3 pha 380V', 'HMI mini', 'Modbus'],
    detail: 'Tích hợp cảm biến lưu lượng, phát hiện rò rỉ theo thời gian thực và cảnh báo về app.'
  },
  {
    id: 'power-01',
    name: 'EcoSyn Solar Pack',
    price: 17600000,
    category: 'power',
    badge: 'Off-grid',
    status: 'Còn hàng',
    description: 'Bộ năng lượng mặt trời 400W kèm lưu trữ cho trạm cảm biến.',
    specs: ['Pin LiFePO4', 'Giám sát năng lượng', 'Khung chống gió'],
    detail: 'Tối ưu cho khu vực không có điện lưới, có thể cấp nguồn cho 1 gateway + 8 cảm biến.'
  }
];

const cart = new Map();
let products = [];
let activeFilter = 'all';
let selectedProduct = null;

const toggleCart = (open) => {
  document.body.classList.toggle('cart-open', open);
  if (cartDrawer) {
    cartDrawer.setAttribute('aria-hidden', String(!open));
  }
  if (cartOverlay) {
    cartOverlay.setAttribute('aria-hidden', String(!open));
  }
};

const toggleModal = (open) => {
  if (!modal) {
    return;
  }
  modal.classList.toggle('open', open);
  modal.setAttribute('aria-hidden', String(!open));
};

if (cartButton) {
  cartButton.addEventListener('click', () => toggleCart(true));
}

if (cartOverlay) {
  cartOverlay.addEventListener('click', () => toggleCart(false));
}

if (cartClose) {
  cartClose.addEventListener('click', () => toggleCart(false));
}

if (modalClose) {
  modalClose.addEventListener('click', () => toggleModal(false));
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      toggleModal(false);
    }
  });
}

const renderCart = () => {
  if (!cartItems) {
    return;
  }

  const items = Array.from(cart.values());
  cartItems.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cart-item';
    empty.textContent = 'Giỏ hàng trống. Hãy chọn thiết bị phù hợp mùa vụ của bạn.';
    cartItems.appendChild(empty);
  } else {
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-header">
          <strong>${item.name}</strong>
          <span>${formatVnd(item.price)}</span>
        </div>
        <div class="qty-controls">
          <button type="button" data-action="decrease" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-action="increase" data-id="${item.id}">+</button>
        </div>
        <div>
          <span>Tạm tính:</span>
          <strong>${formatVnd(item.price * item.qty)}</strong>
        </div>
      `;
      cartItems.appendChild(row);
    });
  }

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (cartCount) {
    cartCount.textContent = totalQty;
  }
  if (cartSubtotal) {
    cartSubtotal.textContent = formatVnd(subtotal);
  }
  if (cartTotal) {
    cartTotal.textContent = formatVnd(subtotal);
  }
};

const addToCart = (item) => {
  if (cart.has(item.id)) {
    cart.get(item.id).qty += 1;
  } else {
    cart.set(item.id, { ...item, qty: 1 });
  }
  renderCart();
  toggleCart(true);
};

const renderStore = (items) => {
  if (!storeGrid) {
    return;
  }

  storeGrid.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'store-card';
    card.dataset.category = item.category;
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="badge">${item.badge}</div>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="specs">
        ${item.specs.map((spec) => `<span>${spec}</span>`).join('')}
      </div>
      <div class="price-row">
        <strong>${formatVnd(item.price)}</strong>
        <span>${item.status}</span>
      </div>
      <div class="store-actions">
        <button class="ghost view-detail" type="button" data-id="${item.id}">Xem chi tiết</button>
        <button class="cta add-to-cart" type="button" data-id="${item.id}">Thêm vào giỏ</button>
      </div>
    `;
    storeGrid.appendChild(card);
  });

  applyFilter();
};

const openProductModal = (item) => {
  selectedProduct = item;
  if (!item || !modalTitle || !modalDescription || !modalSpecs || !modalDetail || !modalPrice) {
    return;
  }

  modalTitle.textContent = item.name;
  modalDescription.textContent = item.description;
  modalSpecs.innerHTML = item.specs.map((spec) => `<span>${spec}</span>`).join('');
  modalDetail.textContent = item.detail;
  modalPrice.textContent = formatVnd(item.price);
  toggleModal(true);
};

const applyFilter = () => {
  const query = (searchInput?.value || '').toLowerCase();
  const cards = storeGrid ? storeGrid.querySelectorAll('.store-card') : [];
  cards.forEach((card) => {
    const category = card.dataset.category || '';
    const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    const matchesCategory = activeFilter === 'all' || activeFilter === category;
    const matchesSearch = name.includes(query);
    card.style.display = matchesCategory && matchesSearch ? 'grid' : 'none';
  });
};

const loadProducts = async () => {
  try {
    const response = await fetch('products.json');
    if (!response.ok) {
      throw new Error('fetch failed');
    }
    products = await response.json();
  } catch (error) {
    products = fallbackProducts;
  }
  renderStore(products);
};

if (storeGrid) {
  storeGrid.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const id = target.dataset.id;
    if (!id) {
      return;
    }

    const item = products.find((product) => product.id === id);
    if (!item) {
      return;
    }

    if (target.classList.contains('add-to-cart')) {
      addToCart(item);
    }

    if (target.classList.contains('view-detail')) {
      openProductModal(item);
    }
  });
}

if (modalAdd) {
  modalAdd.addEventListener('click', () => {
    if (selectedProduct) {
      addToCart(selectedProduct);
      toggleModal(false);
    }
  });
}

if (cartItems) {
  cartItems.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id || !cart.has(id)) {
      return;
    }

    const item = cart.get(id);
    if (!item) {
      return;
    }

    if (action === 'increase') {
      item.qty += 1;
    }

    if (action === 'decrease') {
      item.qty -= 1;
      if (item.qty <= 0) {
        cart.delete(id);
      }
    }

    renderCart();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter || 'all';
    applyFilter();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', applyFilter);
}

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = checkoutForm.querySelector('button.cta');
    if (button) {
      button.textContent = 'Đã gửi. EcoSynTech sẽ liên hệ trong 24h.';
      button.disabled = true;
    }
  });
}

if (exportQuote) {
  exportQuote.addEventListener('click', () => {
    window.print();
  });
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = contactForm.querySelector('button');
    if (button) {
      button.textContent = 'Đã gửi. EcoSynTech sẽ liên hệ sớm!';
      button.disabled = true;
    }
  });
}

renderCart();
loadProducts();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// IoT Dashboard System
const IoTSystem = {
  sensors: {},
  rules: [],
  alerts: [],
  updateInterval: null,

  init() {
    this.loadRules();
    this.startRealTimeUpdates();
    this.renderRules();
    this.initCharts();
    this.initEventListeners();
    this.checkSensorAlerts();
  },

  loadRules() {
    const savedRules = localStorage.getItem('ecosyn_rules');
    if (savedRules) {
      this.rules = JSON.parse(savedRules);
    } else {
      this.rules = [
        {
          id: 'rule-1',
          name: 'Tưới khi đất khô',
          description: 'Tự động tưới khi độ ẩm đất xuống dưới 35%',
          enabled: true,
          condition: { sensor: 'soil', operator: '<', value: 35 },
          action: { type: 'valve_open', target: 'zone1' },
          lastTriggered: '2026-04-08T06:15:00',
          triggerCount: 24
        },
        {
          id: 'rule-2',
          name: 'Bật quạt khi nóng',
          description: 'Kích hoạt quạt thông gió khi nhiệt độ trên 30°C',
          enabled: true,
          condition: { sensor: 'temperature', operator: '>', value: 30 },
          action: { type: 'fan_on', target: 'all' },
          lastTriggered: '2026-04-08T05:30:00',
          triggerCount: 8
        },
        {
          id: 'rule-3',
          name: 'Cảnh báo nước thấp',
          description: 'Thông báo khi mực nước bồn dưới 25%',
          enabled: true,
          condition: { sensor: 'water', operator: '<', value: 25 },
          action: { type: 'alert', target: 'all' },
          lastTriggered: '2026-04-08T03:45:00',
          triggerCount: 5
        },
        {
          id: 'rule-4',
          name: 'Tắt đèn đêm',
          description: 'Tự động tắt đèn grow lúc 22:00',
          enabled: false,
          condition: { sensor: 'time', operator: '==', value: '22:00' },
          action: { type: 'light_off', target: 'zone1' },
          lastTriggered: '2026-04-07T22:00:00',
          triggerCount: 30
        }
      ];
      this.saveRules();
    }
  },

  saveRules() {
    localStorage.setItem('ecosyn_rules', JSON.stringify(this.rules));
  },

  generateSensorHistory(type, currentValue) {
    const history = [];
    const variance = type === 'ph' ? 0.3 : (type === 'ec' ? 0.2 : 5);
    for (let i = 0; i < 12; i++) {
      const offset = (Math.random() - 0.5) * variance;
      history.push(Math.max(0, currentValue + offset));
    }
    history.push(currentValue);
    return history;
  },

  initCharts() {
    document.querySelectorAll('.sensor-chart').forEach(chart => {
      const sensorType = chart.closest('.sensor-card')?.dataset.sensor;
      if (sensorType) {
        const sensorCard = chart.closest('.sensor-card');
        const valueEl = sensorCard.querySelector('.sensor-value');
        const value = parseFloat(valueEl?.textContent) || 50;
        const history = this.generateSensorHistory(sensorType, value);
        
        chart.innerHTML = history.map(h => {
          const height = Math.min(Math.max((h / (value * 1.5)) * 100, 10), 100);
          return `<span style="height: ${height}%"></span>`;
        }).join('');
      }
    });
  },

  initEventListeners() {
    const addRuleBtn = document.getElementById('addRuleBtn');
    const ruleModal = document.getElementById('ruleModal');
    const closeRuleModal = document.getElementById('closeRuleModal');
    const cancelRule = document.getElementById('cancelRule');
    const ruleForm = document.getElementById('ruleForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const timeCheckbox = document.querySelector('input[name="useTimeCondition"]');
    const timeConditions = document.getElementById('timeConditions');
    const closeAlerts = document.getElementById('closeAlerts');
    const refreshDashboard = document.getElementById('refreshDashboard');
    const deviceConfigModal = document.getElementById('deviceConfigModal');
    const closeDeviceConfig = document.getElementById('closeDeviceConfig');
    const cancelDeviceConfig = document.getElementById('cancelDeviceConfig');
    const deviceConfigForm = document.getElementById('deviceConfigForm');
    const devicesList = document.querySelector('.devices-list');

    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => this.openRuleModal());
    }

    if (closeRuleModal) {
      closeRuleModal.addEventListener('click', () => this.closeRuleModal());
    }

    if (cancelRule) {
      cancelRule.addEventListener('click', () => this.closeRuleModal());
    }

    if (ruleModal) {
      ruleModal.addEventListener('click', (e) => {
        if (e.target === ruleModal) this.closeRuleModal();
      });
    }

    if (ruleForm) {
      ruleForm.addEventListener('submit', (e) => this.handleRuleSubmit(e));
    }

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    if (timeCheckbox) {
      timeCheckbox.addEventListener('change', () => {
        timeConditions.style.display = timeCheckbox.checked ? 'flex' : 'none';
      });
    }

    if (closeAlerts) {
      closeAlerts.addEventListener('click', () => {
        document.getElementById('alertPanel').classList.remove('open');
      });
    }

    if (refreshDashboard) {
      refreshDashboard.addEventListener('click', () => this.refreshData());
    }

    if (closeDeviceConfig) {
      closeDeviceConfig.addEventListener('click', () => this.closeDeviceConfigModal());
    }

    if (cancelDeviceConfig) {
      cancelDeviceConfig.addEventListener('click', () => this.closeDeviceConfigModal());
    }

    if (deviceConfigModal) {
      deviceConfigModal.addEventListener('click', (e) => {
        if (e.target === deviceConfigModal) this.closeDeviceConfigModal();
      });
    }

    if (deviceConfigForm) {
      deviceConfigForm.addEventListener('submit', (e) => this.handleDeviceConfigSubmit(e));
    }

    if (devicesList) {
      devicesList.addEventListener('click', (e) => this.handleDeviceAction(e));
    }

    const alertMarkAll = document.querySelector('.alert-mark-all');
    if (alertMarkAll) {
      alertMarkAll.addEventListener('click', () => {
        const alertList = document.querySelector('.alert-list');
        if (alertList) alertList.innerHTML = '';
        document.querySelector('.alert-count').textContent = '0';
      });
    }
  },

  handleDeviceAction(e) {
    const target = e.target;
    const deviceItem = target.closest('.device-item');
    if (!deviceItem) return;

    const deviceName = deviceItem.querySelector('h4')?.textContent || '';
    const deviceId = deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (target.title === 'Cấu hình') {
      this.openDeviceConfigModal(deviceId, deviceName);
    } else if (target.title === 'Bật/Tắt') {
      const stateEl = deviceItem.querySelector('.device-state');
      if (stateEl) {
        const isRunning = stateEl.classList.contains('running');
        stateEl.textContent = isRunning ? 'ĐANG CHỜ' : 'ĐANG CHẠY';
        stateEl.classList.toggle('running', !isRunning);
        stateEl.classList.toggle('idle', isRunning);
        
        const command = isRunning ? 'stop' : 'start';
        MQTTService.sendCommand(deviceId, command);
        this.addHistoryEntry(
          isRunning ? `Tắt ${deviceName}` : `Bật ${deviceName}`,
          'Thao tác thủ công',
          'success'
        );
      }
    } else if (target.title === 'Lịch sử') {
      this.switchTab('history');
    }
  },

  openDeviceConfigModal(deviceId, deviceName) {
    const modal = document.getElementById('deviceConfigModal');
    const form = document.getElementById('deviceConfigForm');
    
    const savedConfig = JSON.parse(localStorage.getItem(`device_config_${deviceId}`) || '{}');
    
    form.elements.deviceName.value = savedConfig.name || deviceName;
    form.elements.deviceType.value = savedConfig.type || 'sensor';
    form.elements.deviceZone.value = savedConfig.zone || 'zone1';
    form.elements.thresholdLow.value = savedConfig.thresholdLow || '';
    form.elements.thresholdCritical.value = savedConfig.thresholdCritical || '';
    form.elements.reportInterval.value = savedConfig.reportInterval || 300;
    form.elements.deviceEnabled.checked = savedConfig.enabled !== false;
    form.dataset.deviceId = deviceId;
    
    modal.classList.add('open');
  },

  closeDeviceConfigModal() {
    document.getElementById('deviceConfigModal').classList.remove('open');
  },

  handleDeviceConfigSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const deviceId = form.dataset.deviceId;
    
    const config = {
      name: form.elements.deviceName.value,
      type: form.elements.deviceType.value,
      zone: form.elements.deviceZone.value,
      thresholdLow: parseFloat(form.elements.thresholdLow.value) || null,
      thresholdCritical: parseFloat(form.elements.thresholdCritical.value) || null,
      reportInterval: parseInt(form.elements.reportInterval.value) || 300,
      enabled: form.elements.deviceEnabled.checked,
      lastModified: new Date().toISOString()
    };
    
    localStorage.setItem(`device_config_${deviceId}`, JSON.stringify(config));
    
    MQTTService.sendCommand(deviceId, 'configure', config);
    
    this.closeDeviceConfigModal();
    this.addHistoryEntry(`Cấu hình ${config.name}`, 'Lưu cấu hình thiết bị', 'success');
  },

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
  },

  renderRules() {
    const rulesList = document.getElementById('rulesList');
    if (!rulesList) return;

    rulesList.innerHTML = this.rules.map(rule => {
      const conditionText = this.getConditionText(rule.condition);
      const actionText = this.getActionText(rule.action);
      const lastRun = rule.lastTriggered ? this.formatTime(rule.lastTriggered) : 'Chưa chạy';

      return `
        <div class="rule-card" data-rule-id="${rule.id}">
          <div class="rule-card-header">
            <div>
              <span class="rule-name">${rule.name}</span>
              <p style="font-size: 0.85rem; color: #6b7c74; margin-top: 4px;">${rule.description}</p>
            </div>
            <label class="rule-toggle">
              <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle-rule" data-id="${rule.id}">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="rule-conditions">
            <span class="condition-tag">IF ${conditionText}</span>
            <span class="logic-and">THEN</span>
            <span class="action-tag">${actionText}</span>
          </div>
          <div class="rule-footer">
            <span class="rule-meta">
              Lần cuối: ${lastRun} · Đã kích hoạt: ${rule.triggerCount} lần
            </span>
            <div class="rule-actions">
              <button data-action="edit-rule" data-id="${rule.id}">Sửa</button>
              <button data-action="delete-rule" data-id="${rule.id}">Xóa</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    rulesList.addEventListener('click', (e) => {
      const target = e.target;
      const action = target.dataset.action;
      const ruleId = target.dataset.id;

      if (action === 'toggle-rule') {
        this.toggleRule(ruleId, target.checked);
      } else if (action === 'edit-rule') {
        this.editRule(ruleId);
      } else if (action === 'delete-rule') {
        this.deleteRule(ruleId);
      }
    });
  },

  getConditionText(condition) {
    const sensorNames = {
      soil: 'Độ ẩm đất',
      temperature: 'Nhiệt độ',
      humidity: 'Độ ẩm KK',
      light: 'Ánh sáng',
      ph: 'pH',
      water: 'Mực nước',
      time: 'Thời gian'
    };
    const opSymbols = { '<': '<', '>': '>', '<=': '≤', '>=': '≥', '==': '=' };
    const sensor = sensorNames[condition.sensor] || condition.sensor;
    const op = opSymbols[condition.operator] || condition.operator;
    return `${sensor} ${op} ${condition.value}`;
  },

  getActionText(action) {
    const actionNames = {
      valve_open: 'Mở van tưới',
      valve_close: 'Đóng van tưới',
      pump_start: 'Bật bơm',
      pump_stop: 'Tắt bơm',
      fan_on: 'Bật quạt',
      fan_off: 'Tắt quạt',
      light_on: 'Bật đèn',
      light_off: 'Tắt đèn',
      alert: 'Gửi cảnh báo'
    };
    const targetNames = {
      zone1: 'Zone 1', zone2: 'Zone 2', zone3: 'Zone 3',
      zone4: 'Zone 4', zone5: 'Zone 5', all: 'Tất cả'
    };
    return `${actionNames[action.type] || action.type} (${targetNames[action.target] || action.target})`;
  },

  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000 / 60;
    
    if (diff < 1) return 'vừa xong';
    if (diff < 60) return `${Math.floor(diff)} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  },

  toggleRule(ruleId, enabled) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.saveRules();
    }
  },

  editRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      this.openRuleModal(rule);
    }
  },

  deleteRule(ruleId) {
    if (confirm('Bạn có chắc muốn xóa rule này?')) {
      this.rules = this.rules.filter(r => r.id !== ruleId);
      this.saveRules();
      this.renderRules();
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

  handleRuleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editingId = form.dataset.editingId;

    const ruleData = {
      id: editingId || `rule-${Date.now()}`,
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
      },
      lastTriggered: editingId ? this.rules.find(r => r.id === editingId)?.lastTriggered : null,
      triggerCount: editingId ? this.rules.find(r => r.id === editingId)?.triggerCount || 0 : 0
    };

    if (editingId) {
      const index = this.rules.findIndex(r => r.id === editingId);
      if (index !== -1) {
        this.rules[index] = ruleData;
      }
    } else {
      this.rules.push(ruleData);
    }

    this.saveRules();
    this.renderRules();
    this.closeRuleModal();
  },

  checkSensorAlerts() {
    const sensorCards = document.querySelectorAll('.sensor-card');
    const thresholds = {
      soil: { min: 30, max: 70, warning: 35, critical: 25 },
      temperature: { min: 18, max: 32, warning: 30, critical: 35 },
      humidity: { min: 60, max: 85, warning: 80, critical: 90 },
      water: { min: 20, max: 100, warning: 25, critical: 15 }
    };

    sensorCards.forEach(card => {
      const sensorType = card.dataset.sensor;
      const valueEl = card.querySelector('.sensor-value');
      const value = parseFloat(valueEl?.textContent) || 0;
      
      card.classList.remove('alert-warning', 'alert-danger');
      
      if (thresholds[sensorType]) {
        const t = thresholds[sensorType];
        if (value < t.critical || (sensorType === 'temperature' && value > t.critical)) {
          card.classList.add('alert-danger');
        } else if (value < t.warning || (sensorType === 'temperature' && value > t.warning)) {
          card.classList.add('alert-warning');
        }
      }
    });
  },

  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateSensorValues();
      this.updateLastUpdate();
    }, 5000);
  },

  updateSensorValues() {
    const sensors = ['temperature', 'humidity', 'soil', 'light', 'ph', 'co2', 'ec', 'water'];
    const baseValues = {
      temperature: 28.5,
      humidity: 72,
      soil: 45,
      light: 42.5,
      ph: 6.8,
      co2: 418,
      ec: 2.1,
      water: 78
    };

    sensors.forEach(sensor => {
      const card = document.querySelector(`.sensor-card[data-sensor="${sensor}"]`);
      if (card) {
        const valueEl = card.querySelector('.sensor-value');
        const currentValue = baseValues[sensor];
        const variance = sensor === 'ph' ? 0.2 : (sensor === 'ec' ? 0.15 : 2);
        const newValue = currentValue + (Math.random() - 0.5) * variance;
        baseValues[sensor] = newValue;
        
        if (valueEl) {
          const formatted = sensor === 'ph' ? newValue.toFixed(1) : newValue.toFixed(1);
          valueEl.innerHTML = `${formatted}<span>${valueEl.querySelector('span')?.textContent || ''}</span>`;
        }

        const chart = card.querySelector('.sensor-chart');
        if (chart) {
          const bars = chart.querySelectorAll('span');
          if (bars.length > 0) {
            bars.forEach((bar, i) => {
              if (i < bars.length - 1) {
                bars[i].style.height = bars[i + 1].style.height;
              }
            });
            const lastBar = bars[bars.length - 1];
            const height = Math.min(Math.max((newValue / (currentValue * 1.3)) * 100, 15), 95);
            lastBar.style.height = `${height}%`;
          }
        }

        if (sensor === 'water') {
          const waterFill = card.querySelector('.water-fill');
          if (waterFill) {
            waterFill.style.height = `${Math.max(5, Math.min(95, baseValues.water))}%`;
          }
        }
      }
    });

    this.checkSensorAlerts();
  },

  updateLastUpdate() {
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = 'vừa xong';
      setTimeout(() => {
        lastUpdateEl.textContent = '5 giây trước';
      }, 5000);
    }
  },

  refreshData() {
    const btn = document.getElementById('refreshDashboard');
    if (btn) {
      btn.innerHTML = '<span>⏳</span> Đang tải...';
      btn.disabled = true;
    }

    setTimeout(() => {
      this.initCharts();
      this.checkSensorAlerts();
      if (btn) {
        btn.innerHTML = '<span>✓</span> Đã cập nhật';
        setTimeout(() => {
          btn.innerHTML = '<span>🔄</span> Làm mới dữ liệu';
          btn.disabled = false;
        }, 1500);
      }
    }, 1000);
  },

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },

  addHistoryEntry(action, trigger, status = 'success') {
    const history = JSON.parse(localStorage.getItem('ecosyn_history') || '[]');
    history.unshift({
      id: `history-${Date.now()}`,
      time: new Date().toISOString(),
      action,
      trigger,
      status
    });
    localStorage.setItem('ecosyn_history', JSON.stringify(history.slice(0, 50)));
    this.renderHistory();
  },

  renderHistory() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    const history = JSON.parse(localStorage.getItem('ecosyn_history') || '[]');
    
    if (history.length === 0) {
      historyList.innerHTML = '<p style="text-align:center;color:#6b7c74;padding:20px;">Chưa có lịch sử hoạt động</p>';
      return;
    }

    historyList.innerHTML = history.map(item => {
      const date = new Date(item.time);
      const timeStr = date.toLocaleDateString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const statusClass = item.status === 'success' ? 'success' : (item.status === 'warning' ? 'warning' : 'error');
      
      return `
        <div class="history-item" data-id="${item.id}">
          <span class="history-time">${timeStr}</span>
          <span class="history-action">${item.action}</span>
          <span class="history-trigger">${item.trigger}</span>
          <span class="history-status ${statusClass}">${item.status === 'success' ? 'Thành công' : (item.status === 'warning' ? 'Cảnh báo' : 'Lỗi')}</span>
          <button class="ghost delete-history" data-id="${item.id}" title="Xóa">×</button>
        </div>
      `;
    }).join('');

    historyList.querySelectorAll('.delete-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const updatedHistory = history.filter(h => h.id !== id);
        localStorage.setItem('ecosyn_history', JSON.stringify(updatedHistory));
        this.renderHistory();
      });
    });
  },

  loadSchedules() {
    const saved = localStorage.getItem('ecosyn_schedules');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: 'sched-1',
        name: 'Lịch tưới sáng',
        time: '06:00',
        duration: 60,
        zones: ['zone1', 'zone2', 'zone3'],
        enabled: true,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      {
        id: 'sched-2',
        name: 'Lịch tưới chiều',
        time: '17:00',
        duration: 60,
        zones: ['zone4', 'zone5'],
        enabled: true,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      {
        id: 'sched-3',
        name: 'Bón phân định kỳ',
        time: '08:00',
        duration: 45,
        zones: ['all'],
        enabled: false,
        days: ['Tue', 'Fri']
      }
    ];
  },

  saveSchedules(schedules) {
    localStorage.setItem('ecosyn_schedules', JSON.stringify(schedules));
  },

  renderSchedules() {
    const scheduleGrid = document.querySelector('.schedule-grid');
    if (!scheduleGrid) return;

    const schedules = this.loadSchedules();
    const zoneNames = {
      zone1: 'Zone 1', zone2: 'Zone 2', zone3: 'Zone 3',
      zone4: 'Zone 4', zone5: 'Zone 5', all: 'Tất cả zones'
    };

    scheduleGrid.innerHTML = schedules.map(sched => `
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
          ${sched.zones.map(z => `<span>${zoneNames[z] || z}</span>`).join('')}
        </div>
        <div class="schedule-days">
          ${sched.days.map(d => `<span class="day-tag">${d}</span>`).join('')}
        </div>
        <div class="schedule-actions">
          <button class="ghost" data-action="edit-schedule" data-id="${sched.id}">Sửa</button>
          <button class="ghost" data-action="delete-schedule" data-id="${sched.id}">Xóa</button>
        </div>
      </div>
    `).join('');

    scheduleGrid.addEventListener('click', (e) => {
      const target = e.target;
      const action = target.dataset.action;
      const id = target.dataset.id;

      if (action === 'toggle-schedule') {
        const schedules = this.loadSchedules();
        const sched = schedules.find(s => s.id === id);
        if (sched) {
          sched.enabled = target.checked;
          this.saveSchedules(schedules);
          this.renderSchedules();
        }
      } else if (action === 'edit-schedule') {
        this.openScheduleModal(id);
      } else if (action === 'delete-schedule') {
        if (confirm('Xóa lịch này?')) {
          const schedules = this.loadSchedules().filter(s => s.id !== id);
          this.saveSchedules(schedules);
          this.renderSchedules();
        }
      }
    });
  },

  openScheduleModal(scheduleId = null) {
    const modal = document.createElement('div');
    modal.className = 'rule-modal open';
    modal.id = 'scheduleModal';
    
    const schedule = scheduleId ? this.loadSchedules().find(s => s.id === scheduleId) : null;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };

    modal.innerHTML = `
      <div class="rule-modal-content">
        <div class="rule-modal-header">
          <h3>${schedule ? 'Sửa lịch' : 'Tạo lịch mới'}</h3>
          <button class="ghost" id="closeScheduleModal">×</button>
        </div>
        <form id="scheduleForm" data-editing-id="${scheduleId || ''}">
          <div class="form-group">
            <label>Tên lịch</label>
            <input type="text" name="scheduleName" value="${schedule?.name || ''}" required />
          </div>
          <div class="form-group">
            <label>Thời gian bắt đầu</label>
            <input type="time" name="scheduleTime" value="${schedule?.time || '06:00'}" required />
          </div>
          <div class="form-group">
            <label>Thời lượng (phút)</label>
            <input type="number" name="scheduleDuration" value="${schedule?.duration || 60}" min="5" max="240" required />
          </div>
          <div class="form-group">
            <label>Zones</label>
            <div class="zone-checkboxes">
              <label><input type="checkbox" name="zones" value="zone1" ${schedule?.zones.includes('zone1') ? 'checked' : ''}> Zone 1</label>
              <label><input type="checkbox" name="zones" value="zone2" ${schedule?.zones.includes('zone2') ? 'checked' : ''}> Zone 2</label>
              <label><input type="checkbox" name="zones" value="zone3" ${schedule?.zones.includes('zone3') ? 'checked' : ''}> Zone 3</label>
              <label><input type="checkbox" name="zones" value="zone4" ${schedule?.zones.includes('zone4') ? 'checked' : ''}> Zone 4</label>
              <label><input type="checkbox" name="zones" value="zone5" ${schedule?.zones.includes('zone5') ? 'checked' : ''}> Zone 5</label>
            </div>
          </div>
          <div class="form-group">
            <label>Ngày trong tuần</label>
            <div class="zone-checkboxes">
              ${days.map(d => `
                <label><input type="checkbox" name="days" value="${d}" ${schedule?.days.includes(d) ? 'checked' : ''}> ${dayNames[d]}</label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="scheduleEnabled" ${schedule?.enabled !== false ? 'checked' : ''} />
              Kích hoạt lịch
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="ghost" id="cancelSchedule">Hủy</button>
            <button type="submit" class="cta">Lưu lịch</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#closeScheduleModal').addEventListener('click', () => modal.remove());
    modal.querySelector('#cancelSchedule').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#scheduleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const editingId = form.dataset.editingId;
      
      const zones = Array.from(form.querySelectorAll('input[name="zones"]:checked')).map(i => i.value);
      const days = Array.from(form.querySelectorAll('input[name="days"]:checked')).map(i => i.value);

      const scheduleData = {
        id: editingId || `sched-${Date.now()}`,
        name: form.scheduleName.value,
        time: form.scheduleTime.value,
        duration: parseInt(form.scheduleDuration.value),
        zones: zones.length > 0 ? zones : ['all'],
        days: days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        enabled: form.scheduleEnabled.checked
      };

      const schedules = this.loadSchedules();
      if (editingId) {
        const index = schedules.findIndex(s => s.id === editingId);
        if (index !== -1) schedules[index] = scheduleData;
      } else {
        schedules.push(scheduleData);
      }

      this.saveSchedules(schedules);
      this.renderSchedules();
      modal.remove();
    });
  }
};

const API_BASE = 'http://localhost:3000/api';

const APIService = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[API] ${endpoint} failed:`, error);
      return null;
    }
  },

  async getSensors() {
    return this.request('/sensors');
  },

  async getDevices() {
    return this.request('/devices');
  },

  async getRules() {
    return this.request('/rules');
  },

  async getSchedules() {
    return this.request('/schedules');
  },

  async getHistory() {
    return this.request('/history');
  },

  async getAlerts() {
    return this.request('/alerts');
  },

  async getStats() {
    return this.request('/stats');
  },

  async sendCommand(deviceId, command) {
    return this.request(`/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify({ command })
    });
  },

  async createRule(rule) {
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  },

  async updateRule(id, rule) {
    return this.request(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule)
    });
  },

  async deleteRule(id) {
    return this.request(`/rules/${id}`, { method: 'DELETE' });
  },

  async createSchedule(schedule) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
  },

  async updateSchedule(id, schedule) {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule)
    });
  },

  async deleteSchedule(id) {
    return this.request(`/schedules/${id}`, { method: 'DELETE' });
  },

  async exportData() {
    return this.request('/export', { method: 'POST' });
  }
};

const MQTTService = {
  client: null,
  connected: false,
  brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
  topics: {
    sensors: 'ecosyn/sensors/#',
    commands: 'ecosyn/commands/#',
    alerts: 'ecosyn/alerts/#'
  },
  apiBase: API_BASE,

  async connect() {
    try {
      console.log('[MQTT] Connecting to broker...');
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: `ecosyn_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Connected successfully');
        this.connected = true;
        this.subscribeTopics();
        this.updateConnectionStatus(true);
        this.fetchInitialData();
      });

      this.client.on('message', (topic, message) => this.handleMessage(topic, message));

      this.client.on('error', (err) => {
        console.error('[MQTT] Error:', err);
        this.connected = false;
        this.updateConnectionStatus(false);
      });

      this.client.on('offline', () => {
        console.log('[MQTT] Offline');
        this.connected = false;
        this.updateConnectionStatus(false);
      });

    } catch (error) {
      console.error('[MQTT] Connection failed:', error);
      this.tryAPIMode();
    }
  },

  async fetchInitialData() {
    console.log('[API] Fetching initial data from backend...');
    const sensors = await APIService.getSensors();
    if (sensors) {
      Object.entries(sensors).forEach(([type, data]) => {
        IoTSystem.handleSensorData({ sensor: type, value: data.value });
      });
    }
  },

  tryAPIMode() {
    console.log('[API] Falling back to REST API mode');
    this.startPolling();
  },

  startPolling() {
    setInterval(async () => {
      const sensors = await APIService.getSensors();
      if (sensors) {
        Object.entries(sensors).forEach(([type, data]) => {
          IoTSystem.handleSensorData({ sensor: type, value: data.value });
        });
      }
    }, 5000);
  },

  subscribeTopics() {
    if (!this.client || !this.connected) return;
    
    Object.values(this.topics).forEach(topic => {
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (!err) {
          console.log(`[MQTT] Subscribed to ${topic}`);
        }
      });
    });
  },

  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[MQTT] Message on ${topic}:`, data);

      if (topic.includes('sensors')) {
        IoTSystem.handleSensorData(data);
      } else if (topic.includes('alerts')) {
        IoTSystem.handleAlert(data);
      } else if (topic.includes('commands')) {
        IoTSystem.handleCommand(data);
      }
    } catch (error) {
      console.error('[MQTT] Failed to parse message:', error);
    }
  },

  publish(topic, message) {
    if (!this.client || !this.connected) {
      console.warn('[MQTT] Not connected, cannot publish');
      return false;
    }
    
    this.client.publish(topic, JSON.stringify(message), { qos: 0 });
    return true;
  },

  sendCommand(deviceId, command, params = {}) {
    const topic = `ecosyn/commands/${deviceId}`;
    return this.publish(topic, { command, params, timestamp: Date.now() });
  },

  updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.iot-status .status-indicator');
    if (statusIndicator) {
      statusIndicator.classList.toggle('online', connected);
      statusIndicator.classList.toggle('offline', !connected);
    }
  },

  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
    }
  }
};

const WebhookService = {
  endpoints: {
    onSensorAlert: 'https://api.ecosyntech.vn/webhooks/sensor-alert',
    onDeviceStatus: 'https://api.ecosyntech.vn/webhooks/device-status',
    onRuleTriggered: 'https://api.ecosyntech.vn/webhooks/rule-triggered',
    onScheduleRun: 'https://api.ecosyntech.vn/webhooks/schedule-run'
  },

  async send(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EcoSynTech-Signature': this.generateSignature(data)
        },
        body: JSON.stringify({
          ...data,
          webhookId: `wh_${Date.now()}`,
          timestamp: new Date().toISOString()
        })
      });
      return response.ok;
    } catch (error) {
      console.error('[Webhook] Failed to send:', error);
      return false;
    }
  },

  generateSignature(data) {
    const payload = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256=${Math.abs(hash).toString(16)}`;
  },

  async onSensorAlert(sensor, value, severity) {
    return this.send(this.endpoints.onSensorAlert, { sensor, value, severity });
  },

  async onDeviceStatusChange(deviceId, status) {
    return this.send(this.endpoints.onDeviceStatus, { deviceId, status });
  },

  async onRuleTriggered(rule, action) {
    return this.send(this.endpoints.onRuleTriggered, { rule, action });
  },

  async onScheduleRun(schedule) {
    return this.send(this.endpoints.onScheduleRun, { schedule });
  }
};

const PushNotificationService = {
  permission: 'default',

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        console.log('[Push] Requesting permission...');
      }
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return false;
    }
  },

  show(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('[Push] Permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'ecosyn-notification',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  },

  notifySensorAlert(sensor, value, severity) {
    const titles = {
      warning: 'Cảnh báo từ cảm biến',
      danger: 'Nguy hiểm! Cảnh báo khẩn'
    };
    const bodies = {
      temperature: `${value}°C - Nhiệt độ ${severity === 'danger' ? 'quá cao' : 'cao'}`,
      soil: `${value}% - Độ ẩm đất ${severity === 'danger' ? 'quá thấp' : 'thấp'}`,
      water: `${value}% - Mực nước ${severity === 'danger' ? 'nguy hiểm' : 'thấp'}`,
      humidity: `${value}% - Độ ẩm không khí cao`
    };

    this.show(titles[severity], {
      body: bodies[sensor] || `Giá trị: ${value}`,
      tag: `sensor-${sensor}`
    });
  },

  notifyRuleTriggered(ruleName) {
    this.show('Rule đã kích hoạt', {
      body: `Rule "${ruleName}" đã được kích hoạt`,
      tag: 'rule-triggered'
    });
  },

  notifyScheduleComplete(scheduleName) {
    this.show('Lịch hoàn thành', {
      body: `Lịch "${scheduleName}" đã chạy xong`,
      tag: 'schedule-complete'
    });
  }
};

IoTSystem.handleSensorData = function(data) {
  const sensor = data.sensor || data.type;
  const card = document.querySelector(`.sensor-card[data-sensor="${sensor}"]`);
  if (card) {
    const valueEl = card.querySelector('.sensor-value');
    if (valueEl && data.value !== undefined) {
      valueEl.innerHTML = `${data.value}<span>${valueEl.querySelector('span')?.textContent || ''}</span>`;
    }
  }
  this.checkSensorAlerts();
};

IoTSystem.handleAlert = function(data) {
  const alerts = JSON.parse(localStorage.getItem('ecosyn_alerts') || '[]');
  alerts.unshift({
    id: `alert-${Date.now()}`,
    ...data,
    time: new Date().toISOString()
  });
  localStorage.setItem('ecosyn_alerts', JSON.stringify(alerts.slice(0, 20)));
  
  if (data.severity === 'danger' || data.severity === 'warning') {
    PushNotificationService.notifySensorAlert(data.sensor, data.value, data.severity);
  }
  
  WebhookService.onSensorAlert(data.sensor, data.value, data.severity);
};

IoTSystem.handleCommand = function(data) {
  console.log('[Command] Received:', data);
  if (data.command === 'refresh') {
    this.refreshData();
  }
};

function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    sensors: {},
    rules: IoTSystem.rules,
    schedules: JSON.parse(localStorage.getItem('ecosyn_schedules') || '[]'),
    history: JSON.parse(localStorage.getItem('ecosyn_history') || '[]')
  };

  document.querySelectorAll('.sensor-card').forEach(card => {
    const sensor = card.dataset.sensor;
    const valueEl = card.querySelector('.sensor-value');
    data.sensors[sensor] = {
      value: valueEl?.textContent?.replace(/[^\d.]/g, '') || 'N/A',
      timestamp: new Date().toISOString()
    };
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecosyn-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function fullscreenDashboard() {
  const dashboard = document.getElementById('iot-dashboard');
  if (!dashboard) return;

  if (!document.fullscreenElement) {
    dashboard.requestFullscreen?.() || dashboard.webkitRequestFullscreen?.() || dashboard.mozRequestFullScreen?.();
  } else {
    document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.();
  }
}

IoTSystem.initSchedulesTab = function() {
  const addScheduleBtn = document.getElementById('addScheduleBtn');
  if (addScheduleBtn) {
    addScheduleBtn.addEventListener('click', () => this.openScheduleModal());
  }
  
  this.renderSchedules();
  this.renderHistory();
};

document.addEventListener('DOMContentLoaded', () => {
  IoTSystem.init();
  IoTSystem.initSchedulesTab();

  const exportBtn = document.getElementById('exportData');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  const fullscreenBtn = document.getElementById('fullscreenDashboard');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', fullscreenDashboard);
  }

  PushNotificationService.init();

  if (typeof mqtt !== 'undefined') {
    MQTTService.connect();
  } else {
    console.log('[MQTT] Library not loaded, running in simulation mode');
  }
});
