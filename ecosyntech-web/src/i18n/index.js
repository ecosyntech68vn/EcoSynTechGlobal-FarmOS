const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = {
  'vi': { name: 'Tiếng Việt', native: 'Tiếng Việt', code: 'vi' },
  'en': { name: 'English', native: 'English', code: 'en' },
  'zh': { name: '中文', native: 'Chinese', code: 'zh' }
};

const DEFAULT_LANGUAGE = 'vi';

const translationCache = {};
let currentLanguage = DEFAULT_LANGUAGE;

function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES[lang]) {
    currentLanguage = lang;
    return true;
  }
  return false;
}

function getLanguage() {
  return currentLanguage;
}

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

function t(key, params) {
  const lang = currentLanguage;
  let translations = translationCache[lang] || {};
  let text = translations[key] || key;

  if (!text || text === key) {
    if (lang !== DEFAULT_LANGUAGE) {
      translations = translationCache[DEFAULT_LANGUAGE] || {};
      text = translations[key] || key;
    }
  }

  if (params) {
    for (const p in params) {
      text = text.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
    }
  }

  return text;
}

function tArray(key, count) {
  if (count === 1) {
    return t(key + '.one', {});
  } else if (count >= 2 && count <= 4) {
    return t(key + '.few', { count: count });
  } else {
    return t(key + '.many', { count: count });
  }
}

function loadTranslations(lang, dir) {
  if (!dir) {
    dir = path.join(process.cwd(), 'src', 'i18n');
  }

  const filePath = path.join(dir, lang + '.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      translationCache[lang] = JSON.parse(content);
      return true;
    }
  } catch (err) {
    console.error('[i18n] Failed to load ' + lang + ':', err.message);
  }
  return false;
}

function loadAllTranslations() {
  for (const lang in SUPPORTED_LANGUAGES) {
    loadTranslations(lang);
  }
}

function detectLanguage(acceptHeader) {
  if (!acceptHeader) return DEFAULT_LANGUAGE;

  const langs = acceptHeader.split(',');
  for (let i = 0; i < langs.length; i++) {
    const lang = langs[i].split(';')[0].trim().toLowerCase();
    if (lang.indexOf('vi') !== -1) return 'vi';
    if (lang.indexOf('en') !== -1) return 'en';
    if (lang.indexOf('zh') !== -1 || lang.indexOf('cn') !== -1) return 'zh';
  }

  return DEFAULT_LANGUAGE;
}

module.exports = {
  setLanguage: setLanguage,
  getLanguage: getLanguage,
  getSupportedLanguages: getSupportedLanguages,
  t: t,
  tArray: tArray,
  loadTranslations: loadTranslations,
  loadAllTranslations: loadAllTranslations,
  detectLanguage: detectLanguage,
  DEFAULT_LANGUAGE: DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES
};