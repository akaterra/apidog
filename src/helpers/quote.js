module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(input.toString().replace(/`/g, '\\`').replace(/\${/g, '\\${'));
};
