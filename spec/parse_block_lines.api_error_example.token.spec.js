const parse = require('../src/parse');

describe('parse @apiErrorExample token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiErrorExample This is a title',
      '@apiErrorExample {type}',
      '@apiErrorExample {type} This is a title',
      '@apiErrorExample {type} This is a title', 'A', 'B',
    ];

    expect(parse.parseBlockLines(lines, {})).toEqual({
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
    });
  });
});
