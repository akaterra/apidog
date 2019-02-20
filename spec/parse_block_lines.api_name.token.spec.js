const parser = require('../src/parser');

describe('parser for @apiName token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiName name',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      name: 'name',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiName',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
