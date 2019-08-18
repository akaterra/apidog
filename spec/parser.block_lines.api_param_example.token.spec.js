const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParamExample token', () => {
  it('should parse', () => {
    const lines = [
      '@apiParamExample This is a title',
      '@apiParamExample {type}',
      '@apiParamExample {type} This is a title',
      '@apiParamExample {type} This is a title', 'A', 'B',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual({
      paramExample: [{
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
