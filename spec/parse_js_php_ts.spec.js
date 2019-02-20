const parser = require('../src/parser');

describe('parse by parseJsPhpTs', () => {
  it('should parse', () => {
    const blocks = parser.parseJsPhpTs('' +
      '/**\n' +
      ' * @api {test} url\n' +
      ' */'
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
