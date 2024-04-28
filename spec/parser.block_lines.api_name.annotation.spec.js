const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiName annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiName name',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(jasmine.objectContaining(new parser.Block({
      name: 'name',
    })));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiName',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
