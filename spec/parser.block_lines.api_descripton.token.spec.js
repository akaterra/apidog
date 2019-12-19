const parser = require('../src/parser.block_lines');
const apiDescriptionToken = require('../src/tokens/api_description.token');

describe('parser.block_lines parseBlockLines @apiDescriptor token', () => {
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
      validate: [apiDescriptionToken.validate],
    })
  });
});
