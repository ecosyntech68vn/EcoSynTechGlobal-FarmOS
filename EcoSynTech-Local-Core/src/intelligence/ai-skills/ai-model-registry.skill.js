/**
 * AI Model Registry - Quản lý tất cả AI Models
 * Register và quản lý các lightweight AI models
 * 
 * Models được hỗ trợ:
 * - Plant Disease: MobileNetV3-Small (2.5M params)
 * - Weed Detection: TinyWeedNet (0.48M params)
 * - Pest Detection: YOLOv8n (1.9M params)
 * - Weather: Custom LSTM
 * - Anomaly: Custom Autoencoder
 */

const fs = require('fs');
const path = require('path');

class AIModelRegistrySkill {
  static name = 'ai-model-registry';
  static description = 'Registry quản lý tất cả AI models';

  constructor() {
    this.version = '1.0.0';
    this.models = this.initializeRegistry();
  }

  initializeRegistry() {
    return {
      'plant-disease': {
        id: 'plant-disease',
        name: 'Plant Disease Detector',
        model: 'mobilenetv3-small',
        type: 'classification',
        framework: 'TensorFlow Lite',
        parameters: '2.5M',
        accuracy: '99.5%',
        inferenceTime: '<15ms ESP32',
        ram: '1.1MB',
        dataset: 'PlantVillage',
        classes: 14,
        status: 'available',
        endpoint: process.env.PLANT_DISEASE_API || null
      },
      'weed-identifier': {
        id: 'weed-identifier',
        name: 'Weed Identifier',
        model: 'tinyweednet',
        type: 'detection',
        framework: 'PyTorch/TensorRT',
        parameters: '0.48M',
        accuracy: '97.26%',
        inferenceTime: '<90ms STM32',
        ram: '256KB',
        dataset: 'DeepWeeds',
        classes: 12,
        status: 'available',
        endpoint: process.env.WEED_DETECTION_API || null
      },
      'pest-detector': {
        id: 'pest-detector',
        name: 'Pest Detector',
        model: 'yolov8n',
        type: 'detection',
        framework: 'Ultralytics',
        parameters: '1.9M',
        accuracy: '85.9% mAP',
        inferenceTime: '<30ms Jetson',
        ram: '4MB',
        dataset: 'Custom',
        classes: 12,
        status: 'available',
        endpoint: process.env.PEST_DETECTION_API || null
      },
      'weather-forecast': {
        id: 'weather-forecast',
        name: 'Weather Forecasting',
        model: 'lstm-weather',
        type: 'forecasting',
        framework: 'Keras',
        parameters: '150K',
        accuracy: '92%',
        inferenceTime: '<50ms',
        ram: '2MB',
        dataset: 'Historical weather',
        classes: null,
        status: 'available',
        endpoint: process.env.WEATHER_API || null
      },
      'anomaly-detector': {
        id: 'anomaly-detector',
        name: 'Anomaly Detection',
        model: 'autoencoder',
        type: 'anomaly',
        framework: 'TensorFlow',
        parameters: '85K',
        accuracy: '94%',
        inferenceTime: '<20ms',
        ram: '1MB',
        dataset: 'Sensor baseline',
        classes: null,
        status: 'available',
        endpoint: null
      },
      'crop-quality': {
        id: 'crop-quality',
        name: 'Crop Quality Sorter',
        model: 'mobilenetv2',
        type: 'classification',
        framework: 'TensorFlow Lite',
        parameters: '3.4M',
        accuracy: '96%',
        inferenceTime: '<25ms Raspberry Pi',
        ram: '5MB',
        dataset: 'Quality dataset',
        classes: 5,
        status: 'coming_soon',
        endpoint: null
      },
      'tomato-disease': {
        id: 'tomato-disease',
        name: 'Tomato Disease CNN',
        model: 'tomato-cnn',
        type: 'classification',
        framework: 'TensorFlow Lite',
        parameters: '1.1M',
        accuracy: '94.6%',
        inferenceTime: '<15ms ESP32-S3',
        ram: '1.1MB',
        dataset: 'PlantVillage (Tomato)',
        classes: 10,
        status: 'available',
        endpoint: null
      }
    };
  }

  async execute(context) {
    const { action = 'list', modelId = null, ...params } = context;

    switch (action) {
    case 'list':
      return this.listModels(params);
    case 'info':
      return this.getModelInfo(modelId);
    case 'register':
      return this.registerModel(params);
    case 'status':
      return this.checkStatus(modelId);
    case 'test':
      return this.testModel(modelId, params);
    default:
      return this.listModels({});
    }
  }

  listModels(params) {
    const { type = null, status = null, framework = null } = params;
    
    let models = Object.values(this.models);
    
    if (type) {
      models = models.filter(m => m.type === type);
    }
    if (status) {
      models = models.filter(m => m.status === status);
    }
    if (framework) {
      models = models.filter(m => m.framework.toLowerCase().includes(framework.toLowerCase()));
    }

    return {
      success: true,
      total: models.length,
      filters: { type, status, framework },
      models: models.map(m => ({
        id: m.id,
        name: m.name,
        model: m.model,
        type: m.type,
        status: m.status,
        stats: {
          parameters: m.parameters,
          accuracy: m.accuracy,
          inferenceTime: m.inferenceTime
        }
      }))
    };
  }

  getModelInfo(modelId) {
    const model = this.models[modelId];
    
    if (!model) {
      return { success: false, error: `Model ${modelId} không tồn tại` };
    }

    return {
      success: true,
      model: model
    };
  }

  registerModel(params) {
    const { id, name, model, type, framework, endpoint } = params;
    
    if (!id || !name || !model) {
      return { success: false, error: 'Thiếu thông tin bắt buộc (id, name, model)' };
    }

    this.models[id] = {
      id,
      name,
      model,
      type: type || 'classification',
      framework: framework || 'Unknown',
      parameters: params.parameters || 'N/A',
      accuracy: params.accuracy || 'N/A',
      inferenceTime: params.inferenceTime || 'N/A',
      ram: params.ram || 'N/A',
      dataset: params.dataset || 'Custom',
      classes: params.classes || null,
      status: 'available',
      endpoint: endpoint || null,
      registeredAt: new Date().toISOString()
    };

    return {
      success: true,
      message: `Model ${id} đã được đăng ký`,
      model: this.models[id]
    };
  }

  checkStatus(modelId) {
    const model = this.models[modelId];
    
    if (!model) {
      return { success: false, error: `Model ${modelId} không tồn tại` };
    }

    const checks = {
      modelRegistered: true,
      endpointAvailable: !!model.endpoint,
      frameworkSupported: true,
      statusActive: model.status === 'available'
    };

    const allPassed = Object.values(checks).every(v => v === true);

    return {
      success: true,
      modelId: modelId,
      status: allPassed ? 'healthy' : 'degraded',
      checks: checks,
      timestamp: new Date().toISOString()
    };
  }

  async testModel(modelId, params) {
    const model = this.models[modelId];
    
    if (!model) {
      return { success: false, error: `Model ${modelId} không tồn tại` };
    }

    return {
      success: true,
      modelId: modelId,
      testResult: 'passed',
      latency: model.inferenceTime,
      note: 'Test thành công (simulation mode)',
      timestamp: new Date().toISOString()
    };
  }

  getStats() {
    const models = Object.values(this.models);
    
    return {
      totalModels: models.length,
      available: models.filter(m => m.status === 'available').length,
      comingSoon: models.filter(m => m.status === 'coming_soon').length,
      byType: {
        classification: models.filter(m => m.type === 'classification').length,
        detection: models.filter(m => m.type === 'detection').length,
        forecasting: models.filter(m => m.type === 'forecasting').length,
        anomaly: models.filter(m => m.type === 'anomaly').length
      },
      byFramework: models.reduce((acc, m) => {
        acc[m.framework] = (acc[m.framework] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = AIModelRegistrySkill;

if (require.main === module) {
  const registry = new AIModelRegistrySkill();
  
  (async () => {
    const list = await registry.execute({ action: 'list' });
    const stats = registry.getStats();
    
    console.log('\n' + '='.repeat(50));
    console.log('🤖 AI MODEL REGISTRY');
    console.log('='.repeat(50));
    console.log(`\n📊 Total Models: ${stats.totalModels}`);
    console.log(`   Available: ${stats.available}`);
    console.log(`   Coming Soon: ${stats.comingSoon}`);
    console.log('\n📈 By Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    console.log('\n📋 Available Models:');
    list.models.forEach(m => {
      console.log(`   - ${m.id}: ${m.name} (${m.model})`);
    });
    console.log('\n' + '='.repeat(50));
  })();
}