const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiDeprecated annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiDeprecated deprecated',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(jasmine.objectContaining(new parser.Block({
      deprecated: 'deprecated',
    })));
  });
});
