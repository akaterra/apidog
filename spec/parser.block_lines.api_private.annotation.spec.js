const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiPrivate annotation', () => {
  it('should parse with slices', () => {
    const lines = [
      '@apiPrivate a,b,c',
      '@apiPrivate d,e,f',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      private: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
  });

  it('should parse as global', () => {
    const lines = [
      '@apiPrivate',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      private: true,
    });
  });
});
