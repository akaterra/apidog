const {Block} = require('../src/block');
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

    expect(blocks).toEqual([jasmine.objectContaining(new Block({
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
    })), jasmine.objectContaining(new Block({
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
    }))]);
  });
});
