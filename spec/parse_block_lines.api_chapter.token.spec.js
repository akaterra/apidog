const parse = require('../src/parse');

describe('parse @apiChapter token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiChapter chapter',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      chapter: 'chapter',
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiChapter',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
