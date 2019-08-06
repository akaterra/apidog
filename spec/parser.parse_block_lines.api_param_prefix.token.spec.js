const parser = require('../src/parser');

describe('parser for @apiParamPrefix token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiParamPrefix name',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      paramPrefix: 'name',
    })
  });
});
