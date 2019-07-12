module.exports = (obj, ...args) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  for (let i = 0; i < args.length - 1; i += 1) {
    obj = obj[args[i]];

    if (!obj) {
      break;
    }
  }

  return obj && new handlebars.SafeString(obj);
};
