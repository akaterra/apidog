const compileBodyForm = require('../../../src/templates/html/assets/compile_body_form').compileBodyForm;

describe('template html assets, compileBodyForm', () => {
  fit('should compile', () => {
    const text = compileBodyForm({
      a: 1,
      b: {
        a: 2,
        b: {
          a: 3,
        },
        c: [4, 5, 6],
      },
      c: [7, 8, 9],
    });

    expect(text).toEqual('a=1&b[a]=2&b[b][a]=3&b[c][]=4&b[c][]=5&b[c][]=6&c[]=7&c[]=8&c[]=9');
  });
});
