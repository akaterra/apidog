const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParamPrefix annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiParamPrefix name',
    ];

    expect(parser.parseBlockLines(lines).paramPrefix).toEqual('name');
  });

  it('should parse empty as reset', () => {
    const lines = [
      '@apiParamPrefix',
    ];

    expect(parser.parseBlockLines(lines).paramPrefix).toBeUndefined();
  });

  it('should parse as nested', () => {
    const lines = [
      '@apiParamPrefix a.',
      '@apiParamPrefix b.',
      '@apiParamPrefix c.',
    ];

    expect(parser.parseBlockLines(lines).paramPrefix).toEqual('a.b.c.');
  });

  it('should parse as nested traversing back', () => {
    const lines = [
      '@apiParamPrefix a.',
      '@apiParamPrefix b.',
      '@apiParamPrefix ..',
    ];

    expect(parser.parseBlockLines(lines).paramPrefix).toEqual('a.');
  });

  it('should parse as nested traversing back and reset', () => {
    const lines = [
      '@apiParamPrefix a.',
      '@apiParamPrefix ..',
      '@apiParamPrefix ..',
    ];

    expect(parser.parseBlockLines(lines).paramPrefix).toBeUndefined();
  });
});
