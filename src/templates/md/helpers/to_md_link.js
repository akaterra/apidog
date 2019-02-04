module.exports = (...args) => args
  .slice(0, -1)
  .join('')
  .replace(/[^\w\s]/g, '')
  .replace(/\s/g, '-')
  .toLowerCase();
