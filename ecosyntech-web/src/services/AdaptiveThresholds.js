'use strict';

class AdaptiveThresholds {
  constructor(initialPressureLow = 1005, initialLuxCloudy = 15000, learningRate = 0.01) {
    this.pressureLow = initialPressureLow;
    this.luxCloudy = initialLuxCloudy;
    this.lr = learningRate;
    this.trainingHistory = [];
  }

  update(pressure, lux, actualRain, predictedState) {
    if (actualRain && predictedState !== 'RAINY') {
      this.pressureLow += this.lr * (pressure - this.pressureLow);
      this.luxCloudy -= this.lr * (lux - this.luxCloudy);
    } else if (!actualRain && predictedState === 'RAINY') {
      this.pressureLow -= this.lr * (pressure - this.pressureLow);
      this.luxCloudy += this.lr * (lux - this.luxCloudy);
    }

    this.pressureLow = Math.max(990, Math.min(1020, this.pressureLow));
    this.luxCloudy = Math.max(5000, Math.min(40000, this.luxCloudy));

    this.trainingHistory.push({
      pressure,
      lux,
      actualRain,
      predictedState,
      timestamp: Date.now()
    });

    if (this.trainingHistory.length > 1000) {
      this.trainingHistory.shift();
    }
  }

  get() {
    return {
      pressureLow: Math.round(this.pressureLow * 10) / 10,
      luxCloudy: Math.round(this.luxCloudy)
    };
  }

  getStats() {
    return {
      currentThresholds: this.get(),
      trainingSamples: this.trainingHistory.length,
      learningRate: this.lr
    };
  }

  reset() {
    this.pressureLow = 1005;
    this.luxCloudy = 15000;
    this.trainingHistory = [];
  }
}

module.exports = AdaptiveThresholds;