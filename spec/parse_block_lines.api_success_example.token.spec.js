const parse = require('../src/parse');

describe('parse @apiSuccessExample token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSuccessExample This is a title',
      '@apiSuccessExample {type}',
      '@apiSuccessExample {type} This is a title',
      '@apiSuccessExample {type} This is a title', 'A', 'B',
    ];

    expect(parse.parseBlockLines(lines, {})).toEqual({
      successExample: [{
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
