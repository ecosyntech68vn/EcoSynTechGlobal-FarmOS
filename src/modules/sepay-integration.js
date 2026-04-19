const crypto = require('crypto');
const logger = require('../config/logger');

const SEPAY_CONFIG = {
  partnerCode: process.env.SEPAY_PARTNER_CODE || 'ECOSYNTECH',
  secretKey: process.env.SEPAY_SECRET_KEY || '',
  APIUrl: process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1',
  callbackUrl: process.env.SEPAY_CALLBACK_URL || 'http://localhost:3000/api/orders/webhook',
  returnUrl: process.env.SEPAY_RETURN_URL || 'http://localhost:3000/api/orders/return'
};

function generateSignature(data) {
  const signatureString = [
    data.paymentId,
    data.amount,
    SEPAY_CONFIG.partnerCode,
    SEPAY_CONFIG.secretKey
  ].join('|');

  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

function createPaymentLink(params) {
  const {
    paymentId,
    amount,
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    description
  } = params;

  const signature = generateSignature({ paymentId, amount });

  const paymentData = {
    partnerCode: SEPAY_CONFIG.partnerCode,
    paymentId,
    amount,
    orderId,
    signature,
    customerName: customerName || '',
    customerEmail: customerEmail || '',
    customerPhone: customerPhone || '',
    description: description || `Thanh toan don hang ${orderId}`,
    returnUrl: SEPAY_CONFIG.returnUrl,
    callbackUrl: SEPAY_CONFIG.callbackUrl
  };

  if (!SEPAY_CONFIG.secretKey) {
    logger.info('[Sepay] Running in demo mode - no secret key configured');

    return {
      success: true,
      isDemo: true,
      paymentId,
      amount,
      orderId,
      paymentUrl: `https://sepay.vn/pay/${paymentId}`,
      qrCode: generateQRCode(paymentId, amount),
      instructions: generatePaymentInstructions(amount),
      bankInfo: {
        bankName: 'ACB',
        accountNumber: '19031234567890',
        accountName: 'Nguyen Hong Van',
        branch: 'ACB'
      },
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  return {
    success: true,
    isDemo: false,
    paymentId,
    amount,
    orderId,
    paymentUrl: `${SEPAY_CONFIG.APIUrl}/payment/create?paymentId=${paymentId}&amount=${amount}&signature=${signature}`,
    qrCode: `${SEPAY_CONFIG.APIUrl}/qr/generate?data=${encodeURIComponent(paymentId)}`,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

function generateQRCode(paymentId, amount) {
  const qrData = `SEPAY:${paymentId}|${amount}`;
  return `https://api.qrserver.com/hello/?size=300x300&data=${encodeURIComponent(qrData)}`;
}

function generatePaymentInstructions(amount) {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);

  return `
Quý khách vui lòng thanh toán ${formattedAmount} bằng một trong các cách sau:

1. Quét mã QR bên dưới bằng app ngân hàng
2. Chuyển khoản trực tiếp:
   - Ngân hàng: ACB
   - Số tài khoản: 19031234567890
   - Tên tài khoản: Nguyen Hong Van
   - Nội dung: ${paymentId}

Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật trạng thái đơn hàng.
  `.trim();
}

function verifyWebhook(payload) {
  const { signature, paymentId, status } = payload;

  if (!SEPAY_CONFIG.secretKey) {
    logger.info('[Sepay] Webhook verification skipped (demo mode)');
    return { valid: true };
  }

  const expectedSignature = generateSignature({ paymentId, amount: payload.amount });

  if (signature !== expectedSignature) {
    logger.warn('[Sepay] Invalid signature', { paymentId, signature });
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true, status };
}

async function checkPaymentStatus(paymentId) {
  if (!SEPAY_CONFIG.secretKey) {
    return {
      paymentId,
      status: 'completed',
      message: 'Demo mode - payment considered successful'
    };
  }

  const signature = generateSignature({ paymentId, amount: 0 });

  try {
    const response = await fetch(
      `${SEPAY_CONFIG.APIUrl}/payment/status?paymentId=${paymentId}&signature=${signature}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    logger.error('[Sepay] Check payment status error:', err);
    return {
      paymentId,
      status: 'error',
      message: err.message
    };
  }
}

function createRefund(params) {
  const { paymentId, amount, reason } = params;

  if (!SEPAY_CONFIG.secretKey) {
    return {
      success: true,
      isDemo: true,
      refundId: `REF-${Date.now()}`,
      paymentId,
      amount,
      status: 'completed',
      message: 'Demo refund processed'
    };
  }

  const refundData = {
    partnerCode: SEPAY_CONFIG.partnerCode,
    paymentId,
    amount,
    reason: reason || 'Customer requested refund',
    signature: generateSignature({ paymentId, amount })
  };

  return {
    success: true,
    refundId: `REF-${Date.now()}`,
    ...refundData,
    status: 'processing'
  };
}

module.exports = {
  config: SEPAY_CONFIG,
  createPaymentLink,
  verifyWebhook,
  checkPaymentStatus,
  createRefund,
  generateQRCode,
  generatePaymentInstructions
};