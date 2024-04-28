const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiErrorExample annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiErrorExample This is a title',
      '@apiErrorExample {type}',
      '@apiErrorExample {type} This is a title',
      '@apiErrorExample {type} This is a title', 'A', 'B',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual(jasmine.objectContaining(new parser.Block({
      contentType: ['form', 'type'],
      errorExample: [{
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
    })));
  });
});
