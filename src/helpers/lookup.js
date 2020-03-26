module.exports = (obj, ...args) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  for (let i = 0; i < args.length - 1; i += 1) {
    if (!obj) {
      break;
    }

    obj = obj[args[i]];
  }

  return obj ? (typeof obj === 'string' ? new handlebars.SafeString(obj) : obj) : undefined;
};
