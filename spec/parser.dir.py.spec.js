const {Block} = require('../src/block');
const parser = require('../src/parser.dir');

describe('parse.dir parsePy', () => {
  it('should parse', () => {
    const blocks = parser.parsePy('' +
      '"""\n' +
      '@api {test} url\n' +
      '"""'
    );

    expect(blocks).toEqual([jasmine.objectContaining(new Block({
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
    }))]);
  });

  it('should parse indented', () => {
    const blocks = parser.parsePy('' +
      '    """\n' +
      '    @api {test} url\n' +
      '    """'
    );

    expect(blocks).toEqual([jasmine.objectContaining(new Block({
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
    }))]);
  });
});
