const parser = require('../src/parser.dir');

describe('parse by parsePy', () => {
  it('should parse', () => {
    const blocks = parser.parsePy('' +
      '"""\n' +
      '@api {test} url\n' +
      '"""'
    );

    expect(blocks).toEqual([{
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[0].validate,
    }]);
  });

  it('should parse indented', () => {
    const blocks = parser.parsePy('' +
      '    """\n' +
      '    @api {test} url\n' +
      '    """'
    );

    expect(blocks).toEqual([{
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[0].validate,
    }]);
  });
});
