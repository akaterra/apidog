const parse = require('../src/parse');

describe('parse @apiVersion token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiVersion 1.2.3',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      version: '1.2.3',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiVersion',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
