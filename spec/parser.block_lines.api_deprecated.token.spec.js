const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiDeprecated token', () => {
  it('should parse', () => {
    const lines = [
      '@apiDeprecated deprecated',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      deprecated: 'deprecated',
    });
  });
});
