// EcoSynTech Dashboard - Core JavaScript
// Handles data loading, animations, and interactivity

class DashboardApp {
  constructor() {
    this.apiBase = '';
    this.cache = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAnimations();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Setup sidebar toggle for mobile
    document.addEventListener('DOMContentLoaded', () => {
      this.initSidebar();
    });
  }

  initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Add responsive behavior
    if (window.innerWidth <= 1024) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'sidebar-toggle';
      toggleBtn.innerHTML = '☰';
      toggleBtn.style.cssText = `
        position: fixed;
        top: 15px;
        left: 15px;
        z-index: 1001;
        background: var(--primary);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        display: block;
      `;
      toggleBtn.onclick = () => {
        sidebar.classList.toggle('open');
      };
      document.body.appendChild(toggleBtn);
    }
  }

  setupAnimations() {
    // Add staggered animations to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });

    // Add number counting animation to stat values
    this.setupCounters();
  }

  setupCounters() {
    const counters = document.querySelectorAll('.stat-card .value[data-count]');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count);
      const duration = 1500;
      const step = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += step;
        if (current < target) {
          counter.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toLocaleString();
        }
      };

      // Start animation when element is in view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      });

      observer.observe(counter);
    });
  }

  async loadInitialData() {
    // Preload common data
    await Promise.all([
      this.loadStats(),
      this.loadActivities()
    ]);
  }

  async fetchData(endpoint, useCache = true) {
    if (useCache && this.cache.has(endpoint)) {
      return this.cache.get(endpoint);
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      if (useCache) {
        this.cache.set(endpoint, data);
      }
      
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  async loadStats() {
    const stats = await this.fetchData('/api/dashboard/stats');
    if (stats) {
      this.updateStats(stats);
    }
  }

  updateStats(data) {
    // Update revenue
    const revenueEl = document.getElementById('revenue');
    if (revenueEl) revenueEl.textContent = data.revenue || '--';

    // Update orders
    const ordersEl = document.getElementById('orders');
    if (ordersEl) ordersEl.textContent = data.orders || '--';

    // Update customers
    const customersEl = document.getElementById('customers');
    if (customersEl) customersEl.textContent = data.customers || '--';

    // Update products
    const productsEl = document.getElementById('products');
    if (productsEl) productsEl.textContent = data.products || '--';
  }

  async loadActivities() {
    const activities = await this.fetchData('/api/activities');
    if (activities) {
      this.renderActivities(activities);
    }
  }

  renderActivities(activities) {
    const container = document.getElementById('activity-log');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
      <tr class="fade-in">
        <td>${activity.time}</td>
        <td>${activity.action}</td>
        <td>${activity.user}</td>
        <td>
          <span class="badge badge-${activity.status === 'success' ? 'success' : activity.status === 'processing' ? 'warning' : 'danger'}">
            ${activity.status === 'success' ? '✓ Thành công' : activity.status === 'processing' ? '⏳ Đang xử lý' : '✗ Thất bại'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Utility methods
  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  // Device status helpers
  getDeviceStatus(status) {
    const statuses = {
      active: { class: 'success', text: '🟢 Hoạt động' },
      offline: { class: 'danger', text: '🔴 Offline' },
      maintenance: { class: 'warning', text: '🟡 Bảo trì' },
      paused: { class: 'warning', text: '⏸ Tạm dừng' }
    };
    return statuses[status] || statuses.active;
  }

  // Progress color based on value
  getProgressColor(value, thresholds = { warning: 30, danger: 15 }) {
    if (value <= thresholds.danger) return 'red';
    if (value <= thresholds.warning) return 'yellow';
    return 'green';
  }

  // Export functions
  exportToCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(elementId, filename) {
    // Simple print to PDF
    window.print();
  }
}

// Initialize app
const app = new DashboardApp();

// Export for use in other scripts
window.DashboardApp = app;
window.app = app;