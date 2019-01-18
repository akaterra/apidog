const compileBodyXml = require('../../../src/templates/html/assets/compile_body_xml').compileBodyXml;

describe('template html assets, compileBodyForm', () => {
  fit('should compile', () => {
    const text = compileBodyXml({
      a: 1,
      b: {
        a: 2,
        b: {
          a: 3,
        },
        c: [4, 5, 6],
      },
      c: [7, 8, 9],
    }, {root: 'body'});

    expect(text).toEqual('<?xml version="1.0" opts="UTF-8" ?>' +
      '<body a="1">' +
        '<b a="2">' +
          '<b a="3" />' +
          '<c>4</c>' +
          '<c>5</c>' +
          '<c>6</c>' +
        '</b>' +
        '<c>7</c>' +
        '<c>8</c>' +
        '<c>9</c>' +
      '</body>'
    );
  });

  fit('should compile fine formatted', () => {
    const text = compileBodyXml({
      a: 1,
      b: {
        a: 2,
        b: {
          a: 3,
        },
        c: [4, 5, 6],
      },
      c: [7, 8, 9],
    }, {fine: true, root: 'body'});

    expect(text).toEqual('<?xml version="1.0" opts="UTF-8" ?>\n' +
      '  <body a="1">\n' +
      '    <b a="2">\n' +
      '      <b a="3" />\n' +
      '      <c>4</c>\n' +
      '      <c>5</c>\n' +
      '      <c>6</c>\n' +
      '    </b>\n' +
      '    <c>7</c>\n' +
      '    <c>8</c>\n' +
      '    <c>9</c>\n' +
      '  </body>\n'
    );
  });
});
