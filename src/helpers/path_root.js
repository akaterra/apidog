root = String.fromCharCode(255); // Symbol('root'),

module.exports = (input) => {
  return input === root ? '' : input;
};
