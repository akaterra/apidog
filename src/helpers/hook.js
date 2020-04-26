module.exports = (op, ...args) => {
  const options = args.pop();
  let pass = false;

  switch (op) {
    case 'isGroupVariantOptional':
      pass = args[0] && args[1] && args[0].some((prop) => args[1][prop.list[0]] && args[1][prop.list[0]].field.isOptional);

      break;

    case 'isNotContainerType':
      pass = !(args[0] && args[0].modifiers && args[0].modifiers.object);

      break;

    case 'paramByGroupVariantIndex':
      return args[0] && args[1] && args[1][args[0][args[2]].list[0]];
  }

  if (!options.fn && !options.inverse) {
    return pass;
  }

  return pass ? options.fn(this) : options.inverse(this);
};
