const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestProxy token', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestProxy 0.0.0.0',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      sampleRequestProxy: '0.0.0.0',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequestProxy',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
