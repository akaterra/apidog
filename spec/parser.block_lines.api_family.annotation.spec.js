const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiFamily annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiFamily family',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(jasmine.objectContaining(new parser.Block({
      family: 'family',
    })));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiFamily',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
