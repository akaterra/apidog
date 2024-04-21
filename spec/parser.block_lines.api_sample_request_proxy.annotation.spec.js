const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestProxy annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestProxy 0.0.0.0',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequestProxy: '0.0.0.0',
    }));
  });

  it('should parse', () => {
    const lines = [
      '@apiSrProxy 0.0.0.0',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequestProxy: '0.0.0.0',
    }));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequestProxy',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
