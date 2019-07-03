module.exports = (inputData) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(inputData.toString().replace('\n', '<br>'));
};
