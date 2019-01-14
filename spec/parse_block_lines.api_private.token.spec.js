const parse = require('../src/parse');

describe('parse @apiPrivate token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiPrivate',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      private: true,
    });
  });

  it('should parse with slices', () => {
    const lines = [
      '@apiPrivate a,b,c',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      private: ['a', 'b', 'c'],
    });
  });
});
