const parser = require('../src/parser.dir');

describe('parse.dir parseJavaDocStyle', () => {
  it('should parse', () => {
    const blocks = parser.parseJavaDocStyle('' +
      '/**\n' +
      ' * @api {test} url\n' +
      ' */\n' +
      '/**\n' +
      ' @api {test} url\n' +
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
    }, {
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
