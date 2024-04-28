const {Block} = require('../src/block');
const parser = require('../src/parser.dir');

describe('parse.dir parseRuby', () => {
  it('should parse', () => {
    const blocks = parser.parseRuby('' +
      '=begin\n' +
      '@api {test} url\n' +
      '=end'
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
