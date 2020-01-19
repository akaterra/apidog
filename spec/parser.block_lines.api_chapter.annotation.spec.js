const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiChapter annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiChapter chapter',
    ];

    expect(parser.parseBlockLines(lines, {})).toEqual({
      chapter: {
        description: [],
        name: 'chapter',
        title: null,
      },
    });
  });

  it('should parse with description and title of definition (declared by @apiDefine)', () => {
    const lines = [
      '@apiChapter chapter',
    ];

    expect(parser.parseBlockLines(lines, {chapter: {description: ['description'], title: 'title'}})).toEqual({
      chapter: {
        description: ['description'],
        name: 'chapter',
        title: 'title',
      },
    });
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiChapter',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
