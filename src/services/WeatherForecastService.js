'use strict';

const MarkovNowcastV2 = require('./MarkovNowcastV2');
const GreenhouseMicroclimate = require('./GreenhouseMicroclimate');

class WeatherForecastService {
  constructor() {
    this.markov = new MarkovNowcastV2();
    this.greenhouse = new GreenhouseMicroclimate();
    this.lastProcessed = null;
  }

  process(sensorData) {
    const outdoorForecast = this.markov.update(
      sensorData.pressure,
      sensorData.lux,
      sensorData.humidity,
      sensorData.hour,
      sensorData.externalRainProb
    );

    const indoorForecast = this.greenhouse.update(
      sensorData.outsideTemp,
      sensorData.outsideHum,
      sensorData.roofOpen,
      sensorData.fanSpeed
    );

    this.lastProcessed = {
      outdoor: outdoorForecast,
      indoor: indoorForecast,
      timestamp: new Date().toISOString()
    };

    return this.lastProcessed;
  }

  feedback(pressure, humidity, actualRain) {
    this.markov.onlineUpdate(pressure, humidity, actualRain);
  }

  getOutdoorForecast() {
    return this.markov.getForecast();
  }

  getGreenhouseForecast() {
    return this.greenhouse.getStats();
  }

  predictGreenhouse(outsideTemp, outsideHum, roofOpen, fanSpeed) {
    return this.greenhouse.predictNextHour(outsideTemp, outsideHum, roofOpen, fanSpeed);
  }

  getStatus() {
    return {
      markov: this.markov.getStatus(),
      greenhouse: this.greenhouse.getStats(),
      lastProcessed: this.lastProcessed?.timestamp
    };
  }

  reset() {
    this.markov.reset();
    this.greenhouse.reset();
  }
}

module.exports = new WeatherForecastService();