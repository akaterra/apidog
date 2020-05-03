const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiHeaderExample annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiHeaderExample This is a title',
      '@apiHeaderExample {type}',
      '@apiHeaderExample {type} This is a title',
      '@apiHeaderExample {type} This is a title', 'A', 'B',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual({
      contentType: ['form', 'type'],
      headerExample: [{
        description: [],
        title: 'This is a title',
        type: 'form',
      }, {
        description: [],
        title: null,
        type: 'type',
      }, {
        description: [],
        title: 'This is a title',
        type: 'type',
      }, {
        description: ['A', 'B'],
        title: 'This is a title',
        type: 'type',
      }],
    });
  });
});
