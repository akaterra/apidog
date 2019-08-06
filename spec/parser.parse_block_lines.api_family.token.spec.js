const parser = require('../src/parser');

describe('parser for @apiFamily token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiFamily family',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      family: 'family',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiFamily',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
