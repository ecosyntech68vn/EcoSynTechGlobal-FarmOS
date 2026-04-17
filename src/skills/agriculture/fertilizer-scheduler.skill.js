module.exports = {
  id: 'fertilizer-scheduler',
  name: 'Fertilizer Scheduler',
  triggers: ['event:crop-update', 'cron:*/24h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var schedule = stateStore.get('fertilizerSchedule') || [];
    
    var cropId = ctx.event.cropId || ctx.event.crop || 'default';
    var dayOfGrowth = ctx.event.day || 1;
    var cropType = ctx.event.cropType || 'general';
    
    var schedules = {
      'general': [7, 14, 21, 28],
      'rice': [15, 30, 45, 60],
      'vegetable': [7, 14, 21],
      'fruit': [30, 60, 90, 120],
      'coffee': [30, 60, 90],
    };
    
    var days = schedules[cropType] || schedules.general;
    var nextFertilize = null;
    
    for (var i = 0; i < days.length; i++) {
      if (days[i] >= dayOfGrowth) {
        nextFertilize = days[i];
        break;
      }
    }
    
    var daysUntilNext = nextFertilize ? nextFertilize - dayOfGrowth : null;
    var shouldFertilize = daysUntilNext === 0 || daysUntilNext === 1;
    
    var fertilizerType = 'NPK';
    if (cropType === 'vegetable') fertilizerType = 'nitrogen-rich';
    else if (cropType === 'fruit') fertilizerType = 'phosphorus-rich';
    else if (cropType === 'rice') fertilizerType = 'urea';
    
    var recommendation = '';
    if (shouldFertilize) {
      recommendation = 'FERTILIZE TODAY - Day ' + dayOfGrowth;
    } else if (daysUntilNext !== null) {
      recommendation = 'Next fertilizer in ' + daysUntilNext + ' days (Day ' + nextFertilize + ')';
    } else {
      recommendation = 'Growth complete - no more fertilizer needed';
    }
    
    return {
      ok: true,
      cropId: cropId,
      currentDay: dayOfGrowth,
      nextFertilizeDay: nextFertilize,
      daysUntilNext: daysUntilNext,
      shouldFertilize: shouldFertilize,
      fertilizerType: fertilizerType,
      schedule: days,
      recommendation: recommendation,
      timestamp: new Date().toISOString(),
    };
  },
};