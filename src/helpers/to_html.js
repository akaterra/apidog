module.exports = (input) => {
  if (!input) {
    return undefined;
  }

  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;
  const content = input.toString().replace(/\n/g, '<br>');

  return content ? new handlebars.SafeString(content) : undefined;
};
