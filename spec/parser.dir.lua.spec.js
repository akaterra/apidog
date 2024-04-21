const {Block} = require('../src/block');
const parser = require('../src/parser.dir');

describe('parse.dir parseLua', () => {
  it('should parse', () => {
    const blocks = parser.parseLua('' +
      '--[[\n' +
      '@api {test} url\n' +
      '--]]'
    );

    expect(blocks).toEqual([new Block({
      api: {
        endpoint: 'url',
        title: null,
        transport: {name: 'test'},
      },
      title: null,
      validate: blocks[0].validate,
    })]);
  });
});
