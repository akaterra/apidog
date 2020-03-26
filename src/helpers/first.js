module.exports = (...args) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  for (let i = 0; i < args.length - 1; i += 1) {
    if (args[i]) {
      return typeof args[i] === 'string' ? new handlebars.SafeString(args[i]) : args[i];
    }
  }

  return null;
};
