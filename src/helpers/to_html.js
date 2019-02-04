const handlebars = require('handlebars');

module.exports = (inputData) => new handlebars.SafeString(inputData.toString().replace('\n', '<br>'));
