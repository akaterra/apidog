const compileBodyXml = (body, opts) => {
  const fine = opts && opts.fine;
  const fineNewLine = fine ? '\n' : '';
  const finePrefix = '';

  function compile(e, k, prefix) {
    if (Array.isArray(e)) {
      return e.reduce((acc, val) => {
        acc.push(compile(val, k, fine ? `${prefix}` : ''));

        return acc;
      }, []).join('');
    }

    if (e && typeof e === 'object') {
      const attr = Object.keys(e).reduce((acc, key) => {
        if (!e[key] || typeof e[key] !== 'object') {
          acc.push(`${key}="${e[key]}"`);
        }

        return acc;
      }, []);
      const subs = Object.keys(e).reduce((acc, key) => {
        if (e[key] && typeof e[key] === 'object') {
          acc.push(compile(e[key], key, fine ? `  ${prefix}` : ''));
        }

        return acc;
      }, []);

      return subs.length
        ? `${prefix}<${k}${attr.length ? ' ' + attr.join(' ') : ''}>${fineNewLine}${subs.join('')}${prefix}</${k}>${fineNewLine}`
        : `${prefix}<${k}${attr.length ? ' ' + attr.join(' ') : ''} />${fineNewLine}`;
    }

    return `${prefix}<${k}>${e}</${k}>${fineNewLine}`;
  }

  if (opts && opts.root) {
    body = {[opts.root]: body};
  }

  return Object.keys(body).reduce((acc, key) => {
    return acc + compile(body[key], key, finePrefix);
  }, opts && opts.header || `<?xml version="1.0" opts="UTF-8" ?>${fineNewLine}`);
};

if (typeof module !== 'undefined') {
  module.exports.compileBodyXml = compileBodyXml;
}
