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
    compareTo: 'Сравнить с',
    connect: 'Подключиться',
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
  zh: {
    allVersions: '所有版本',
    compareTo: '相比于',
    connect: '连接',
    description: '描述',
    disconnect: '断开',
    errorResponse: '错误回应',
    field: '领域',
    header: '标头',
    headerExample: '标头示例',
    hideHints: '隐藏提示',
    mainChapter: '本章',
    name: '名称',
    parameter: '名称',
    parameterExample: '参数示例',
    parameterValue: '参数值',
    preset: 'Preset',
    response: '响应',
    send: '发送',
    sendSampleRequest: '发送样品申请',
    showHints: '显示提示',
    type: '类型',
    value: '值',
    variable: '变量',
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
