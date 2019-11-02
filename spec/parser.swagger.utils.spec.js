const parserSwaggerUtils = require('../src/parser.swagger.utils');

describe('parser.swagger.utils enumUriPlaceholders', () => {
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
