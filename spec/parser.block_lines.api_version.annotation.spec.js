const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiVersion annotation', () => {
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
