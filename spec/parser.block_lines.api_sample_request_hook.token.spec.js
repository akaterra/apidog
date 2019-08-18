const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestHook token', () => {
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
