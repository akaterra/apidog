module.exports = (input) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(
    (Array.isArray(input)
      ? input
      : [input]).map((line) => line || '').join(',')
  );
};
