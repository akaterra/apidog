const parser = require('../src/parser');

describe('parser for @apiKind token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiKind test',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      kind: 'test',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiKind',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
