module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;
  const showdown = typeof require === 'function' ? require('node_modules/showdown') : window.showdown;

  return new handlebars.SafeString(new showdown.Converter().makeHtml(`<div class="markdown">${input.toString()}</div>`));
};
