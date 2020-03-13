const parserSwaggerUtils = require('../src/parser.swagger.1.2.utils');

describe('parser.swagger.1.2.utils enumUriPlaceholders', () => {
  it('should enum', () => {
    const placeholders = {};

    parserSwaggerUtils.enumUriPlaceholders('schema://uri/{a}/{b}?c={c}&d={d}', (placeholder, isInQuery) => {
      placeholders[placeholder] = isInQuery;
    });

    expect(placeholders).toEqual({
      a: false,
      b: false,
      c: true,
      d: true,
    });
  });
});
