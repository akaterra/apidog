const parser = require('../src/parser');

describe('parser for @apiVersion token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiVersion 1.2.3',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      version: '1.2.3',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiVersion',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
