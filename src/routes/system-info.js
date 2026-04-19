const express = require('express');
const router = express.Router();
const pkg = require('../../package.json');

const COMPANY_INFO = {
  name: 'CÔNG TY TNHH CÔNG NGHỆ ECOSYNTECH GLOBAL',
  englishName: 'EcoSynTech Global Technology Co., Ltd',
  founder: 'Tạ Quang Thuận',
  position: 'CEO and FOUNDER',
  phone: '0989516698',
  email: 'kd.ecosyntech@gmail.com',
  website: 'https://ecosyntech.com',
  address: 'Việt Nam',
  founded: '2026',
  business: 'IoT Nông nghiệp Thông minh',
  services: [
    'Hệ thống quản lý nông trại',
    'Giám sát IoT',
    'Tưới tiêu tự động',
    'Truy xuất nguồn gốc QR',
    'Tích hợp Blockchain',
    'Tư vấn AI'
  ]
};

router.get('/info', (req, res) => {
  res.json({
    ok: true,
    data: {
      company: COMPANY_INFO,
      system: {
        name: 'EcoSynTech Farm OS',
        version: pkg.version,
        description: pkg.description,
        api: '/api/*',
        docs: '/api/docs'
      },
      links: {
        website: COMPANY_INFO.website,
        contact: `tel:${COMPANY_INFO.phone}`,
        email: `mailto:${COMPANY_INFO.email}`
      }
    }
  });
});

router.get('/status', (req, res) => {
  res.json({
    ok: true,
    data: {
      version: pkg.version,
      system: 'EcoSynTech Farm OS',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;