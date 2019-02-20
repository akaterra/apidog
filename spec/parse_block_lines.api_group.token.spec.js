const parser = require('../src/parser');

describe('parser for @apiGroup token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiGroup group',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      group: 'group',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiGroup',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
