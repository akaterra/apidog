const parser = require('../src/parser.block_lines');

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
