const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiDefine annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiDefine name',
    ];

    expect(parser.parseBlockLines(lines, {}).toObject()).toEqual(jasmine.objectContaining({
      define: {
        description: [],
        embeddedLines: [],
        name: 'name',
        title: null,
      },
    }));
  });

  it('should parse with title', () => {
    const lines = [
      '@apiDefine name This is a title',
    ];

    expect(parser.parseBlockLines(lines, {}).toObject()).toEqual(jasmine.objectContaining({
      define: {
        description: [],
        embeddedLines: [],
        name: 'name',
        title: 'This is a title',
      },
    }));
  });

  it('should parse with description', () => {
    const lines = [
      '@apiDefine name This is a title', 'A', 'B',
    ];

    expect(parser.parseBlockLines(lines, {}).toObject()).toEqual(jasmine.objectContaining({
      define: {
        description: ['A', 'B'],
        embeddedLines: ['A', 'B'],
        name: 'name',
        title: 'This is a title',
      },
    }));
  });
});
