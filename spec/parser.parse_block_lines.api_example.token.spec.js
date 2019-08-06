const parser = require('../src/parser');

describe('parser for @apiExample token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiExample This is a title',
      '@apiExample {type}',
      '@apiExample {type} This is a title',
      '@apiExample {type} This is a title', 'A', 'B',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual({
      example: [{
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
