const parse = require('../src/parse');

describe('parse @apiGroup token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiGroup group',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      group: 'group',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiGroup',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
