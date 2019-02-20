const parser = require('../src/parser');

describe('parser for @apiOption token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiOption key1 value1',
      '@apiOption key2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      option: {
        key1: 'value1',
        key2: true,
      },
    })
  });
});
