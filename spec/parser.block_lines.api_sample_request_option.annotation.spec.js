const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestOption annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestOption key1 value1',
      '@apiSrOption key2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      sampleRequestOption: {
        key1: 'value1',
        key2: true,
      },
    })
  });
});
