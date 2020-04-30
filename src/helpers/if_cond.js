module.exports = (...args) => {
  const options = args.pop();

  let pass = true;

  for (let i = 0; i < args.length; i += 3) {
    const [v1, operator, v2] = args.slice(i, i + 3);

    switch (operator) {
      case '==':
        pass = v1 === v2;

        break;

      case '!=':
        pass = v1 !== v2;

        break;

      case '<':
        pass = v1 < v2;

        break;

      case '<=':
        pass = v1 <= v2;

        break;

      case '>':
        pass = v1 > v2;

        break;

      case '>=':
        pass = v1 >= v2;

        break;

      case '&&':
        pass = v1 && v2;

        break;

      case '||':
        pass = v1 || v2;

        break;

      default:
        pass = false;
    }

    if (!pass) {
      break;
    }
  }

  if (!options.fn && !options.inverse) {
    return pass;
  }

  return pass ? options.fn(this) : options.inverse(this);
};
