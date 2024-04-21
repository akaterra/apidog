const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestHook annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestHook hook1',
      '@apiSrHook hook2',
    ];

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      sampleRequestHook: ['hook1', 'hook2'],
    }));
  });
});
