const parse = require('../src/parse');

describe('parse @apiSampleRequest token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequest baseEndpoint',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      sampleRequest: [
        'baseEndpoint',
      ],
    })
  });

  it('should parse with off', () => {
    const lines = [
      '@apiSampleRequest off',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      sampleRequest: [
        false,
      ],
    })
  });

  it('should parse with on', () => {
    const lines = [
      '@apiSampleRequest on',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      sampleRequest: [
        true,
      ],
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequest',
    ];

    expect(() => parse.parseBlockLines(lines)).toThrow();
  });
});
