const parse = require('../src/parse');

describe('parse @apiSampleRequestHook token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestHook hook1',
      '@apiSampleRequestHook hook2',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      sampleRequestHook: ['hook1', 'hook2'],
    });
  });
});
