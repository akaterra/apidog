const parse = require('../src/parse');

describe('parse by parseJsPhpTs', () => {
  it('should parse', () => {
    const blocks = parse.parseJsPhpTs('' +
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
