module.exports = {
  id: 'language-switcher',
  name: 'Language Switcher',
  triggers: ['event:language.change', 'route:/api/settings/language', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    const i18n = require('../../i18n');
    const requestedLang = ctx.event.language || ctx.event.lang || 'vi';
    const previousLang = i18n.getLanguage();
    
    const success = i18n.setLanguage(requestedLang);
    const newLang = i18n.getLanguage();
    
    const supported = i18n.getSupportedLanguages();
    
    return {
      ok: success,
      changed: previousLang !== newLang,
      previousLanguage: previousLang,
      currentLanguage: newLang,
      languageName: supported[newLang] ? supported[newLang].name : newLang,
      supportedLanguages: supported,
      timestamp: new Date().toISOString()
    };
  }
};