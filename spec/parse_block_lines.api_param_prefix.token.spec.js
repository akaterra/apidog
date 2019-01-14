const parse = require('../src/parse');

describe('parse @apiParamPrefix token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiParamPrefix name',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      paramPrefix: 'name',
    })
  });
});
