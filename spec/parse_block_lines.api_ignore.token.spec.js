const parse = require('../src/parse');

describe('parse @apiIgnore token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiIgnore 1.2.3',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      ignore: '1.2.3',
    })
  });
});
