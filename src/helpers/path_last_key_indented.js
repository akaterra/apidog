root = String.fromCharCode(255); // Symbol('root'),

module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  const pathKeys = input.split('.');

  if (pathKeys[0] === root) {
    pathKeys[0] = '';
  }

  return new handlebars.SafeString('&nbsp;&nbsp;'.repeat(pathKeys.length - 1) + pathKeys.pop());
};

