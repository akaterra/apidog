const parser = require('../src/parser');

describe('parser for @apiDescriptor token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiDescription This is a description',
      'Some description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      description: [
        'This is a description',
        'Some description',
      ],
    })
  });
});
