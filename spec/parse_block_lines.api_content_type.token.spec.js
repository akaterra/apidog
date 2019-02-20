const parser = require('../src/parser');

describe('parser for @apiContentType token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiContentType contentType1',
      '@apiContentType contentType2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      contentType: ['contentType1', 'contentType2'],
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiContentType',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
