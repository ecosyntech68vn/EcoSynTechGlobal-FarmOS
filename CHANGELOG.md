# CHANGELOG - EcoSynTech FarmOS

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi lại trong file này.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/).

---

## [5.0.1] - 2026-04-20

### Added
- Docker production deployment (docker-compose.prod.yml)
- Nginx reverse proxy config
- Deployment script (deploy.sh)
- Production environment template (.env.production)
- 5 SOPs cho operations:
  - SOP-A-01: Quản lý truy cập và xác thực
  - SOP-A-04: Sao lưu và phục hồi
  - SOP-A-05: Xử lý sự cố bảo mật
  - SOP-B-01: Khởi động hệ thống
  - SOP-B-03: Giám sát hệ thống
- Legal documents:
  - Terms of Service
  - Privacy Policy
  - SLA
  - Service Agreement
- Internal policies:
  - Employee Handbook
  - Security Policy
  - Incident Response Plan
  - Data Retention Policy
  - Acceptable Use Policy

### Fixed
- JWT_SECRET fallback for non-production environments
- Test timeout configurations

### Changed
- ESLint auto-fix: var → let/const, trailing commas

---

## [5.0.0] - 2026-04-15

### Added
- Core IoT features:
  - ESP32 device management
  - MQTT broker integration
  - WebSocket real-time
  - Sensor data collection
  - Rule engine
  - Scheduling system
- API v1/v2 versioning
- Feature flags system
- Self-healing mechanism
- Retry with exponential backoff
- Per-device rate limiting
- Swagger documentation
- In-memory caching
- SQLite WAL mode optimization
- Mobile-first PWA
- ISO 27001 compliance (9.2/10)

### Security
- JWT authentication
- Role-based access control
- Rate limiting
- Input sanitization
- SQL injection protection
- XSS protection
- CORS configuration

---

## [4.0.0] - 2026-03-01

### Added
- Initial project setup
- Express.js foundation
- SQLite database
- Basic CRUD APIs
- User authentication

---

## [Unreleased]

### To be added in future releases
- IoT Features:
  - OTA updates
  - Multi-farm support
  - AI predictions
  - Blockchain traceability
- Integrations:
  - Weather API
  - Market prices
  - Irrigation systems
  - Greenhouse automation

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 5.0.1 | 2026-04-20 | Pilot release - all essential docs |
| 5.0.0 | 2026-04-15 | Pilot release - core features |
| 4.0.0 | 2026-03-01 | Initial version |

---

## Upcoming Features

### Planned for v5.1.0
- OTA firmware updates
- Multi-language support (VN, EN)
- Mobile app
- Advanced analytics
- AI-based predictions

### Planned for v6.0.0
- Blockchain traceability
- Marketplace integration
- ERP connectors
- White-label options

---

*For more information, see [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md)*
*For detailed API documentation, see [API_REFERENCE.md](API_REFERENCE.md)*