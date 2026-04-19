const fs = require('fs');
const path = require('path');

class StateStore {
  constructor(filePath = path.join(process.cwd(), 'data', 'ops-state.json')) {
    this.filePath = filePath;
    this.state = {
      beats: {},
      alerts: [],
      incidents: [],
      builds: [],
      approvals: [],
    };
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.state = JSON.parse(raw);
      }
    } catch (_) {}
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
    } catch (_) {}
  }

  get(key, fallback = null) {
    return Object.prototype.hasOwnProperty.call(this.state, key) ? this.state[key] : fallback;
  }

  set(key, value) {
    this.state[key] = value;
    this._save();
  }

  push(key, value, limit = 1000) {
    if (!Array.isArray(this.state[key])) this.state[key] = [];
    this.state[key].unshift(value);
    this.state[key] = this.state[key].slice(0, limit);
    this._save();
  }
}

module.exports = { StateStore };