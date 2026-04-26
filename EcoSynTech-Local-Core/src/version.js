/**
 * EcoSynTech Local Core - Version Information
 * 
 * System: EcoSynTech Local Core V3.0
 * Related: EcoSynTech Cloud (GAS V10.0.1, FW V9.2.1)
 * 
 * Version: 3.0.0
 * Last Updated: 2025-04-26
 * 
 * Copyright © 2024-2025 EcoSynTech. All rights reserved.
 */

module.exports = {
  system: {
    name: 'EcoSynTech Local Core',
    version: '3.0.0',
    description: 'Hệ thống quản lý nông trại thông minh - Phiên bản nội bộ',
    cloud: {
      name: 'EcoSynTech Cloud',
      gas: 'V10.0.1',
      fw: 'V9.2.1'
    }
  },
  features: {
    ai: 170,
    skills: 56,
    modules: ['core', 'intelligence', 'ops', 'security', 'external'],
    integrations: ['Google', 'Facebook', 'Telegram', 'Zalo', 'TikTok']
  },
  audit: {
    standards: ['ISO 27001', '5S', 'PDCA', 'FIFO'],
    status: 'Compliant'
  }
};