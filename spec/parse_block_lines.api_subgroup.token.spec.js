const parse = require('../src/parse');

describe('parse @apiSubgroup token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSubgroup subgroup',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      subgroup: 'subgroup',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSubgroup',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
