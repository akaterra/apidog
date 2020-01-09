const i18n = {
  en: {
    allVersions: 'All versions',
    compareTo: 'Compare to',
    connect: 'Connect',
    disconnect: 'Disconnect',
    errorResponse: 'Error response',
    hideHints: 'Hide hints',
    mainChapter: 'Main chapter',
    preset: 'Preset',
    response: 'Response',
    send: 'Send',
    sendSampleRequest: 'Send sample request',
    showHints: 'Show hints',
    variable: 'Variable',
  },
  ru: {
    allVersions: 'Все версии',
    connect: 'Подключиться',
    compareTo: 'Сравнить с',
    disconnect: 'Отключиться',
    errorResponse: 'Ошибочный ответ',
    hideHints: 'Свернуть',
    mainChapter: 'Основная глава',
    preset: 'Сохраненный запрос',
    response: 'Ответ',
    send: 'Отправить',
    sendSampleRequest: 'Отправить тестовый запрос',
    showHints: 'Развернуть',
    variable: 'Переменная',
  },
};

function _(loc, key) {
  return loc in i18n ? key in i18n[loc] ? i18n[loc][key] : key : key;
}

if (typeof module !== 'undefined') {
  module.exports = {
    _,
  }
}
