const compileBodyForm = (body) => {
  function compile(e, k) {
    if (Array.isArray(e)) {
      return e.reduce((acc, val) => {
        return acc + compile(val, `${k || ''}[]`);
      }, '');
    }

    if (e && typeof e === 'object') {
      return Object.keys(e).reduce((acc, key) => {
        return acc + compile(e[key], `${k || ''}[${encodeURIComponent(key)}]`);
      }, '');
    }

    return `${k || ''}=${encodeURIComponent(String(e))}&`;
  }

  return Object.keys(body).reduce((acc, key) => {
     return acc + compile(body[key], key);
  }, '').slice(0, -1);
};

if (typeof module !== 'undefined') {
  module.exports.compileBodyForm = compileBodyForm;
}
