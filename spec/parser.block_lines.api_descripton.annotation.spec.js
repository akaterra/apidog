const parser = require('../src/parser.block_lines');
const apiDescriptionToken = require('../src/annotations/api_description');

describe('parser.block_lines parseBlockLines @apiDescriptor annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiDescription This is a description',
      'Some description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(jasmine.objectContaining(new parser.Block({
      description: [
        'This is a description',
        'Some description',
      ],
      validate: [apiDescriptionToken.validate],
    })));
  });
});
