const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiUse token', () => {
  it('should parse', () => {
    const lines = [
      '@apiUse test',
    ];

    parser.parseBlockLines(lines, {test: {embeddedLines: ['A', 'B', 'C']}});

    expect(lines).toEqual(['', 'A', 'B', 'C']);
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiUse',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
