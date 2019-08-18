const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiOption token', () => {
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
