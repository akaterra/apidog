{{> i18n.js }}

const rtl = {
  he: true,
};

function getRtl(loc) {
  return rtl[loc] || false;
}

function _(loc, key) {
  return loc in translations
    ? key in translations[loc]
      ? translations[loc][key]
      : loc !== 'en'
        ? _('en', key)
        : key
    : loc !== 'en'
      ? _('en', key)
      : key;
}

if (typeof module !== 'undefined') {
  module.exports = {
    getRtl,
    _,
  }
}
