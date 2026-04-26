const EventEmitter = require('events');

class IncidentBus extends EventEmitter {
  emitAlert(alert) {
    this.emit('alert', alert);
  }

  emitIncident(incident) {
    this.emit('incident', incident);
  }

  emitAction(action) {
    this.emit('action', action);
  }
}

module.exports = { IncidentBus };