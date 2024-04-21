const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequest annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequest baseEndpoint',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequest: [
        'baseEndpoint',
      ],
    }));
  });

  it('should parse', () => {
    const lines = [
      '@apiSr baseEndpoint',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequest: [
        'baseEndpoint',
      ],
    }));
  });

  it('should parse with off', () => {
    const lines = [
      '@apiSampleRequest off',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequest: [
        false,
      ],
    }));
  });

  it('should parse with on', () => {
    const lines = [
      '@apiSampleRequest on',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequest: [
        true,
      ],
    }));
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequest',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
