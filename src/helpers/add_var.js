module.exports = (key, val, options) => {
  options.data.root[key] = parseInt(options.data.root[key] || '0') + parseInt(val);
};
