const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase();
}

function generatePaymentId() {
  return 'PAY-' + Date.now().toString(36).toUpperCase();
}

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

router.get('/', auth, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (req.user.role === 'user') {
    sql += ' AND user_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const orders = getAll(sql, params);
  const countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1' +
    (status ? ' AND status = ?' : '') + (req.user.role === 'user' ? ' AND user_id = ?' : '');
  const countParams = [...(status ? [status] : []), ...(req.user.role === 'user' ? [req.user.id] : [])];
  const total = getOne(countSql, countParams)?.total || 0;

  res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const order = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'user' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const items = getAll('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  const payments = getAll('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);

  res.json({ ...order, items, payments });
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  const { items, shippingAddress, notes, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = getOne('SELECT * FROM products WHERE id = ?', [item.productId]);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    const qty = item.quantity || 1;
    const price = product.price;
    subtotal += price * qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price,
      quantity: qty,
      total: price * qty
    });
  }

  const shippingFee = subtotal > 50000000 ? 0 : 1500000;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shippingFee + tax;

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  runQuery(
    `INSERT INTO orders (id, user_id, subtotal, shipping_fee, tax, total, status, shipping_address, notes, payment_method, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderId, req.user.id, subtotal, shippingFee, tax, total, ORDER_STATUS.PENDING,
     JSON.stringify(shippingAddress || {}), notes || '', paymentMethod || 'sepay', now, now]
  );

  for (const item of orderItems) {
    runQuery(
      `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), orderId, item.productId, item.name, item.price, item.quantity, item.total, now]
    );
  }

  const order = getOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  res.status(201).json(order);
}));

router.put('/:id/status', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const existing = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!Object.values(ORDER_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  runQuery('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
    [status, new Date().toISOString(), req.params.id]);

  const order = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  res.json(order);
}));

router.post('/:id/cancel', auth, asyncHandler(async (req, res) => {
  const existing = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'user' && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (existing.status !== ORDER_STATUS.PENDING) {
    return res.status(400).json({ error: 'Can only cancel pending orders' });
  }

  runQuery('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
    [ORDER_STATUS.CANCELLED, new Date().toISOString(), req.params.id]);

  res.json({ success: true, message: 'Order cancelled' });
}));

router.get('/:id/payments', auth, asyncHandler(async (req, res) => {
  const order = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'user' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const payments = getAll('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);
  res.json({ payments });
}));

router.post('/:id/payments', auth, asyncHandler(async (req, res) => {
  const { method, amount, bankCode } = req.body;
  const order = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'user' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const paymentId = generatePaymentId();
  const now = new Date().toISOString();

  const paymentData = {
    paymentId,
    orderId: order.id,
    amount: amount || order.total,
    method: method || 'sepay',
    bankCode: bankCode || '',
    status: PAYMENT_STATUS.PENDING,
    createdAt: now
  };

  runQuery(
    `INSERT INTO payments (id, order_id, amount, method, bank_code, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [paymentId, order.id, paymentData.amount, paymentData.method, paymentData.bankCode,
     PAYMENT_STATUS.PENDING, now]
  );

  const sepayResult = await processSepayPayment({
    paymentId,
    amount: paymentData.amount,
    orderId: order.id,
    bankCode: bankCode
  });

  if (sepayResult.success) {
    runQuery('UPDATE payments SET status = ?, sepay_data = ?, updated_at = ? WHERE id = ?',
      [PAYMENT_STATUS.PROCESSING, JSON.stringify(sepayResult.data), now, paymentId]);
  }

  res.json({ payment: paymentData, sepay: sepayResult });
}));

async function processSepayPayment(params) {
  const sepayConfig = {
    partnerCode: process.env.SEPAY_PARTNER_CODE || 'ECOSYNTECH',
    secretKey: process.env.SEPAY_SECRET_KEY || '',
    APIUrl: process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1'
  };

  if (!sepayConfig.secretKey) {
    return {
      success: true,
      data: {
        paymentUrl: `https://sepay.vn/pay/${params.paymentId}`,
        qrCode: `https://api.qrserver.com/hello/?data=${encodeURIComponent(`PAY:${params.paymentId}`)}`,
        instructions: 'Thanh toan qua QR Code hoac chuyen khoan truc tiep',
        bankInfo: {
          name: 'Nguyen Hong Van',
          account: '19031234567890',
          branch: 'ACB'
        }
      }
    };
  }

  const crypto = require('crypto');
  const hashData = [
    params.paymentId,
    params.amount,
    sepayConfig.partnerCode,
    sepayConfig.secretKey
  ].join('|');

  const signature = crypto.createHash('sha256').update(hashData).digest('hex');

  const paymentRequest = {
    partnerCode: sepayConfig.partnerCode,
    paymentId: params.paymentId,
    amount: params.amount,
    orderId: params.orderId,
    signature,
    returnUrl: process.env.SEPAY_RETURN_URL || 'http://localhost:3000/api/orders/callback',
    callbackUrl: process.env.SEPAY_CALLBACK_URL || 'http://localhost:3000/api/orders/webhook'
  };

  return {
    success: true,
    data: {
      paymentUrl: `${sepayConfig.APIUrl}/payment/create?${new URLSearchParams(paymentRequest).toString()}`,
      qrCode: `https://api.qrserver.com/hello/?data=${encodeURIComponent(`SEPAY:${params.paymentId}`)}`,
      paymentId: params.paymentId,
      timestamp: new Date().toISOString()
    }
  };
}

router.post('/:id/payments/:paymentId/callback', asyncHandler(async (req, res) => {
  const { paymentId, status, transactionId } = req.body;

  const payment = getOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const paymentStatus = status === 'success' ? PAYMENT_STATUS.COMPLETED :
    status === 'failed' ? PAYMENT_STATUS.FAILED : payment.status;

  runQuery('UPDATE payments SET status = ?, transaction_id = ?, updated_at = ? WHERE id = ?',
    [paymentStatus, transactionId || '', new Date().toISOString(), paymentId]);

  if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
    runQuery('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?',
      [ORDER_STATUS.CONFIRMED, new Date().toISOString(), payment.order_id]);
  }

  res.json({ success: true });
}));

router.get('/:id/invoice', auth, asyncHandler(async (req, res) => {
  const order = getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'user' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const items = getAll('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

  const invoice = {
    invoiceId: `INV-${order.id}`,
    orderId: order.id,
    createdAt: order.created_at,
    items: items.map(item => ({
      name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      total: item.total
    })),
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    tax: order.tax,
    total: order.total,
    status: order.status,
    paymentStatus: order.payment_status
  };

  res.json(invoice);
}));

module.exports = router;