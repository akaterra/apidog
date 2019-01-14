const parse = require('../src/parse');

describe('parse @apiDeprecated token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiDeprecated deprecated',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      deprecated: 'deprecated',
    });
  });
});
