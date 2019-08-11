const parser = require('../src/parser.block_lines');

describe('parser for @apiSampleRequestHook token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestHook hook1',
      '@apiSampleRequestHook hook2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      sampleRequestHook: ['hook1', 'hook2'],
    });
  });
});
