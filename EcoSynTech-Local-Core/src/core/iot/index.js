const iotEngine = require('./iot-engine');
const iotDashboard = require('./iot-dashboard');

module.exports = {
  ...iotEngine,
  ...iotDashboard
};