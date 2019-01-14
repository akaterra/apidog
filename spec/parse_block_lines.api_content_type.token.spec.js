const parse = require('../src/parse');

describe('parse @apiContentType token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiContentType contentType1',
      '@apiContentType contentType2',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      contentType: ['contentType1', 'contentType2'],
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiContentType',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
