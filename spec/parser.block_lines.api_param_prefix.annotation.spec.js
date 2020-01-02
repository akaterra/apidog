const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParamPrefix annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiParamPrefix name',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      paramPrefix: 'name',
    })
  });
});
