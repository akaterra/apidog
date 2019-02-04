const handlebars = require('handlebars');

module.exports = (inputData) => {
  const pathKeys = inputData.split('.');

  return new handlebars.SafeString('&nbsp;&nbsp;'.repeat(pathKeys.length - 1) + pathKeys.pop());
};
