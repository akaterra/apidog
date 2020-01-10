const rtl = {
  he: true,
};
const translations = {
  en: {
    allVersions: 'All versions',
    compareTo: 'Compare to',
    connect: 'Connect',
    description: 'Description',
    disconnect: 'Disconnect',
    errorResponse: 'Error response',
    field: 'Field',
    header: 'Header',
    headerExample: 'Header example',
    hideHints: 'Hide hints',
    mainChapter: 'Main chapter',
    name: 'Name',
    parameter: 'Parameter',
    parameterExample: 'Parameter example',
    parameterValue: 'Parameter value',
    preset: 'Preset',
    response: 'Response',
    send: 'Send',
    sendSampleRequest: 'Send sample request',
    showHints: 'Show hints',
    type: 'Type',
    value: 'Value',
    variable: 'Variable',
  },
  he: {
    allVersions: 'כל הגרסאות',
    compareTo: '-השווה ל',
    connect: 'התחבר',
    description: 'תיאור',
    disconnect: 'להתנתק',
    errorResponse: 'תגובת שגיאה',
    field: 'שדה',
    header: 'כותרת',
    headerExample: 'דוגמה לכותרת',
    hideHints: 'הסתר רמזים',
    mainChapter: 'פרק ראשי',
    name: 'שם',
    parameter: 'פרמטר',
    parameterExample: 'דוגמא לפרמטרים',
    parameterValue: 'ערך פרמטר',
    preset: 'Preset',
    response: 'תגובה',
    send: 'שלח',
    sendSampleRequest: 'שלח קריאת דוגמא',
    showHints: 'הצג רמזים',
    type: 'סוג',
    value: 'ערך',
    variable: 'משתנה',
  },
  ru: {
    allVersions: 'Все версии',
    connect: 'Подключиться',
    compareTo: 'Сравнить с',
    description: 'Описание',
    disconnect: 'Отключиться',
    errorResponse: 'Ошибочный ответ',
    field: 'Поле',
    header: 'Заголовок',
    headerExample: 'Пример заголовков',
    hideHints: 'Свернуть',
    mainChapter: 'Основная глава',
    name: 'Имя',
    parameter: 'Параметр',
    parameterExample: 'Пример параметров',
    parameterValue: 'Значение параметра',
    preset: 'Сохраненный запрос',
    response: 'Ответ',
    send: 'Отправить',
    sendSampleRequest: 'Отправить тестовый запрос',
    showHints: 'Развернуть',
    type: 'Тип',
    value: 'Значение',
    variable: 'Переменная',
  },
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
