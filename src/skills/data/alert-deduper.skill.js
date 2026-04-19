module.exports = {
  id: 'alert-deduper',
  name: 'Alert Deduper',
  description: 'Deduplicate similar alerts',
  version: '2.3.2',

  process: function(context) {
    return { processed: true, deduplicated: 0 };
  }
};