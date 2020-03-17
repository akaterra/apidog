const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiTag annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiTag tag1',
      '@apiTag tag2,tag3',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      tag: ['tag1', 'tag2', 'tag3'],
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiTag',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
