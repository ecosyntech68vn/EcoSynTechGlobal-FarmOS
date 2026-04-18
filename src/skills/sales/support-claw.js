module.exports = {
  id: 'support-claw',
  name: 'Support Claw',
  description: 'Hỗ trợ bảo hành và xử lý sự cố',
  
  process: function(context) {
    const issue = context.issue || context.message || '';
    const contract = context.contract || {};
    const customer = context.customer || {};
    
    const diagnosis = this.diagnose(issue);
    const solution = this.getSolution(diagnosis);
    const ticket = this.createTicket(diagnosis, customer, contract);
    
    return {
      diagnosis: diagnosis,
      solution: solution,
      ticket: ticket,
      nextAction: 'Resolve / Escalate / Close'
    };
  },
  
  diagnose: function(issue) {
    const msg = (issue.message || issue || '').toLowerCase();
    
    const patterns = [
      { pattern: /cảm biến.*không|传感器.*不|lỗi.*cảm/i, type: 'sensor', severity: 'medium' },
      { pattern: /mất kết nối|无法连接|wifi|lỗi.*mạng/i, type: 'connectivity', severity: 'high' },
      { pattern: /app.*lỗi|Ứng dụng.*lỗi|app.*error/i, type: 'app', severity: 'medium' },
      { pattern: /dữ liệu.*sai|sai.*số|wrong.*data/i, type: 'data', severity: 'low' },
      { pattern: /bảo hành|warranty|bảo trì|maintenance/i, type: 'warranty', severity: 'low' },
      { pattern: /cần.*hỗ trợ|help|giúp.*đỡ/i, type: 'general', severity: 'low' }
    ];
    
    for (const p of patterns) {
      if (p.pattern.test(msg)) {
        return { type: p.type, severity: p.severity, issue: issue };
      }
    }
    
    return { type: 'unknown', severity: 'low', issue: issue };
  },
  
  getSolution: function(diagnosis) {
    const solutions = {
      sensor: {
        title: 'Xử lý lỗi cảm biến',
        steps: [
          'Kiểm tra pin cảm biến',
          'Kiểm tra kết nối dây',
          'Tháo lắp lại cảm biến',
          'Reset cảm biến (giữ nút 10 giây)',
          'Liên hệ Support nếu không được'
        ],
        estimatedTime: '15 phút',
        successRate: '90%'
      },
      connectivity: {
        title: 'Khắc phục mất kết nối',
        steps: [
          'Kiểm tra Wifi router',
          'Kiểm tra đèn signal gateway',
          'Khởi động lại gateway',
          'Kiểm tra mật khẩu Wifi',
          'Di chuyển gateway gần hơn'
        ],
        estimatedTime: '10 phút',
        successRate: '85%'
      },
      app: {
        title: 'Sửa lỗi app',
        steps: [
          'Update app lên phiên bản mới nhất',
          'Xóa cache app',
          'Khởi động lại điện thoại',
          'Đăng nhập lại',
          'Liên hệ Support nếu lỗi tiếp'
        ],
        estimatedTime: '5 phút',
        successRate: '95%'
      },
      data: {
        title: 'Kiểm tra dữ liệu',
        steps: [
          'Vào app > Cài đặt > Calibrate',
          'Kiểm tra ngưỡng cảnh báo',
          'Đợi 5 phút cập nhật',
          'Kiểm tra lịch sử'
        ],
        estimatedTime: '10 phút',
        successRate: '80%'
      },
      warranty: {
        title: 'Yêu cầu bảo hành',
        steps: [
          'Chụp hình sản phẩm',
          'Mô tả lỗi chi tiết',
          'Gửi yêu cầu qua email',
          'Chờ xác nhận trong 24h'
        ],
        estimatedTime: '24-48h',
        successRate: '100%'
      },
      unknown: {
        title: 'Liên hệ Support',
        steps: [
          'Mô tả chi tiết vấn đề',
          'Chụp hình/video nếu có',
          'Gửi vào Support'
        ],
        estimatedTime: 'Ngay',
        successRate: '100%'
      }
    };
    
    return solutions[diagnosis.type] || solutions.unknown;
  },
  
  createTicket: function(diagnosis, customer, contract) {
    const statuses = { low: 'Open', medium: 'In Progress', high: 'Urgent' };
    
    return {
      id: 'TKT-' + Date.now(),
      type: diagnosis.type,
      severity: diagnosis.severity,
      status: statuses[diagnosis.severity],
      customer: customer,
      contract: contract,
      createdAt: new Date().toISOString(),
      sla: {
        low: '72h',
        medium: '24h',
        high: '4h'
      }
    };
  },
  
  getWarrantyInfo: function(contract) {
    const startDate = new Date(contract.createdAt || Date.now());
    const endDate = new Date(startDate.getTime() + 24 * 30 * 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysRemaining: daysLeft,
      status: daysLeft > 0 ? 'Active' : 'Expired'
    };
  },
  
  getFAQ: function() {
    return [
      {
        q: 'App không hiển thị dữ liệu?',
        a: 'Kiểm tra kết nối Wifi và khởi động lại app.'
      },
      {
        q: 'Cảm biến báo lỗi đỏ?',
        a: 'Kiểm tra pin hoặc liên hệ Support.'
      },
      {
        q: 'Quên mật khẩu?',
        a: 'Vào app > Quên mật khẩu > Nhập email.'
      },
      {
        q: 'Gia hạn bảo hành?',
        a: 'Liên hệ 1900 xxxx để biết giá.'
      }
    ];
  },
  
  getResponse: function(diagnosis, solution) {
    return {
      message: `🔧 **XỬ LÝ: ${solution.title}**\n\n` +
        `⏱️ Thời gian: ${solution.estimatedTime}\n` +
        `✅ Khả năng xử lý: ${solution.successRate}\n\n` +
        solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n\n' +
        `❓ Cần hỗ trợ thêm? Gọi: 1900 xxxx`,
      solution: solution
    };
  }
};