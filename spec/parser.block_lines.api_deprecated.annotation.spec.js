const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiDeprecated annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiDeprecated deprecated',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      deprecated: 'deprecated',
    });
  });
});
