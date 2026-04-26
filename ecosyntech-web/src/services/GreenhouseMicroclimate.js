'use strict';

class GreenhouseMicroclimate {
  constructor() {
    this.states = ['COOL', 'OPTIMAL', 'HOT'];
    this.transitionMatrix = [
      [0.7, 0.25, 0.05],
      [0.2, 0.6, 0.2],
      [0.1, 0.3, 0.6]
    ];
    this.currentState = 'OPTIMAL';
    this.lastTemp = 25;
    this.lastHumidity = 70;
    this.tempHistory = [];
    this.humHistory = [];
  }

  update(outsideTemp, outsideHum, roofOpen, fanSpeed) {
    let state;
    if (this.lastTemp < 18) state = 'COOL';
    else if (this.lastTemp > 30) state = 'HOT';
    else state = 'OPTIMAL';

    this.currentState = state;

    let tempChange = 0;
    let humChange = 0;

    if (roofOpen) {
      tempChange += (outsideTemp - this.lastTemp) * 0.2;
      humChange += (outsideHum - this.lastHumidity) * 0.2;
    }

    if (fanSpeed > 0) {
      tempChange -= (this.lastTemp - outsideTemp) * 0.1 * (fanSpeed / 100);
      humChange -= 2 * (fanSpeed / 100);
    }

    this.lastTemp = Math.round((this.lastTemp + tempChange) * 10) / 10;
    this.lastHumidity = Math.min(100, Math.max(0, Math.round(this.lastHumidity + humChange)));

    this.tempHistory.push({ temp: this.lastTemp, timestamp: Date.now() });
    this.humHistory.push({ humidity: this.lastHumidity, timestamp: Date.now() });

    if (this.tempHistory.length > 100) this.tempHistory.shift();
    if (this.humHistory.length > 100) this.humHistory.shift();

    return {
      temp: this.lastTemp,
      humidity: this.lastHumidity,
      state: this.currentState,
      recommendation: this._getRecommendation(),
      timestamp: new Date().toISOString()
    };
  }

  _getRecommendation() {
    if (this.currentState === 'HOT' && this.lastHumidity < 50) {
      return { action: 'COOL_DOWN', message: 'Too hot and dry - activate misting' };
    }
    if (this.currentState === 'HOT') {
      return { action: 'VENTILATE', message: 'Too hot - open roof and run fans' };
    }
    if (this.currentState === 'COOL' && this.lastHumidity > 80) {
      return { action: 'VENTILATE', message: 'Cool and humid - reduce humidity' };
    }
    if (this.currentState === 'OPTIMAL') {
      return { action: 'MAINTAIN', message: 'Conditions optimal' };
    }
    return { action: 'MONITOR', message: 'Continue monitoring' };
  }

  predictNextHour(outsideTemp, outsideHum, roofOpen, fanSpeed) {
    const predictions = [];
    let temp = this.lastTemp;
    let hum = this.lastHumidity;

    for (let i = 0; i < 12; i++) {
      let tempChange = 0;
      let humChange = 0;

      if (roofOpen) {
        tempChange += (outsideTemp - temp) * 0.2;
        humChange += (outsideHum - hum) * 0.2;
      }

      if (fanSpeed > 0) {
        tempChange -= (temp - outsideTemp) * 0.1 * (fanSpeed / 100);
        humChange -= 2 * (fanSpeed / 100);
      }

      temp = Math.round((temp + tempChange) * 10) / 10;
      hum = Math.min(100, Math.max(0, Math.round(hum + humChange)));

      predictions.push({ temp, humidity: hum, minutes: (i + 1) * 5 });
    }

    return predictions;
  }

  getStats() {
    return {
      currentState: this.currentState,
      currentTemp: this.lastTemp,
      currentHumidity: this.lastHumidity,
      tempHistoryLength: this.tempHistory.length,
      humHistoryLength: this.humHistory.length
    };
  }

  reset() {
    this.currentState = 'OPTIMAL';
    this.lastTemp = 25;
    this.lastHumidity = 70;
    this.tempHistory = [];
    this.humHistory = [];
  }
}

module.exports = GreenhouseMicroclimate;