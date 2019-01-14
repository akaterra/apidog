const parse = require('../src/parse');

describe('parse @apiDefine token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiDefine name',
    ];

    expect(parse.parseBlockLines(lines, {})).toEqual({
      define: {
        description: [],
        name: 'name',
        title: null,
      },
    });
  });

  it('should parse with title', () => {
    const lines = [
      '@apiDefine name This is a title',
    ];

    expect(parse.parseBlockLines(lines, {})).toEqual({
      define: {
        description: [],
        name: 'name',
        title: 'This is a title',
      },
    });
  });

  it('should parse with description', () => {
    const lines = [
      '@apiDefine name This is a title', 'A', 'B',
    ];

    expect(parse.parseBlockLines(lines, {})).toEqual({
      define: {
        description: ['A', 'B'],
        name: 'name',
        title: 'This is a title',
      },
    });
  });
});
