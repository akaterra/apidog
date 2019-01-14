const parse = require('../src/parse');

describe('parse by parsePy', () => {
  it('should parse', () => {
    const blocks = parse.parsePy('' +
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
    const blocks = parse.parsePy('' +
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
