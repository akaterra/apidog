const parser = require('../src/parser');

describe('parser for @apiPrivate token by parseBlockLines', () => {
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
