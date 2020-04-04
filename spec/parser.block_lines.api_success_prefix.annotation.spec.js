const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSuccessPrefix annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSuccessPrefix name',
    ];

    expect(parser.parseBlockLines(lines).successPrefix).toEqual('name');
  });

  it('should parse empty as reset', () => {
    const lines = [
      '@apiSuccessPrefix',
    ];

    expect(parser.parseBlockLines(lines).successPrefix).toBeUndefined();
  });

  it('should parse as nested', () => {
    const lines = [
      '@apiSuccessPrefix a.',
      '@apiSuccessPrefix b.',
      '@apiSuccessPrefix c.',
    ];

    expect(parser.parseBlockLines(lines).successPrefix).toEqual('a.b.c.');
  });

  it('should parse as nested traversing back', () => {
    const lines = [
      '@apiSuccessPrefix a.',
      '@apiSuccessPrefix b.',
      '@apiSuccessPrefix ..',
    ];

    expect(parser.parseBlockLines(lines).successPrefix).toEqual('a.');
  });

  it('should parse as nested traversing back and reset', () => {
    const lines = [
      '@apiSuccessPrefix a.',
      '@apiSuccessPrefix ..',
      '@apiSuccessPrefix ..',
    ];

    expect(parser.parseBlockLines(lines).successPrefix).toBeUndefined();
  });
});
