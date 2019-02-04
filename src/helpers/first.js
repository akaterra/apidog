const handlebars = require('handlebars');

module.exports = (...args) => {
  for (let i = 0; i < args.length - 1; i += 1) {
    if (args[i]) {
      return new handlebars.SafeString(args[i]);
    }
  }

  return new handlebars.SafeString();
};
