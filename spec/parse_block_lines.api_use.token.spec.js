const parse = require('../src/parse');

describe('parse @apiUse token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiUse test',
    ];

    parse.parseBlockLines(lines, {test: ['A', 'B', 'C']});

    expect(lines).toEqual(['', 'A', 'B', 'C']);
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiUse',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
