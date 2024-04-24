const parserOpenAPIUtils = require('../src/parser.openapi.1.2.utils');

describe('parser.openapi.1.2.utils enumUriPlaceholders', () => {
  it('should enum', () => {
    const placeholders = {};

    parserOpenAPIUtils.enumUriPlaceholders('schema://uri/{a}/{b}?c={c}&d={d}', (placeholder, isInQuery) => {
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
