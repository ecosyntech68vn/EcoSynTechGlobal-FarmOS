# EcoSynTech - Accurate Hardware Cost Analysis
## Tính toán chi phí sản xuất từ PCB BOM & Gerbers

---

## 1. PCB MAIN BOARD COST (V6.3)

Dựa trên BOM từ GitHub: https://github.com/ecosyntech68vn/EcoSynTech_PCB-for-IOT

### Electronics Components (bulk 100+)

| Component | Qty | Unit Price (VND) | Total (VND) |
|-----------|-----|------------------|-------------|
| **CORE** | | | |
| ESP32-WROOM-32E-N8 | 1 | 77,000 | 77,000 |
| ADS1115IDGSR (ADC) | 1 | 34,000 | 34,000 |
| MCP23017 (IO Expander) | 2 | 27,000 | 54,000 |
| CP2102 (USB-UART) | 1 | 12,000 | 12,000 |
| TPL5010 (Watchdog) | 1 | 12,000 | 12,000 |
| MP1584 (Buck Regulator) | 2 | 8,000 | 16,000 |
| **RELAY SYSTEM** | | | |
| SRD-05VDC-SL-C (Relay) | 8 | 7,000 | 56,000 |
| PC817 (Optocoupler) | 8 | 500 | 4,000 |
| S8050 (Transistor) | 8 | 1,000 | 8,000 |
| **PROTECTION** | | | |
| TVS Diodes | 15 | 2,000 | 30,000 |
| MOV/GDT | 5 | 5,000 | 25,000 |
| **PASSIVES** | | | |
| Resistors (~50 pcs) | 50 | 200 | 10,000 |
| Capacitors (~40 pcs) | 40 | 500 | 20,000 |
| Inductors | 5 | 5,000 | 25,000 |
| **CONNECTORS** | | | |
| Terminal Blocks | 20 | 3,000 | 60,000 |
| USB Micro-B | 1 | 8,000 | 8,000 |
| **LEDs** | 8 | 1,000 | 8,000 |
| **Subtotal Components** | | | **459,000** |

### PCB Manufacturing

| Item | Cost (VND) | Notes |
|------|------------|-------|
| PCB (200x150mm, 2L, ENIG) | 75,000 | JLCPCB/EasyEDA |
| Stencil | 15,000 | Solder paste |
| Assembly (SMT) | 150,000 | Full turnkey |
| **Subtotal Manufacturing** | | **240,000** |

### Total PCB Cost

| Category | Cost (VND) |
|----------|------------|
| Components | 459,000 |
| Manufacturing | 240,000 |
| **PCB TOTAL** | **699,000** |

---

## 2. SENSORS COST

### Onboard Sensors (Included on PCB)
| Sensor | Cost (VND) |
|--------|------------|
| DHT22 header | 0 (connector only) |
| DS18B20 header | 0 (connector only) |
| I2C header (BME280) | 0 (connector only) |

### External Sensors (Add-on)

| Sensor | Type | Cost (VND) | Notes |
|--------|------|------------|-------|
| **ST30 (DS18B20)** | Waterproof temp | 15,000 | 1-wire, outdoor |
| **DHT22** | Temp/Humidity | 35,000 | AM2302 |
| **BME280** | Temp/Hum/Pressure | 45,000 | I2C, precision |
| **Soil Moisture** | Capacitive | 25,000 | Analog output |
| **Light Sensor** | LDR | 5,000 | Analog |
| **pH Sensor** | Analog | 80,000 | For MAX/Premium |
| **EC Sensor** | Conductivity | 60,000 | For MAX/Premium |
| **Rain Sensor** | Modular | 15,000 | For MAX/Premium |

---

## 3. POWER SUPPLY & ENCLOSURE

| Item | Cost (VND) |
|------|------------|
| 12V 2A Power Adapter | 45,000 |
| Case (ABS/IP65) | 80,000 |
| Cable, wiring, installation | 30,000 |
| **Subtotal** | **155,000** |

---

## 4. FULL KIT COST BY TIER

### STARTER (Basic Monitoring)
| Item | Qty | Cost |
|------|-----|------|
| PCB Assembly | 1 | 699,000 |
| ST30 sensor | 1 | 15,000 |
| Soil Moisture | 1 | 25,000 |
| DHT22 | 1 | 35,000 |
| Power Supply | 1 | 45,000 |
| Case | 1 | 80,000 |
| Installation | 1 | 30,000 |
| **TOTAL COST** | | **929,000** |

### PRO (AI Enabled)
| Item | Qty | Cost |
|------|-----|------|
| PCB Assembly | 1 | 699,000 |
| ST30 sensor | 2 | 30,000 |
| DHT22 | 1 | 35,000 |
| Soil Moisture | 2 | 50,000 |
| Light Sensor | 1 | 5,000 |
| BME280 | 1 | 45,000 |
| Power Supply | 1 | 45,000 |
| Case | 1 | 80,000 |
| Installation | 1 | 50,000 |
| **TOTAL COST** | | **1,039,000** |

### MAX (Full Features)
| Item | Qty | Cost |
|------|-----|------|
| PCB Assembly | 1 | 699,000 |
| ST30 sensor | 3 | 45,000 |
| DHT22 | 2 | 70,000 |
| Soil Moisture | 3 | 75,000 |
| Light Sensor | 1 | 5,000 |
| BME280 | 1 | 45,000 |
| pH Sensor | 1 | 80,000 |
| EC Sensor | 1 | 60,000 |
| Rain Sensor | 1 | 15,000 |
| Power Supply | 1 | 55,000 |
| Case (larger) | 1 | 100,000 |
| Installation | 1 | 60,000 |
| **TOTAL COST** | | **1,309,000** |

### PREMIUM (Enterprise)
| Item | Qty | Cost |
|------|-----|------|
| PCB Assembly | 1 | 699,000 |
| ST30 sensor | 4 | 60,000 |
| DHT22 | 2 | 70,000 |
| Soil Moisture | 4 | 100,000 |
| Light Sensor | 2 | 10,000 |
| BME280 | 2 | 90,000 |
| pH Sensor | 1 | 80,000 |
| EC Sensor | 1 | 60,000 |
| Rain Sensor | 1 | 15,000 |
| Wind Sensor | 1 | 40,000 |
| CO2 Sensor | 1 | 100,000 |
| Power Supply | 1 | 65,000 |
| Case (IP67) | 1 | 120,000 |
| Installation | 1 | 80,000 |
| **TOTAL COST** | | **1,589,000** |

---

## 5. UPDATED PRICING (Accurate COGS)

### Pricing Matrix (Option C - with accurate costs)

| Tier | COGS | Sale Price | Margin | % |
|------|------|------------|--------|---|
| **Starter** | 929K | 1,699K | 770K | **45%** |
| **Pro** | 1,039K | 1,699K | 660K | **39%** |
| **Max** | 1,309K | 2,099K | 790K | **38%** |
| **Premium** | 1,589K | 2,799K | 1,210K | **43%** |

### Comparison: Old vs New COGS

| Tier | Old COGS (estimate) | New COGS (accurate) | Difference |
|------|---------------------|---------------------|------------|
| Starter | 810K | 929K | +119K |
| Pro | 1,100K | 1,039K | -61K |
| Max | 1,400K | 1,309K | -91K |
| Premium | 1,800K | 1,589K | -211K |

---

## 6. REVISED BREAK-EVEN (with accurate COGS)

### Year 1 Revenue per Customer

| Tier | Hardware | Sub Year 1 | Total Y1 | COGS | Gross | Margin % |
|------|----------|------------|----------|------|-------|----------|
| Starter | 1,699K | FREE | 1,699K | 929K | 770K | 45% |
| Pro | 1,699K | 1,188K | 2,887K | 1,039K | 1,848K | 64% |
| Max | 2,099K | 2,388K | 4,487K | 1,309K | 3,178K | 71% |
| Premium | 2,799K | 3,588K | 6,387K | 1,589K | 4,798K | 75% |

### Weighted Contribution (60% PRO, 25% MAX, 10% PREMIUM, 5% BASE)

```
PRO:  (99K - 30K) = 69K × 0.60 = 41,400
MAX:  (199K - 30K) = 169K × 0.25 = 42,250
PREMIUM: (299K - 30K) = 269K × 0.10 = 26,900
BASE: 0 × 0.05 = 0
────────────────────────────────────────────────
Weighted CM: 110,550 VND/customer/month
```

### Break-Even (unchanged)
```
Monthly BEP: 2,450,000 ÷ 110,550 = 22 customers
Annual BEP: 264 customers
```

---

## 7. KEY INSIGHTS

### Sensor Impact
- **Starter**: 929K COGS (basic sensors) - good margin
- **Pro**: 1,039K COGS (includes BME280) - slightly lower margin
- **Max/Premium**: More sensors = higher COGS but much higher revenue

### Recommendations

| Issue | Solution |
|-------|----------|
| Starter margin 45% | OK for market penetration |
| Pro margin 39% | Consider Pro+ tier (add more sensors) |
| BME280 is expensive (45K) | Use DHT22 (35K) for basic |

### Alternative: Simplify Starter
```
Starter v2 (lower cost):
- Remove BME280 (save 45K)
- Use only DHT22 + Soil + 1 ST30
- COGS: ~850K
- Price: 1,499K (margin: 76%)
```

---

## 8. FINAL PRICING RECOMMENDATION

### Adjusted Pricing (Accurate COGS)

| Tier | COGS | Sale Price | Margin | % | Notes |
|------|------|------------|--------|---|-------|
| **Starter** | 850K | 1,499K | 649K | 43% | Simplify |
| **Pro** | 1,039K | 1,699K | 660K | 39% | Keep |
| **Max** | 1,309K | 2,099K | 790K | 38% | Keep |
| **Premium** | 1,589K | 2,799K | 1,210K | 43% | Keep |

### Break-Even Impact
- Monthly BEP: 22 customers (same)
- Margin slightly lower but still healthy (38-43%)

---

**Document:** Hardware Cost Analysis V1.0
**Based on:** PCB BOM from GitHub + LCSC pricing 2025
**Date:** 2026-04-25