const {Block} = require('../src/block');
const parser = require('../src/parser.dir');

describe('parse.dir parseApidoc', () => {
  it('should parse', () => {
    const blocks = parser.parseApidoc('' +
      '@api {test} url1\n' +
      '\n' +
      '\n' +
      '@api {test} url2\n' +
      '\n' +
      '\n' +
      '@api {test} url3\n'
    );

    expect(blocks).toEqual([new Block({
      api: {
        endpoint: 'url1',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[0].validate,
    }), new Block({
      api: {
        endpoint: 'url2',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[1].validate,
    }), new Block({
      api: {
        endpoint: 'url3',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[2].validate,
    })]);
  });
});
