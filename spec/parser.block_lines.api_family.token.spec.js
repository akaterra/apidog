const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiFamily token', () => {
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
