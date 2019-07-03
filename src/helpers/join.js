module.exports = (inputData) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  return new handlebars.SafeString(
    (Array.isArray(inputData)
      ? inputData
      : [inputData]).map((line) => line || '').join('\n')
  );
};
