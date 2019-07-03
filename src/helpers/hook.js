module.exports = (op, ...args) => {
  const options = args.pop();

  switch (op) {
    case 'isNotContainerType':
      return args[0] && args[0].toLowerCase() !== 'array' && args[0].toLowerCase() !== 'object'
        ? options.fn(this)
        : args[0]
          ? options.inverse(this)
          : options.fn(this);

    default:
      return options.fn(this);
  }
};
