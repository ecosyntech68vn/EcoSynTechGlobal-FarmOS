module.exports = {
  id: 'language-switcher',
  name: 'Language Switcher',
  triggers: ['event:language.change', 'route:/api/settings/language', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var i18n = require('../../i18n');
    var requestedLang = ctx.event.language || ctx.event.lang || 'vi';
    var previousLang = i18n.getLanguage();
    
    var success = i18n.setLanguage(requestedLang);
    var newLang = i18n.getLanguage();
    
    var supported = i18n.getSupportedLanguages();
    
    return {
      ok: success,
      changed: previousLang !== newLang,
      previousLanguage: previousLang,
      currentLanguage: newLang,
      languageName: supported[newLang] ? supported[newLang].name : newLang,
      supportedLanguages: supported,
      timestamp: new Date().toISOString(),
    };
  },
};