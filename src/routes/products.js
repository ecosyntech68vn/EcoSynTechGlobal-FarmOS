const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getOne, getAll, runQuery } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function generateProductId() {
  return 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

router.get('/', asyncHandler(async (req, res) => {
  const { category, search, status } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  const products = getAll(sql, params);
  res.json({ products });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
}));

router.post('/', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    name, price, category, badge, status, description, specs, detail, images, features
  } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const id = generateProductId();
  const now = new Date().toISOString();

  runQuery(
    `INSERT INTO products (id, name, price, category, badge, status, description, specs, detail, images, features, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      price,
      category,
      badge || '',
      status || 'Còn hàng',
      description || '',
      JSON.stringify(specs || []),
      detail || '',
      JSON.stringify(images || []),
      JSON.stringify(features || []),
      now,
      now
    ]
  );

  const product = getOne('SELECT * FROM products WHERE id = ?', [id]);
  res.status(201).json(product);
}));

router.put('/:id', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const existing = getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const {
    name, price, category, badge, status, description, specs, detail, images, features
  } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (price !== undefined) { updates.push('price = ?'); params.push(price); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (badge !== undefined) { updates.push('badge = ?'); params.push(badge); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (specs !== undefined) { updates.push('specs = ?'); params.push(JSON.stringify(specs)); }
  if (detail !== undefined) { updates.push('detail = ?'); params.push(detail); }
  if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
  if (features !== undefined) { updates.push('features = ?'); params.push(JSON.stringify(features)); }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  runQuery(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

  const product = getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(product);
}));

router.delete('/:id', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const existing = getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Product deleted' });
}));

router.post('/:id/images', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images array is required' });
  }

  const existing = getOne('SELECT images FROM products WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const currentImages = JSON.parse(existing.images || '[]');
  const newImages = [...currentImages, ...images];

  runQuery('UPDATE products SET images = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(newImages), new Date().toISOString(), req.params.id]);

  res.json({ success: true, images: newImages });
}));

router.get('/categories/all', asyncHandler(async (req, res) => {
  const categories = getAll('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
  res.json({ categories: categories.map(c => c.category) });
}));

module.exports = router;