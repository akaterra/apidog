const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSubgroup token', () => {
  it('should parse', () => {
    const lines = [
      '@apiSubgroup subgroup',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      subgroup: {
        description: [],
        name: 'subgroup',
        title: null,
      },
    })
  });

  it('should parse with description and title of definition (declared by @apiDefine)', () => {
    const lines = [
      '@apiSubgroup subgroup',
    ];

    expect(parser.parseBlockLines(lines, {subgroup: {description: ['description'], title: 'title'}})).toEqual({
      subgroup: {
        description: ['description'],
        name: 'subgroup',
        title: 'title',
      },
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSubgroup',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
