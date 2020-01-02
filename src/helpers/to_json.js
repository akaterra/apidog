module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(JSON.stringify(input, undefined, 2));
};
