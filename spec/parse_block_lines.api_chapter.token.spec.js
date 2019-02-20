const parser = require('../src/parser');

describe('parser for @apiChapter token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiChapter chapter',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      chapter: 'chapter',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiChapter',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
