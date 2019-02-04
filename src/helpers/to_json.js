const handlebars = require('handlebars');

module.exports = (inputData) => new handlebars.SafeString(JSON.stringify(inputData, void 0, 2));
