const parser = require('../src/parser');

describe('parser for @apiSubgroup token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSubgroup subgroup',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      subgroup: 'subgroup',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSubgroup',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
