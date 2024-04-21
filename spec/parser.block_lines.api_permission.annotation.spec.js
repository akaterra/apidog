const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiPermission annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiPermission permission1',
      '@apiPermission permission2',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual(new parser.Block({
      permission: [{
        description: [],
        name: 'permission1',
        title: null,
      }, {
        description: [],
        name: 'permission2',
        title: null,
      }],
    }));
  });

  it('should parse with description and title of definition (declared by @apiDefine)', () => {
    const lines = [
      '@apiPermission permission',
    ];

    expect(parser.parseBlockLines(lines, {permission: {description: ['description'], title: 'title'}})).toEqual(new parser.Block({
      permission: [{
        description: ['description'],
        name: 'permission',
        title: 'title',
      }],
    }));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiPermission',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
