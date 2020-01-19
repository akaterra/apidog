const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiIgnore annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiIgnore 1.2.3',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      ignore: '1.2.3',
    })
  });
});
