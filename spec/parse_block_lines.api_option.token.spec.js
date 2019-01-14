const parse = require('../src/parse');

describe('parse @apiOption token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiOption key1 value1',
      '@apiOption key2',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      option: {
        key1: 'value1',
        key2: true,
      },
    })
  });
});
