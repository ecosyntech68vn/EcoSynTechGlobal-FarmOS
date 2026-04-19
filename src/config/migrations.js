const { runQuery, getAll } = require('./database');
const logger = require('./logger');

async function runMigrations() {
  try {
    runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        badge TEXT,
        status TEXT DEFAULT 'Còn hàng',
        description TEXT,
        specs TEXT DEFAULT '[]',
        detail TEXT,
        images TEXT DEFAULT '[]',
        features TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        subtotal REAL NOT NULL,
        shipping_fee REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'pending',
        shipping_address TEXT,
        notes TEXT,
        payment_method TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT,
        price REAL NOT NULL,
        quantity INTEGER DEFAULT 1,
        total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT DEFAULT 'sepay',
        bank_code TEXT,
        status TEXT DEFAULT 'pending',
        transaction_id TEXT,
        sepay_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS sales_leads (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        source TEXT DEFAULT 'website',
        industry TEXT DEFAULT 'vegetable',
        farm_size REAL DEFAULT 0,
        address TEXT,
        interest TEXT,
        notes TEXT,
        score INTEGER DEFAULT 50,
        status TEXT DEFAULT 'new',
        assigned_to TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS sales_deals (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        probability INTEGER DEFAULT 10,
        stage TEXT DEFAULT 'discovery',
        products TEXT DEFAULT '[]',
        discount INTEGER DEFAULT 0,
        expected_close TEXT,
        status TEXT DEFAULT 'open',
        closed_at TEXT,
        owner_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES sales_leads(id)
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS sales_activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        duration INTEGER DEFAULT 0,
        lead_id TEXT,
        deal_id TEXT,
        user_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS sales_quotas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target REAL NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    runQuery(`
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        url TEXT NOT NULL,
        alt TEXT,
        is_primary INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    seedProducts();
    seedCategories();

    logger.info('[Migrations] Database tables created successfully');
  } catch (err) {
    logger.error('[Migrations] Error:', err);
  }
}

function seedProducts() {
  const existingCount = getAll('SELECT COUNT(*) as count FROM products')[0]?.count || 0;

  if (existingCount === 0) {
    try {
    const products = [
      { id: 'prod-001', name: 'EcoSyn SoilSense', price: 6800000, category: 'sensor', badge: 'Bán chạy', status: 'Còn hàng', description: 'Cảm biến đất 4 trong 1: độ ẩm, pH, EC, nhiệt độ.', specs: ['LoRaWAN 15 km', 'Pin 24 tháng', 'IP67'], detail: 'Phù hợp cho rau màu, cây ăn trái.', features: ['Đo độ ẩm đất', 'Đo pH', 'Đo EC', 'Đo nhiệt độ'], images: [] },
      { id: 'prod-002', name: 'EcoSyn AirPulse', price: 5200000, category: 'sensor', badge: 'Mới', status: 'Còn hàng', description: 'Cảm biến vi khí hậu', specs: ['Chống sương mù', 'Pin 18 tháng', 'IP66'], detail: 'Giám sát khí hậu tầng tán', features: ['Đo nhiệt độ', 'Đo độ ẩm', 'Đo ánh sáng'], images: [] },
      { id: 'prod-003', name: 'EcoSyn Bridge X2', price: 15800000, category: 'gateway', badge: 'Pro', status: 'Còn hàng', description: 'Gateway LoRaWAN + 4G/LTE', specs: ['SIM kép', 'UPS 8 giờ', 'AI edge'], detail: 'Tối ưu kết nối', features: ['LoRaWAN', '4G/LTE', 'UPS tích hợp'], images: [] },
      { id: 'prod-004', name: 'EcoSyn Valve Kit', price: 9400000, category: 'automation', badge: 'Tiết kiệm', status: 'Còn hàng', description: 'Bộ điều khiển 2 van tưới', specs: ['Điều khiển zone', 'Điện 12V', 'IP65'], detail: 'Điều khiển theo lịch', features: ['Điều khiển 2 van', 'Cảm biến áp suất'], images: [] },
      { id: 'prod-005', name: 'EcoSyn Pump Brain', price: 12400000, category: 'automation', badge: 'Kho bãi', status: 'Còn hàng', description: 'Điều khiển bơm trung tâm', specs: ['3 pha 380V', 'HMI mini', 'Modbus'], detail: 'Tích hợp cảm biến lưu lượng', features: ['Điều khiển bơm', 'Phát hiện rò rỉ'], images: [] },
      { id: 'prod-006', name: 'EcoSyn Solar Pack', price: 17600000, category: 'power', badge: 'Off-grid', status: 'Còn hàng', description: 'Bộ năng lượng mặt trời 400W', specs: ['Pin LiFePO4', 'Giám sát năng lượng', 'Khung chống gió'], detail: 'Tối ưu cho vùng không điện', features: ['Tấm pin 400W', 'Pin Lithium'], images: [] }
    ];

    const now = new Date().toISOString();
    products.forEach(p => {
      try {
        runQuery(
          `INSERT INTO products (id, name, price, category, badge, status, description, specs, detail, images, features, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.price, p.category || '', p.badge || '', p.status || 'Còn hàng', p.description || '',
           JSON.stringify(p.specs || []), p.detail || '', JSON.stringify(p.images || []), JSON.stringify(p.features || []), now, now]
        );
      } catch (e) {
        logger.warn('[Migrations] Product insert error:', e.message);
      }
    });

    logger.info(`[Migrations] Seeded ${products.length} products`);
    } catch (e) {
      logger.warn('[Migrations] Product seeding skipped:', e.message);
    }
  }
}

function seedCategories() {
  const existingCount = getAll('SELECT COUNT(*) as count FROM product_categories')[0]?.count || 0;

  if (existingCount === 0) {
    const categories = [
      { id: 'cat-sensor', name: 'Cảm biến', slug: 'sensor', icon: '📡', sortOrder: 1 },
      { id: 'cat-gateway', name: 'Gateway', slug: 'gateway', icon: '🌐', sortOrder: 2 },
      { id: 'cat-automation', name: 'Điều khiển', slug: 'automation', icon: '⚙️', sortOrder: 3 },
      { id: 'cat-power', name: 'Năng lượng', slug: 'power', icon: '⚡', sortOrder: 4 },
      { id: 'cat-cloud', name: 'Cloud & AI', slug: 'cloud', icon: '☁️', sortOrder: 5 }
    ];

    const now = new Date().toISOString();
    categories.forEach(c => {
      runQuery(
        `INSERT INTO product_categories (id, name, slug, icon, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.slug, c.icon, c.sortOrder, now]
      );
    });

    logger.info(`[Migrations] Seeded ${categories.length} categories`);
  }
}

module.exports = { runMigrations };