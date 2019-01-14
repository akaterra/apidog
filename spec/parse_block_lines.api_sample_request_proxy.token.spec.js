const parse = require('../src/parse');

describe('parse @apiSampleRequestProxy token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestProxy 0.0.0.0',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      proxy: '0.0.0.0',
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequestProxy',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
