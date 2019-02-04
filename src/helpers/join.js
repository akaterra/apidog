const handlebars = require('handlebars');

module.exports = (inputData) => new handlebars.SafeString(
  (Array.isArray(inputData)
    ? inputData
    : [inputData]).map((line) => line || '').join('\n')
);
