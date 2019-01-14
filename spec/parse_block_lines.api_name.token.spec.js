const parse = require('../src/parse');

describe('parse @apiName token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiName name',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      name: 'name',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiName',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
