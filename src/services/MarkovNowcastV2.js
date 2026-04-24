'use strict';

const fs = require('fs');
const path = require('path');
const KalmanFilter = require('./KalmanFilter');
const AdaptiveThresholds = require('./AdaptiveThresholds');

const WeatherState = Object.freeze({
  SUNNY: 'SUNNY',
  CLOUDY: 'CLOUDY',
  RAINY: 'RAINY'
});

const DEFAULT_CONFIG = {
  pressureLow: 1005,
  luxCloudy: 15000,
  confirmMinutes: 10,
  maxHistoryDays: 30,
  stateFile: path.join(__dirname, '..', 'data', 'markov_v2_state.json'),
  priorWeight: 0.7
};

class MarkovNowcastV2 {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.STATES = Object.values(WeatherState);
    this.transitionMatrix2 = {};
    
    const defaultRow = [0.6, 0.3, 0.1];
    for (const s1 of this.STATES) {
      for (const s2 of this.STATES) {
        const key = `${s1}|${s2}`;
        this.transitionMatrix2[key] = [...defaultRow];
      }
    }

    this.currentState = WeatherState.SUNNY;
    this.prevState = WeatherState.SUNNY;
    this.stateCounter = 0;
    this.transitionLog = [];

    this.kalmanPressure = new KalmanFilter(0.1, 0.02);
    this.kalmanLux = new KalmanFilter(200, 50);

    this.thresholds = new AdaptiveThresholds(this.config.pressureLow, this.config.luxCloudy);

    this.rainModel = { a: -0.5, b: 0.2, c: 500 };
    this.lastForecast = null;

    this._loadState();
  }

  _classifyState(pressure, lux, hour) {
    const { pressureLow, luxCloudy } = this.thresholds.get();
    if (pressure < pressureLow) return WeatherState.RAINY;
    const isNight = hour >= 18 || hour <= 5;
    if (isNight) {
      return pressure < 1008 ? WeatherState.CLOUDY : WeatherState.SUNNY;
    }
    return lux < luxCloudy ? WeatherState.CLOUDY : WeatherState.SUNNY;
  }

  update(pressureRaw, luxRaw, humidity, hour, externalRainProb = null) {
    const pressure = this.kalmanPressure.filter(pressureRaw);
    const lux = this.kalmanLux.filter(luxRaw);

    const detected = this._classifyState(pressure, lux, hour);

    if (detected === this.currentState) {
      this.stateCounter++;
    } else {
      if (this.stateCounter >= this.config.confirmMinutes) {
        this._recordTransition(this.prevState, this.currentState, detected);
        this.prevState = this.currentState;
        this.currentState = detected;
        this.stateCounter = 0;
      }
    }

    const key = `${this.prevState}|${this.currentState}`;
    const row = this.transitionMatrix2[key] || [0.6, 0.3, 0.1];
    const markovRainProb = row[2];

    let finalRainProb = markovRainProb;
    if (externalRainProb !== null && externalRainProb >= 0) {
      const prior = markovRainProb;
      const likelihood = externalRainProb / 100;
      const posterior = (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood) + 1e-6);
      finalRainProb = this.config.priorWeight * prior + (1 - this.config.priorWeight) * posterior;
    }

    let estimatedRainMM = 0;
    if (finalRainProb > 0.5) {
      estimatedRainMM = Math.max(0, this.rainModel.a * pressure + this.rainModel.b * humidity + this.rainModel.c);
      estimatedRainMM = Math.round(estimatedRainMM * 10) / 10;
    }

    this.lastForecast = {
      state: this.currentState,
      rainProbability: Math.round(finalRainProb * 100),
      estimatedRainMM,
      confidence: row[2] > 0.7 ? 'high' : 'medium',
      recommendation: finalRainProb > 0.6 ? 'DELAY_IRRIGATION' : 'IRRIGATE_AS_NEEDED',
      filteredValues: { pressure: Math.round(pressure * 10) / 10, lux: Math.round(lux) },
      timestamp: new Date().toISOString()
    };

    return this.lastForecast;
  }

  _recordTransition(prevPrev, prev, curr) {
    const key = `${prevPrev}|${prev}`;
    const entry = { key, to: curr, timestamp: new Date().toISOString() };
    this.transitionLog.push(entry);
    
    const cutoff = Date.now() - this.config.maxHistoryDays * 86400000;
    this.transitionLog = this.transitionLog.filter(e => new Date(e.timestamp).getTime() > cutoff);
    
    this._updateMatrix2();
    this._saveState();
  }

  _updateMatrix2() {
    const counts = {};
    for (const s1 of this.STATES) {
      for (const s2 of this.STATES) {
        const key = `${s1}|${s2}`;
        counts[key] = { SUNNY: 0, CLOUDY: 0, RAINY: 0 };
      }
    }
    for (const entry of this.transitionLog) {
      if (counts[entry.key]) {
        counts[entry.key][entry.to]++;
      }
    }
    for (const key in counts) {
      const c = counts[key];
      const total = c.SUNNY + c.CLOUDY + c.RAINY + 3;
      this.transitionMatrix2[key] = [
        (c.SUNNY + 1) / total,
        (c.CLOUDY + 1) / total,
        (c.RAINY + 1) / total
      ];
    }
  }

  onlineUpdate(pressure, humidity, actualRain) {
    if (this.lastForecast) {
      if (actualRain !== (this.lastForecast.state === 'RAINY')) {
        this.thresholds.update(pressure, 0, actualRain, this.lastForecast.state);
      }
      if (actualRain && this.lastForecast.estimatedRainMM > 0) {
        const realRain = 5;
        const error = realRain - this.lastForecast.estimatedRainMM;
        this.rainModel.a += 0.0001 * error * pressure;
        this.rainModel.b += 0.0001 * error * humidity;
        this.rainModel.c += 0.001 * error;
      }
    }
  }

  getForecast() {
    return this.lastForecast || {
      state: this.currentState,
      rainProbability: 0,
      estimatedRainMM: 0,
      confidence: 'low',
      recommendation: 'NO_DATA',
      timestamp: new Date().toISOString()
    };
  }

  _saveState() {
    try {
      const stateDir = path.dirname(this.config.stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      const state = {
        transitionMatrix2: this.transitionMatrix2,
        currentState: this.currentState,
        prevState: this.prevState,
        transitionLog: this.transitionLog.slice(-100),
        thresholds: this.thresholds.get(),
        rainModel: this.rainModel,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.config.stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
      console.warn('[MarkovV2] Cannot save state:', e.message);
    }
  }

  _loadState() {
    try {
      if (fs.existsSync(this.config.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.config.stateFile, 'utf8'));
        if (state.transitionMatrix2) {
          this.transitionMatrix2 = state.transitionMatrix2;
        }
        if (state.currentState) {
          this.currentState = state.currentState;
        }
        if (state.prevState) {
          this.prevState = state.prevState;
        }
        if (state.transitionLog) {
          this.transitionLog = state.transitionLog;
        }
        if (state.thresholds) {
          this.thresholds.pressureLow = state.thresholds.pressureLow;
          this.thresholds.luxCloudy = state.thresholds.luxCloudy;
        }
        if (state.rainModel) {
          this.rainModel = state.rainModel;
        }
      }
    } catch (e) {
      console.warn('[MarkovV2] Cannot load state:', e.message);
    }
  }

  getStatus() {
    return {
      currentState: this.currentState,
      prevState: this.prevState,
      stateCounter: this.stateCounter,
      thresholds: this.thresholds.get(),
      trainingSamples: this.transitionLog.length,
      rainModel: this.rainModel
    };
  }

  reset() {
    this.currentState = WeatherState.SUNNY;
    this.prevState = WeatherState.SUNNY;
    this.stateCounter = 0;
    this.transitionLog = [];
    this.kalmanPressure.reset();
    this.kalmanLux.reset();
    this.thresholds.reset();
    this._saveState();
  }
}

module.exports = MarkovNowcastV2;