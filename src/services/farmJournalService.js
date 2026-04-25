/**
 * Farm Journal Service - Daily Agricultural Logging
 * 
 * Integrates data from:
 * - Sensors (temp, humidity, soil, light)
 * - Devices (irrigation, fertigation)
 * - Weather (manual + AI forecast)
 * - Manual entries (photos, notes)
 * - Activities (planting, harvest, fertilizing)
 * 
 * Creates Batch for traceability
 */

const fs = require('fs');
const path = require('path');

class FarmJournalService {
  constructor() {
    this.journals = new Map(); // date (YYYY-MM-DD) -> journal entries
    this.batches = new Map(); // batchId -> batch data
  }

  // Generate batch ID: BATCH-YYYYMMDD-X
  generateBatchId(date = new Date()) {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `BATCH-${dateStr}-${seq}`;
  }

  // Create journal entry from sensor data
  async createSensorEntry(farmId, sensorData) {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'sensor_reading',
      source: 'iot_sensors',
      farmId,
      data: sensorData,
      metrics: {
        temp: sensorData.temperature,
        humidity: sensorData.humidity,
        soilMoisture: sensorData.soil_moisture,
        light: sensorData.light,
        soilTemp: sensorData.soil_temperature
      },
      notes: ''
    };

    await this.addEntry(farmId, entry);
    return entry;
  }

  // Create entry from irrigation device
  async createIrrigationEntry(farmId, irrigationData) {
    const now = new Date();
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'irrigation',
      source: 'device',
      farmId,
      deviceId: irrigationData.device_id,
      data: irrigationData,
      metrics: {
        waterUsedLiters: irrigationData.water_amount || 0,
        durationMinutes: irrigationData.duration || 0,
        zone: irrigationData.zone
      },
      notes: irrigationData.notes || ''
    };

    await this.addEntry(farmId, entry);
    return entry;
  }

  // Create fertilizer batch (PHÂN BÓN)
  async createFertilizerBatch(farmId, batchData) {
    const now = new Date();
    const batchId = this.generateBatchId(now);
    
    // Create batch from multiple sources
    const batch = {
      batchId,
      timestamp: now.toISOString(),
      type: 'fertilizer_application',
      farmId,
      source: batchData.source || 'manual', // sensor_ai, manual, device
      materials: batchData.materials || [],
      application: {
        method: batchData.method || 'foliar', // root, foliar, drip
        timing: batchData.timing || 'morning',
        weatherCondition: batchData.weatherCondition || 'sunny'
      },
      relatedEntries: batchData.relatedEntries || [],
      area: batchData.area, // m2
      crop: batchData.crop,
      stage: batchData.stage, // gieo_hat, sinh_truong, sung_trien, thanh_thao
      expectedHarvest: batchData.expectedHarvest,
      notes: batchData.notes || '',
      status: 'scheduled', // scheduled, applied, completed
      appliedAt: null,
      createdBy: batchData.userId
    };

    // Store batch
    this.batches.set(batchId, batch);

    // Add to journal as entry
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'fertilizer_batch',
      source: batchData.source || 'manual',
      farmId,
      batchId,
      data: batch,
      materials: batch.materials,
      metrics: {
        totalNitrogen: batchData.materials?.reduce((sum, m) => sum + (m.n || 0), 0) || 0,
        totalPhosphorus: batchData.materials?.reduce((sum, m) => sum + (m.p || 0), 0) || 0,
        totalPotassium: batchData.materials?.reduce((sum, m) => sum + (m.k || 0), 0) || 0
      },
      notes: batchData.notes
    };

    await this.addEntry(farmId, entry);
    
    return { batch, entry };
  }

  // Create manual entry (notes, photos)
  async createManualEntry(farmId, data) {
    const now = new Date();
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'manual',
      source: 'manual',
      farmId,
      activity: data.activity, // planting, harvesting, fertilizing, spraying, pruning
      data: data,
      photos: data.photos || [],
      notes: data.notes || '',
      weatherManual: data.weather || null,
      temperature: data.temperature,
      humidity: data.humidity
    };

    await this.addEntry(farmId, entry);
    return entry;
  }

  // Create activity entry (planting, harvest, etc)
  async createActivityEntry(farmId, activityData) {
    const now = new Date();
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'activity',
      source: 'manual',
      farmId,
      activity: activityData.activity, // gieo_hat, thu_hoach, bon_dat, phun_thuoc, cat_tia
      data: activityData,
      metrics: {
        quantityKg: activityData.quantity,
        areaM2: activityData.area,
        workers: activityData.workers
      },
      notes: activityData.notes || ''
    };

    await this.addEntry(farmId, entry);
    return entry;
  }

  // Add weather data entry
  async createWeatherEntry(farmId, weatherData) {
    const now = new Date();
    const entry = {
      id: `JE-${now.getTime()}`,
      timestamp: now.toISOString(),
      type: 'weather',
      source: weatherData.source || 'api', // api, manual, ai_forecast
      farmId,
      data: weatherData,
      metrics: {
        temp: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
        windSpeed: weatherData.wind_speed
      },
      notes: weatherData.notes || ''
    };

    await this.addEntry(farmId, entry);
    return entry;
  }

  // Internal: add entry to journal
  async addEntry(farmId, entry) {
    const dateKey = entry.timestamp.slice(0, 10);
    const key = `${farmId}_${dateKey}`;
    
    if (!this.journals.has(key)) {
      this.journals.set(key, []);
    }
    
    const entries = this.journals.get(key);
    entries.push(entry);
    this.journals.set(key, entries);
    
    return entry;
  }

  // Get journal for date range
  async getJournal(farmId, startDate, endDate) {
    const entries = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = `${farmId}_${d.toISOString().slice(0, 10)}`;
      if (this.journals.has(dateKey)) {
        entries.push(...this.journals.get(dateKey));
      }
    }
    
    // Sort by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return entries;
  }

  // Get batch by ID
  getBatch(batchId) {
    return this.batches.get(batchId) || null;
  }

  // Get all batches for farm
  getBatches(farmId, limit = 50) {
    const farmBatches = [];
    for (const batch of this.batches.values()) {
      if (batch.farmId === farmId) {
        farmBatches.push(batch);
      }
    }
    return farmBatches.slice(0, limit);
  }

  // Update batch status
  updateBatchStatus(batchId, status, appliedAt = null) {
    const batch = this.batches.get(batchId);
    if (batch) {
      batch.status = status;
      if (appliedAt) batch.appliedAt = appliedAt;
      if (status === 'completed') batch.completedAt = new Date().toISOString();
      this.batches.set(batchId, batch);
    }
    return batch;
  }

  // Get timeline for traceability
  async getTimeline(farmId, startDate, endDate) {
    const journals = await this.getJournal(farmId, startDate, endDate);
    
    const timeline = journals.map(entry => ({
      timestamp: entry.timestamp,
      type: entry.type,
      source: entry.source,
      activity: entry.activity || entry.type,
      notes: entry.notes,
      metrics: entry.metrics,
      data: entry.data
    }));

    return timeline;
  }

  // Get summary for dashboard
  async getSummary(farmId, days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const entries = await this.getJournal(farmId, startDate, endDate);
    
    const summary = {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalEntries: entries.length,
      byType: {},
      bySource: {},
      sensors: [],
      activities: [],
      batches: []
    };

    for (const entry of entries) {
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
      summary.bySource[entry.source] = (summary.bySource[entry.source] || 0) + 1;
      
      if (entry.type === 'sensor_reading') {
        summary.sensors.push(entry.metrics);
      }
      if (entry.type === 'activity') {
        summary.activities.push(entry.activity);
      }
      if (entry.type === 'fertilizer_batch') {
        summary.batches.push(entry.batchId);
      }
    }

    return summary;
  }

  // Export for traceability
  async exportTraceability(farmId, cropId) {
    // Get all batches for this crop
    const cropBatches = [];
    for (const batch of this.batches.values()) {
      if (batch.farmId === farmId && batch.crop === cropId) {
        // Get timeline entries around this batch
        const batchDate = new Date(batch.timestamp);
        const start = new Date(batchDate);
        start.setDate(start.getDate() - 7);
        const end = new Date(batchDate);
        end.setDate(end.getDate() + 7);
        
        const timeline = await this.getTimeline(farmId, start, end);
        
        cropBatches.push({
          batch,
          timeline: timeline.filter(e => 
            new Date(e.timestamp) >= start && new Date(e.timestamp) <= end
          )
        });
      }
    }

    return cropBatches;
  }
}

module.exports = new FarmJournalService();