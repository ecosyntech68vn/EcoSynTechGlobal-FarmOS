module.exports = {
  id: 'contract-claw',
  name: 'Contract Claw',
  description: 'Tạo hợp đồng và xử lý đặt hàng',
  
  process: function(context) {
    const quote = context.quote || {};
    const customer = context.customer || {};
    const payment = context.payment || '50-50';
    
    const contract = this.generateContract(quote, customer, payment);
    const contractPDF = this.getContractPDF(contract);
    
    return {
      contract: contract,
      pdf: contractPDF,
      payment: this.getPaymentInfo(payment, quote),
      nextAction: 'Proceed to payment / Modify quote'
    };
  },
  
  generateContract: function(quote, customer, paymentMethod) {
    const contractNumber = 'HD-' + Date.now();
    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      number: contractNumber,
      createdAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      status: 'pending',
      customer: {
        name: customer.name || 'Khách hàng',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || ''
      },
      package: quote.package || {},
      pricing: quote.pricing || {},
      payment: paymentMethod,
      terms: [
        '1. Hợp đồng có hiệu lực khi nhận đủ tiền đặt cọc',
        '2. Thời gian lắp đặt: 3-5 ngày làm việc sau khi đặt cọc',
        '3. Bảo hành 24 tháng cho thiết bị',
        '4. Bảo trì miễn phí 12 tháng đầu',
        '5. Khách hàng có quyền hủy hợp đồng trong 7 ngày (mất phí đặt cọc)',
        '6. EcoSynTech có quyền điều chỉnh giá nếu thay đổi spec'
      ],
      warranty: {
        period: '24 tháng',
        scope: 'Lỗi do nhà sản xuất',
        exclusions: ['Hư hỏng do tác động vật lý', 'Sử dụng sai cách', 'Thiên tai']
      }
    };
  },
  
  getContractPDF: function(contract) {
    return {
      header: {
        company: 'CÔNG TY TNHH ECOSYNTECH',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        phone: '1900 xxxx',
        email: 'info@ecosyntech.vn'
      },
      title: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ',
      contractNumber: contract.number,
      content: [
        {
          section: 'Điều 1: Đối tượng hợp đồng',
          content: `Cung cấp gói sản phẩm ${contract.package.name} với ${contract.package.sensors} cảm biến`
        },
        {
          section: 'Điều 2: Giá trị hợp đồng',
          content: `${this.formatPrice(contract.pricing.total)} (${this.formatPrice(contract.pricing.total)})`
        },
        {
          section: 'Điều 3: Phương thức thanh toán',
          content: this.getPaymentDescription(contract.payment)
        },
        {
          section: 'Điều 4: Bảo hành',
          content: `${contract.warranty.period} - ${contract.warranty.scope}`
        }
      ],
      signatures: {
        company: 'Đại diện EcoSynTech',
        customer: 'Khách hàng'
      },
      footer: 'Hợp đồng này có giá trị pháp lý theo quy định pháp luật Việt Nam'
    };
  },
  
  formatPrice: function(vnd) {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(vnd);
  },
  
  getPaymentInfo: function(method, quote) {
    const prices = quote.pricing || {};
    const total = prices.total || 0;
    
    const methods = {
      '50-50': {
        name: 'Thanh toán 50-50',
        deposit: Math.ceil(total * 0.5),
        remaining: Math.ceil(total * 0.5),
        description: 'Đặt cọc 50%, thanh toán nốt khi hoàn thành'
      },
      '100': {
        name: 'Thanh toán 100%',
        total: total,
        discount: Math.ceil(total * 0.05),
        description: 'Giảm 5% phí dịch vụ'
      },
      'installment': {
        name: 'Trả góp 12 tháng',
        monthly: Math.ceil(total / 12),
        interest: 0,
        description: 'Trả góp không lãi suất'
      }
    };
    
    return methods[method] || methods['50-50'];
  },
  
  getPaymentDescription: function(method) {
    const descriptions = {
      '50-50': 'Đặt cọc 50%, thanh toán nốt khi hoàn thành',
      '100': 'Thanh toán 100% trước khi lắp đặt',
      'installment': 'Trả góp 12 tháng không lãi suất'
    };
    return descriptions[method] || descriptions['50-50'];
  },
  
  generateOrderConfirmation: function(contract) {
    return {
      message: `✅ **XÁC NHẬN ĐẶT HÀNG**\n\n` +
        `Mã hợp đồng: ${contract.number}\n\n` +
        `📦 Gói: ${contract.package.name}\n` +
        `💰 Tổng: ${this.formatPrice(contract.pricing.total)}\n` +
        `📅 Ngày tạo: ${new Date(contract.createdAt).toLocaleDateString('vi-VN')}\n\n` +
        `Vui lòng thanh toán để xác nhận đơn hàng!\n\n` +
        `📱 Liên hệ: 1900 xxxx`,
      contract: contract
    };
  }
};