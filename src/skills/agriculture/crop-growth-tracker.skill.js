module.exports = {
  id: 'crop-growth-tracker',
  name: 'Crop Growth Tracker',
  triggers: ['event:sensor-update', 'cron:*/6h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var cropData = stateStore.get('cropData') || {};
    
    var cropId = ctx.event.cropId || ctx.event.crop || 'default';
    var dayOfGrowth = ctx.event.day || cropData.day || 1;
    var stage = 'germination';
    var nextStage = 'seedling';
    var daysToNext = 7;
    
    if (dayOfGrowth <= 7) {
      stage = 'germination';
      nextStage = 'seedling';
      daysToNext = 7 - dayOfGrowth;
    } else if (dayOfGrowth <= 21) {
      stage = 'seedling';
      nextStage = 'vegetative';
      daysToNext = 21 - dayOfGrowth;
    } else if (dayOfGrowth <= 45) {
      stage = 'vegetative';
      nextStage = 'flowering';
      daysToNext = 45 - dayOfGrowth;
    } else if (dayOfGrowth <= 60) {
      stage = 'flowering';
      nextStage = 'fruiting';
      daysToNext = 60 - dayOfGrowth;
    } else {
      stage = 'fruiting';
      nextStage = 'harvest';
      daysToNext = 0;
    }
    
    var stageDays = {
      'germination': { water: 'low', fertilizer: 'none', light: 'indirect' },
      'seedling': { water: 'medium', fertilizer: 'low', light: 'partial' },
      'vegetative': { water: 'high', fertilizer: 'medium', light: 'full' },
      'flowering': { water: 'high', fertilizer: 'high', light: 'full' },
      'fruiting': { water: 'high', fertilizer: 'high', light: 'full' },
      'harvest': { water: 'low', fertilizer: 'none', light: 'any' },
    };
    
    var requirements = stageDays[stage];
    
    cropData[cropId] = {
      day: dayOfGrowth,
      stage: stage,
      nextStage: nextStage,
      daysToNext: daysToNext,
      lastUpdate: Date.now(),
    };
    stateStore.set('cropData', cropData);
    
    return {
      ok: true,
      cropId: cropId,
      dayOfGrowth: dayOfGrowth,
      stage: stage,
      nextStage: nextStage,
      daysToNextStage: daysToNext,
      requirements: requirements,
      timestamp: new Date().toISOString(),
    };
  },
};