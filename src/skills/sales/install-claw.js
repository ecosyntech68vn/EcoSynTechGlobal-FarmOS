module.exports = {
  id: 'install-claw',
  name: 'Install Claw',
  description: 'Hướng dẫn triển khai và cài đặt',
  
  process: function(context) {
    const contract = context.contract || {};
    const packageId = contract.package?.id || 'standard';
    
    const guide = this.getInstallGuide(packageId);
    const timeline = this.getTimeline(packageId);
    const checklist = this.getChecklist();
    
    return {
      guide: guide,
      timeline: timeline,
      checklist: checklist,
      nextAction: 'Complete installation / Schedule training'
    };
  },
  
  getInstallGuide: function(packageId) {
    const guides = {
      basic: {
        title: 'Hướng dẫn cài đặt Gói Cơ bản',
        duration: '30 phút',
        difficulty: 'Dễ',
        steps: [
          {
            step: 1,
            title: 'Kiểm tra thiết bị',
            content: 'Mở hộp, kiểm tra đủ 5 cảm biến, 1 gateway, dây nối',
            icon: '📦'
          },
          {
            step: 2,
            title: 'Lắp đặt Gateway',
            content: 'Cắm nguồn, kết nối Wifi, đợi đèn xanh',
            icon: '🔌'
          },
          {
            step: 3,
            title: 'Đặt cảm biến đất',
            content: 'Đặt 5 cảm biến theo vị trí cây trồng, nhấn nút khởi động',
            icon: '🌱'
          },
          {
            step: 4,
            title: 'Tải app EcoSynTech',
            content: 'Quét QR trong hướng dẫn, đăng ký tài khoản',
            icon: '📱'
          },
          {
            step: 5,
            title: 'Kết nối thiết bị',
            content: 'Vào app > Thêm thiết bị > Quét QR trên cảm biến',
            icon: '📡'
          }
        ]
      },
      standard: {
        title: 'Hướng dẫn cài đặt Gói Tiêu chuẩn',
        duration: '60 phút',
        difficulty: 'Trung bình',
        steps: [
          { step: 1, title: 'Kiểm tra thiết bị', content: 'Mở hộp, kiểm tra đủ 10 cảm biến, 1 gateway, dây nối', icon: '📦' },
          { step: 2, title: 'Cài đặt Gateway', content: 'Cắm nguồn, kết nối Wifi/Ethernet', icon: '🔌' },
          { step: 3, title: 'Cấu hình mạng', content: 'Vào app, cài đặt thông số Wifi', icon: '📶' },
          { step: 4, title: 'Đặt cảm biến', content: 'Đặt 10 cảm biến theo vùng', icon: '🌱' },
          { step: 5, title: 'Cài đặt rules', content: 'Vào app > Rules, cài đặt ngưỡng cảnh báo', icon: '⚙️' },
          { step: 6, title: 'Test hệ thống', content: 'Chạy test, kiểm tra dữ liệu', icon: '✅' }
        ]
      },
      premium: {
        title: 'Hướng dẫn cài đặt Gói Nâng cao',
        duration: '90 phút',
        difficulty: 'Cần kỹ thuật',
        steps: [
          { step: 1, title: 'Kiểm tra thiết bị', content: 'Full checklist 20 cảm biến + accessories', icon: '📦' },
          { step: 2, title: 'Cài đặt Server local', content: 'Cài đặt Docker, cấu hình', icon: '🖥️' },
          { step: 3, title: 'Cấu hình Network', content: 'Setup VLAN, Firewall', icon: '🔒' },
          { step: 4, title: 'Đặt cảm biến', content: 'Đặt theo bản đồ trang trại', icon: '🗺️' },
          { step: 5, title: 'Cấu hình AI', content: 'Train model, setup thresholds', icon: '🤖' },
          { step: 6, title: 'Kết nối Blockchain', content: 'Setup wallet, connect Aptos', icon: '⛓️' },
          { step: 7, title: 'Test toàn bộ', content: 'Full system test', icon: '✅' }
        ]
      }
    };
    
    return guides[packageId] || guides.standard;
  },
  
  getTimeline: function(packageId) {
    return [
      { day: 1, task: 'Giao hàng', status: 'pending' },
      { day: '1-2', task: 'Khảo sát hiện trường', status: 'pending' },
      { day: '2-3', task: 'Lắp đặt thiết bị', status: 'pending' },
      { day: '3', task: 'Cấu hình & Test', status: 'pending' },
      { day: '3-5', task: 'Training khách hàng', status: 'pending' },
      { day: '5', task: 'Bàn giao', status: 'pending' }
    ];
  },
  
  getChecklist: function() {
    return {
      hardware: [
        '✅ Cảm biến đủ số lượng',
        '✅ Gateway hoạt động',
        '✅ Dây nối, adapter',
        '✅ QR code thiết bị'
      ],
      network: [
        '✅ Wifi ổn định',
        '✅ Đủ băng thông',
        '✅ Thông tin Wifi đã có'
      ],
      installation: [
        '✅ Điện ổn định',
        '✅ Vị trí đặt thiết bị',
        '✅ Access vào trang trại'
      ]
    };
  },
  
  getVideoGuide: function() {
    return {
      youtube: 'https://youtube.com/ecosyntech',
      docs: 'https://docs.ecosyntech.vn',
      support: '1900 xxxx'
    };
  },
  
  getResponse: function(guide) {
    return {
      message: `📖 **HƯỚNG DẪN CÀI ĐẶT**\n\n` +
        `⏱️ Thời gian: ${guide.duration}\n` +
        `📊 Độ khó: ${guide.difficulty}\n\n` +
        guide.steps.map(s => `${s.step}. ${s.icon} ${s.title}`).join('\n') + '\n\n' +
        `❓ Cần hỗ trợ? Gọi: 1900 xxxx`,
      guide: guide
    };
  }
};