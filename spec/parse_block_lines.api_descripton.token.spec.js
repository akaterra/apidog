const parse = require('../src/parse');

describe('parse @apiDescriptor token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiDescription This is a description',
      'Some description',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      description: [
        'This is a description',
        'Some description',
      ],
    })
  });
});
