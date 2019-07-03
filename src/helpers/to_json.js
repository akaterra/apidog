module.exports = (inputData) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(JSON.stringify(inputData, void 0, 2));
};
