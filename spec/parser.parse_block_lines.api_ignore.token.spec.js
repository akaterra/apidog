const parser = require('../src/parser.block_lines');

describe('parser for @apiIgnore token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiIgnore 1.2.3',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      ignore: '1.2.3',
    })
  });
});
