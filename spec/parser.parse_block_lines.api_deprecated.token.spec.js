const parser = require('../src/parser.block_lines');

describe('parser for @apiDeprecated token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiDeprecated deprecated',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      deprecated: 'deprecated',
    });
  });
});
