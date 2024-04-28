const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiGroup annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiGroup group',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual(jasmine.objectContaining(new parser.Block({
      group: {
        description: [],
        name: 'group',
        title: null,
      },
    })));
  });

  it('should parse with description and title of definition (declared by @apiDefine)', () => {
    const lines = [
      '@apiGroup group',
    ];

    expect(parser.parseBlockLines(lines, {group: {description: ['description'], title: 'title'}})).toEqual(jasmine.objectContaining(new parser.Block({
      group: {
        description: ['description'],
        name: 'group',
        title: 'title',
      },
    })));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiGroup',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
