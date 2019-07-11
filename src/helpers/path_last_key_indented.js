module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  const pathKeys = input.split('.');

  return new handlebars.SafeString('&nbsp;&nbsp;'.repeat(pathKeys.length - 1) + pathKeys.pop());
};
