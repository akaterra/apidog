const parser = require('../src/parser');

describe('parser for @apiPermission token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiPermission permission1',
      '@apiPermission permission2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      permission: ['permission1', 'permission2'],
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiPermission',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
