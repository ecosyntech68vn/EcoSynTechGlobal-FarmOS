const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const config = require('./index');
const logger = require('./logger');

let db = null;
let SQL = null;

async function initDatabase() {
  const dbDir = path.dirname(config.database.path);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(config.database.path)) {
    const fileBuffer = fs.readFileSync(config.database.path);
    db = new SQL.Database(fileBuffer);
    logger.info('Loaded existing database');
  } else {
    db = new SQL.Database();
    logger.info('Created new database');
  }

  createTables();
  seedInitialData();
  saveDatabase();
  
  logger.info('Database initialized successfully');
  return db;
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.database.path, buffer);
  } catch (err) {
    logger.error('Failed to save database:', err);
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone TEXT,
      status TEXT DEFAULT 'offline',
      config TEXT DEFAULT '{}',
      last_seen TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      type TEXT UNIQUE NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      min_value REAL,
      max_value REAL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      condition TEXT NOT NULL,
      action TEXT NOT NULL,
      cooldown_minutes INTEGER DEFAULT 30,
      hysteresis REAL DEFAULT 0,
      time_window TEXT,
      priority TEXT DEFAULT 'normal',
      target_device TEXT,
      trigger_count INTEGER DEFAULT 0,
      last_triggered TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled)');

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      zones TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      days TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      trigger TEXT,
      status TEXT DEFAULT 'success',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      sensor TEXT,
      value REAL,
      message TEXT,
      acknowledged INTEGER DEFAULT 0,
      acknowledged_at TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      device_id TEXT,
      user_id TEXT,
      name TEXT,
      permissions TEXT DEFAULT '[]',
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      command TEXT NOT NULL,
      params TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      delivered_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS traceability_batches (
      id TEXT PRIMARY KEY,
      batch_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      product_type TEXT,
      quantity REAL,
      unit TEXT,
      farm_name TEXT,
      zone TEXT,
      seed_variety TEXT,
      planting_date TEXT,
      expected_harvest TEXT,
      harvest_date TEXT,
      harvest_quantity REAL,
      harvest_notes TEXT,
      status TEXT DEFAULT 'active',
      metadata TEXT DEFAULT '{}',
      farm_address TEXT,
      farm_certifications TEXT DEFAULT '[]',
      buyer_name TEXT,
      buyer_contact TEXT,
      export_date TEXT,
      export_price REAL,
      export_unit TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS traceability_stages (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      stage_type TEXT NOT NULL,
      stage_order INTEGER DEFAULT 0,
      description TEXT,
      performed_by TEXT,
      location TEXT,
      inputs_used TEXT DEFAULT '[]',
      photos TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES traceability_batches(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS traceability_readings (
      id TEXT PRIMARY KEY,
      batch_id TEXT,
      device_id TEXT,
      sensor_type TEXT,
      value REAL,
      unit TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES traceability_batches(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rule_history (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      sensor_value REAL,
      triggered INTEGER DEFAULT 0,
      action_taken TEXT,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES rules(id)
    )
  `);

  try {
    db.run('CREATE INDEX idx_rule_history_rule_id ON rule_history(rule_id)');
    db.run('CREATE INDEX idx_rule_history_executed_at ON rule_history(executed_at)');
  } catch (e) {
    logger.warn('[Database] Index creation skipped:', e.message);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY,
      sensor_type TEXT NOT NULL,
      value REAL NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS device_firmwares (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      description TEXT,
      device_type TEXT NOT NULL,
      file_url TEXT,
      checksum TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ota_updates (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      firmware_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS device_config_history (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      old_config TEXT,
      new_config TEXT,
      changed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variety TEXT,
      planting_date TEXT,
      expected_harvest TEXT,
      harvest_date TEXT,
      harvest_quantity REAL,
      kc_stage TEXT DEFAULT '{}',
      area REAL,
      unit TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS crop_stages (
      id TEXT PRIMARY KEY,
      crop_id TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      stage_order INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crop_id) REFERENCES crops(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS crop_yields (
      id TEXT PRIMARY KEY,
      crop_id TEXT NOT NULL,
      harvest_date TEXT,
      quantity REAL,
      quality TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crop_id) REFERENCES crops(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id TEXT PRIMARY KEY,
      ip TEXT UNIQUE NOT NULL,
      description TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      user_id TEXT,
      details TEXT DEFAULT '{}',
      ip TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      token TEXT,
      ip TEXT,
      user_agent TEXT,
      last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT,
      settings TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      area REAL,
      area_unit TEXT DEFAULT 'hectare',
      owner_id TEXT,
      settings TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ota_history (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      current_version TEXT,
      target_version TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      farm_id TEXT,
      daily_rate REAL,
      status TEXT DEFAULT 'active',
      hire_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS worker_attendance (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      hours_worked REAL,
      task TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS supply_chain (
      id TEXT PRIMARY KEY,
      batch_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      source_farm_id TEXT,
      destination TEXT,
      status TEXT DEFAULT 'pending',
      harvest_date TEXT,
      shipped_date TEXT,
      delivered_date TEXT,
      temperature REAL,
      humidity REAL,
      quality_check TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      quantity REAL DEFAULT 0,
      min_quantity REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      supplier TEXT,
      farm_id TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_log (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS finance (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      farm_id TEXT,
      date TEXT NOT NULL,
      payment_method TEXT,
      reference_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS finance_summary (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      income REAL DEFAULT 0,
      expenses REAL DEFAULT 0,
      workers_cost REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(farm_id, year, month)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      version TEXT DEFAULT '1.0',
      status TEXT DEFAULT 'active',
      framework TEXT DEFAULT 'rules',
      input_schema TEXT DEFAULT '{}',
      output_schema TEXT DEFAULT '{}',
      metrics TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_jobs (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      farm_id TEXT,
      asset_id TEXT,
      job_type TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      input_data TEXT DEFAULT '{}',
      output_data TEXT DEFAULT '{}',
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      model_id TEXT,
      asset_id TEXT,
      target_type TEXT NOT NULL,
      target_time TEXT,
      predicted_value TEXT,
      confidence REAL,
      explanation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      prediction_id TEXT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      suggested_action TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      device_id TEXT,
      asset_id TEXT,
      metric TEXT NOT NULL,
      expected_range TEXT,
      actual_value REAL,
      severity TEXT DEFAULT 'low',
      status TEXT DEFAULT 'open',
      detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
      acknowledged_by TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_feedback (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT,
      prediction_id TEXT,
      user_id TEXT,
      feedback_type TEXT NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_vi TEXT,
      category TEXT NOT NULL,
      kc_initial REAL DEFAULT 0.4,
      kc_mid REAL DEFAULT 1.0,
      kc_end REAL DEFAULT 0.7,
      min_temp REAL,
      max_temp REAL,
      optimal_temp_min REAL,
      optimal_temp_max REAL,
      min_humidity REAL,
      max_humidity REAL,
      min_soil_moisture REAL,
      max_soil_moisture REAL,
      growth_days INTEGER,
      seed_depth REAL,
      row_spacing REAL,
      plant_spacing REAL,
      water_requirement REAL,
      fertilizer_type TEXT,
      disease_risk TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS aquaculture (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_vi TEXT,
      category TEXT NOT NULL,
      optimal_temp_min REAL,
      optimal_temp_max REAL,
      optimal_ph_min REAL,
      optimal_ph_max REAL,
      optimal_do REAL,
      optimal_salinity REAL,
      growth_days INTEGER,
      density_max REAL,
      feed_conversion_ratio REAL,
      water_change_rate REAL,
      disease_risk TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info('Database tables created');
}

function seedCropData() {
  const cropCount = db.exec('SELECT COUNT(*) as count FROM crops')[0]?.values[0][0] || 0;
  
  if (cropCount === 0) {
    const crops = [
      ['crop-rice', 'Rice', 'Lúa', 'cereal', 0.4, 1.2, 0.9, 20, 35, 25, 30, 60, 90, 20, 80, 120, 2, 25, 15, '3500', 'NPK 46-0-0', 'blast, blight'],
      ['crop-maize', 'Maize/Bắp', 'Ngô', 'cereal', 0.4, 1.15, 0.6, 18, 35, 24, 30, 60, 90, 18, 80, 100, 3, 30, 20, '5000', 'NPK 46-0-0', 'rust, worms'],
      ['crop-vegetable-leaf', 'Leaf Vegetables', 'Rau ăn lá', 'vegetable', 0.4, 1.05, 0.85, 15, 30, 20, 25, 70, 95, 15, 75, 45, 1, 20, 10, '2500', 'NPK 30-10-10', 'aphids, mildew'],
      ['crop-cabbage', 'Cabbage', 'Bắp cải', 'vegetable', 0.35, 0.95, 0.8, 10, 25, 18, 22, 75, 95, 20, 75, 70, 2, 45, 15, '3500', 'NPK 20-20-20', 'loopers, black rot'],
      ['crop-tomato', 'Tomato', 'Cà chua', 'vegetable', 0.4, 1.05, 0.7, 15, 32, 22, 26, 65, 90, 15, 70, 80, 1.5, 50, 15, '4000', 'NPK 20-20-20', 'blight, wilt'],
      ['crop-pepper', 'Pepper', 'Ớt', 'vegetable', 0.35, 1.0, 0.7, 20, 35, 25, 30, 70, 90, 15, 70, 90, 1, 60, 15, '2000', 'NPK 10-10-20', 'mosaic, anthracnose'],
      ['crop-cucumber', 'Cucumber', 'Dưa leo', 'vegetable', 0.4, 0.95, 0.7, 18, 32, 22, 28, 70, 95, 18, 70, 60, 2, 30, 12, '3000', 'NPK 30-10-10', 'powdery mildew'],
      ['crop-pumpkin', 'Pumpkin', 'Bí đỏ', 'vegetable', 0.35, 0.9, 0.65, 20, 32, 24, 30, 65, 90, 15, 70, 100, 3, 50, 20, '2500', 'NPK 15-15-15', 'powdery mildew'],
      ['crop-onion', 'Onion', 'Hành tím', 'vegetable', 0.4, 1.0, 0.75, 15, 28, 20, 25, 65, 90, 20, 70, 90, 2, 60, 22, '3500', 'NPK 46-0-0', 'thrips, purple blotch'],
      ['crop-potato', 'Potato', 'Khoai tầy', 'tuber', 0.4, 1.05, 0.75, 12, 25, 18, 22, 70, 95, 15, 75, 90, 2, 70, 25, '4000', 'NPK 20-20-20', 'late blight'],
      ['crop-carrot', 'Carrot', 'Cà rốt', 'root', 0.35, 0.9, 0.7, 15, 28, 20, 24, 65, 90, 18, 70, 75, 2, 60, 23, '3000', 'NPK 15-15-15', 'leaf spot'],
      ['crop-spinach', 'Spinach', 'Rau muống', 'leaf', 0.4, 1.0, 0.8, 15, 28, 20, 25, 75, 95, 20, 80, 35, 2, 15, 8, '1500', 'NPK 30-10-10', 'caterpillars'],
      ['crop-lettuce', 'Lettuce', 'Xà lách', 'leaf', 0.35, 0.95, 0.8, 10, 24, 15, 22, 75, 95, 20, 75, 45, 1, 30, 10, '2500', 'NPK 20-10-10', 'downy mildew'],
      ['crop-bean', 'Bean', 'Đậu cove', 'legume', 0.4, 1.1, 0.65, 18, 32, 22, 28, 60, 90, 18, 75, 65, 2, 30, 15, '2500', 'NPK 20-20-20', 'rust, mosaic'],
      ['crop-peanut', 'Peanut', 'Lạc', 'legume', 0.4, 1.05, 0.65, 20, 32, 24, 30, 60, 85, 15, 70, 110, 3, 60, 22, '3000', 'NPK 0-0-60', 'leaf spot'],
      ['crop-soybean', 'Soybean', 'Đậu tương', 'legume', 0.4, 1.1, 0.6, 18, 32, 22, 28, 60, 85, 15, 70, 90, 3, 45, 18, '2800', 'NPK 0-46-0', 'rust'],
      ['crop-sugarcane', 'Sugarcane', 'Mía', 'cereal', 0.4, 1.2, 0.75, 20, 38, 28, 35, 60, 85, 20, 75, 365, 5, 120, 40, '18000', 'NPK 46-0-0', 'smut'],
      ['crop-banana', 'Banana', 'Chuối', 'fruit', 0.5, 1.1, 0.9, 22, 32, 25, 30, 70, 90, 25, 75, 270, 4, 180, 60, '6000', 'NPK 15-10-20', 'panama disease'],
      ['crop-mango', 'Mango', 'Xoài', 'fruit', 0.4, 0.85, 0.65, 22, 36, 26, 32, 60, 85, 20, 70, 180, 5, 200, 80, '5000', 'NPK 0-0-60', 'anthracnose'],
      ['crop-orange', 'Orange', 'Cam', 'fruit', 0.4, 0.85, 0.65, 18, 34, 24, 30, 65, 85, 20, 70, 240, 4, 180, 70, '4000', 'NPK 15-15-15', 'citrus greening'],
      ['crop-coffee', 'Coffee', 'Cà phê', 'fruit', 0.4, 0.9, 0.7, 18, 28, 22, 26, 70, 90, 20, 70, 180, 4, 120, 50, '2500', 'NPK 20-10-10', 'rust'],
      ['crop-rubber', 'Rubber', 'Cao su', 'tree', 0.45, 1.0, 0.8, 22, 34, 25, 30, 70, 85, 20, 70, 365, 8, 300, 100, '1800', 'NPK 18-10-10', 'root rot']
    ];

    const stmt = db.prepare(`INSERT INTO crops (id, name, name_vi, category, kc_initial, kc_mid, kc_end, min_temp, max_temp, optimal_temp_min, optimal_temp_max, min_humidity, max_humidity, min_soil_moisture, max_soil_moisture, growth_days, row_spacing, plant_spacing, water_requirement, fertilizer_type, disease_risk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    crops.forEach(crop => {
      stmt.run(crop);
    });
    stmt.free();
    
    logger.info('Crop data seeded');
  }
  
  const aquaCount = db.exec('SELECT COUNT(*) as count FROM aquaculture')[0]?.values[0][0] || 0;
  
  if (aquaCount === 0) {
    const aquaculture = [
      ['fish-carp', 'Common Carp', 'Cá chép', 'fish', 20, 30, 6.5, 8.5, 5, 15, 180, 50, 1.5, 20, 'dropsy, parasites'],
      ['fish-tilapia', 'Tilapia', 'Cá rô phi', 'fish', 22, 32, 6.5, 8.5, 4, 10, 180, 100, 1.2, 15, 'streptococcus'],
      ['fish-catfish', 'Catfish', 'Cá lóc', 'fish', 22, 32, 6.0, 8.0, 3, 5, 150, 30, 1.3, 20, 'bacterial disease'],
      ['fish-grouper', 'Grouper', 'Cá mú', 'fish', 25, 32, 7.0, 8.5, 5, 35, 240, 25, 1.5, 25, 'viral'],
      ['fish-salmon', 'Salmon', 'Cá hồi', 'fish', 10, 18, 6.5, 8.0, 6, 30, 400, 20, 1.0, 30, 'sea lice'],
      ['fish-catfish-vn', 'Cá basa', 'Cá basa', 'fish', 22, 30, 6.0, 8.0, 3, 8, 180, 60, 1.2, 20, 'fungus'],
      ['shrimp-fresh', 'Freshwater Shrimp', 'Tôm càng xanh', 'shrimp', 22, 30, 7.0, 8.5, 5, 10, 120, 30, 1.2, 20, 'white spot'],
      ['shrimp-salt', 'Black Tiger Shrimp', 'Tôm sú', 'shrimp', 25, 32, 7.5, 8.5, 5, 25, 150, 40, 1.3, 25, 'white spot, Taura'],
      ['shrimp-vannamei', 'Pacific White Shrimp', 'Tôm thẻ chân trắng', 'shrimp', 25, 32, 7.5, 8.5, 5, 20, 120, 50, 1.1, 20, 'EMS, white spot'],
      ['fish-eel', 'Eel', 'Lươn', 'fish', 22, 30, 6.5, 7.5, 4, 5, 180, 20, 1.3, 30, 'fungus'],
      ['fish-clarias', 'Clarias Catfish', 'Cá trê', 'fish', 22, 32, 6.0, 8.0, 3, 5, 180, 40, 1.2, 15, 'bacterial infection'],
      ['fish-mrigal', 'Mrigal', 'Cá rô đầu phụng', 'fish', 22, 30, 6.5, 8.0, 4, 10, 180, 30, 1.4, 15, 'epizootic'],
      ['fish-rohu', 'Rohu', 'Cá mè', 'fish', 22, 32, 6.5, 8.5, 4, 10, 365, 25, 1.5, 20, 'koi herpes'],
      ['frog-tiger', 'Tiger Frog', 'Ếch', 'amphibian', 22, 30, 6.5, 7.5, 4, 2, 90, 30, 1.2, 10, 'red leg syndrome']
    ];

    const stmt = db.prepare(`INSERT INTO aquaculture (id, name, name_vi, category, optimal_temp_min, optimal_temp_max, optimal_ph_min, optimal_ph_max, optimal_do, optimal_salinity, growth_days, density_max, feed_conversion_ratio, water_change_rate, disease_risk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    aquaculture.forEach(a => {
      stmt.run(a);
    });
    stmt.free();
    
    logger.info('Aquaculture data seeded');
  }
}

function seedInitialData() {
  seedCropData();
  const deviceCount = db.exec('SELECT COUNT(*) as count FROM devices')[0]?.values[0][0] || 0;
  
  if (deviceCount === 0) {
    const devices = [
      ['device-001', 'SoilSense-001', 'sensor', 'zone1', 'online', JSON.stringify({ thresholdLow: 30, thresholdCritical: 20 }), new Date().toISOString()],
      ['device-002', 'AirPulse-002', 'sensor', 'zone2', 'online', JSON.stringify({ thresholdLow: 60, thresholdCritical: 90 }), new Date().toISOString()],
      ['device-003', 'Pump-Control-01', 'pump', 'all', 'online', JSON.stringify({ autoMode: true }), new Date().toISOString()],
      ['device-004', 'Valve-Zone-03', 'valve', 'zone3', 'online', JSON.stringify({ flowRate: 50 }), new Date().toISOString()],
      ['device-005', 'AirSense-002', 'sensor', 'zone2', 'offline', '{}', new Date(Date.now() - 3600000).toISOString()],
      ['device-006', 'GrowLight-01', 'light', 'zone1', 'online', JSON.stringify({ brightness: 80 }), new Date().toISOString()]
    ];

    const stmt = db.prepare('INSERT INTO devices (id, name, type, zone, status, config, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)');
    devices.forEach(device => {
      stmt.run(device);
    });
    stmt.free();
  }

  const sensorCount = db.exec('SELECT COUNT(*) as count FROM sensors')[0]?.values[0][0] || 0;
  
  if (sensorCount === 0) {
    const sensors = [
      ['sensor-temp', 'temperature', 28.5, '°C', 18, 32],
      ['sensor-humid', 'humidity', 72, '%', 60, 85],
      ['sensor-soil', 'soil', 45, '%', 30, 70],
      ['sensor-light', 'light', 42.5, 'klux', 20, 60],
      ['sensor-ph', 'ph', 6.8, 'pH', 6.0, 7.5],
      ['sensor-co2', 'co2', 418, 'ppm', 350, 800],
      ['sensor-ec', 'ec', 2.1, 'mS/cm', 1.5, 3.0],
      ['sensor-water', 'water', 78, '%', 20, 100]
    ];

    const stmt = db.prepare('INSERT INTO sensors (id, type, value, unit, min_value, max_value) VALUES (?, ?, ?, ?, ?, ?)');
    sensors.forEach(sensor => {
      stmt.run(sensor);
    });
    stmt.free();
  }

  const ruleCount = db.exec('SELECT COUNT(*) as count FROM rules')[0]?.values[0][0] || 0;
  
  if (ruleCount === 0) {
    const rules = [
      ['rule-1', 'Tưới khi đất khô', 'Tự động tưới khi độ ẩm đất xuống dưới 35%', 1, JSON.stringify({ sensor: 'soil', operator: '<', value: 35 }), JSON.stringify({ type: 'valve_open', target: 'zone1' })],
      ['rule-2', 'Bật quạt khi nóng', 'Kích hoạt quạt thông gió khi nhiệt độ trên 30°C', 1, JSON.stringify({ sensor: 'temperature', operator: '>', value: 30 }), JSON.stringify({ type: 'fan_on', target: 'all' })],
      ['rule-3', 'Cảnh báo nước thấp', 'Thông báo khi mực nước bồn dưới 25%', 1, JSON.stringify({ sensor: 'water', operator: '<', value: 25 }), JSON.stringify({ type: 'alert', target: 'all' })]
    ];

    const stmt = db.prepare('INSERT INTO rules (id, name, description, enabled, condition, action) VALUES (?, ?, ?, ?, ?, ?)');
    rules.forEach(rule => {
      stmt.run(rule);
    });
    stmt.free();
  }

  const scheduleCount = db.exec('SELECT COUNT(*) as count FROM schedules')[0]?.values[0][0] || 0;
  
  if (scheduleCount === 0) {
    const schedules = [
      ['sched-1', 'Lịch tưới sáng', '06:00', 60, JSON.stringify(['zone1', 'zone2', 'zone3']), 1, JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])],
      ['sched-2', 'Lịch tưới chiều', '17:00', 60, JSON.stringify(['zone4', 'zone5']), 1, JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])],
      ['sched-3', 'Bón phân định kỳ', '08:00', 45, JSON.stringify(['all']), 0, JSON.stringify(['Tue', 'Fri'])]
    ];

    const stmt = db.prepare('INSERT INTO schedules (id, name, time, duration, zones, enabled, days) VALUES (?, ?, ?, ?, ?, ?, ?)');
    schedules.forEach(schedule => {
      stmt.run(schedule);
    });
    stmt.free();
  }

  // Seed a test user when running in test environment to enable auth tests without manual registration
  try {
    if (process.env.NODE_ENV === 'test') {
      const existingTestUser = getOne('SELECT id FROM users WHERE email = ?', ['test@example.com']);
      if (!existingTestUser) {
        const testId = 'user-test';
        const testEmail = 'test@example.com';
        const testPassword = 'password123';
        const hashedPassword = bcrypt.hashSync(testPassword, 10);
        runQuery(
          'INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [testId, testEmail, hashedPassword, 'Test User', 'user']
        );
      }
    }
  } catch (e) {
    // Ignore seed errors in test mode to avoid blocking DB init
  }

  saveDatabase();
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function runQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run(sql, params);
    saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (err) {
    logger.error('Query error:', err);
    throw err;
  }
}

function getOne(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    logger.error('Query error:', err);
    throw err;
  }
}

function getAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    logger.error('Query error:', err);
    throw err;
  }
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  runQuery,
  getOne,
  getAll,
  saveDatabase
};
