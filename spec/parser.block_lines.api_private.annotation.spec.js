const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiPrivate annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiPrivate',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      private: true,
    });
  });

  it('should parse with slices', () => {
    const lines = [
      '@apiPrivate a,b,c',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      private: ['a', 'b', 'c'],
    });
  });
});
