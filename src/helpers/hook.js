module.exports = (op, ...args) => {
  const options = args.pop();

  switch (op) {
    case 'isNotContainerType':
      return args[0] && (args[0].modifiers && args[0].modifiers.object)
        ? options.inverse(this)
        : options.fn(this);

    default:
      return options.fn(this);
  }
};
