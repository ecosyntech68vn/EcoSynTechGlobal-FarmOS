/**
 * Order Service - Full Order Lifecycle Management
 */

const { PLANS } = require('./pricingService');

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

class OrderService {
  constructor() {
    this.orders = new Map(); // orderId -> order data
  }

  createOrder(userId, cartData, paymentMethod) {
    const orderId = cartData.orderId || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const order = {
      orderId,
      userId,
      items: cartData.items,
      subtotal: cartData.subtotal,
      total: cartData.total,
      currency: cartData.currency,
      paymentMethod,
      status: ORDER_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      expiresAt: cartData.validUntil,
      paidAt: null,
      transactionId: null,
      paymentData: null
    };

    this.orders.set(orderId, order);
    return this.getOrder(orderId);
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  getOrderByUser(userId) {
    const userOrders = [];
    for (const order of this.orders.values()) {
      if (order.userId === userId) {
        userOrders.push(order);
      }
    }
    return userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateStatus(orderId, status, data = {}) {
    const order = this.orders.get(orderId);
    if (!order) return { ok: false, error: 'Order not found' };

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === ORDER_STATUS.PAID) {
      order.paidAt = new Date().toISOString();
      order.transactionId = data.transactionId;
      order.paymentData = data.paymentData || {};
    }

    this.orders.set(orderId, order);
    return { ok: true, order };
  }

  markAsPaid(orderId, transactionId, paymentData) {
    return this.updateStatus(orderId, ORDER_STATUS.PAID, {
      transactionId,
      paymentData
    });
  }

  cancelOrder(orderId) {
    return this.updateStatus(orderId, ORDER_STATUS.CANCELLED);
  }

  expireOrder(orderId) {
    return this.updateStatus(orderId, ORDER_STATUS.EXPIRED);
  }

  getOrderHistory(userId, limit = 20) {
    const orders = this.getOrderByUser(userId);
    return orders.slice(0, limit).map(order => ({
      orderId: order.orderId,
      items: order.items.map(item => ({
        plan: item.plan,
        quantity: item.quantity,
        total: item.total
      })),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt
    }));
  }

  getOrderStats(userId) {
    const orders = this.getOrderByUser(userId);
    
    const stats = {
      total: orders.length,
      paid: orders.filter(o => o.status === ORDER_STATUS.PAID).length,
      pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
      failed: orders.filter(o => o.status === ORDER_STATUS.FAILED).length,
      cancelled: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
      totalSpent: orders
        .filter(o => o.status === ORDER_STATUS.PAID)
        .reduce((sum, o) => sum + o.total, 0)
    };

    return stats;
  }

  // Check and auto-expire pending orders
  checkExpiredOrders() {
    const now = new Date();
    const expired = [];

    for (const [orderId, order] of this.orders) {
      if (order.status === ORDER_STATUS.PENDING) {
        if (new Date(order.expiresAt) < now) {
          order.status = ORDER_STATUS.EXPIRED;
          this.orders.set(orderId, order);
          expired.push(orderId);
        }
      }
    }

    return expired;
  }

  // Get receipt data
  getReceipt(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    return {
      receiptId: `RCP-${order.orderId}`,
      orderId: order.orderId,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt
    };
  }
}

module.exports = new OrderService();