const {Block} = require('../src/block');
const parser = require('../src/parser.dir');

describe('parse.dir parsePerl', () => {
  it('should parse', () => {
    const blocks = parser.parsePerl('' +
      '#**\n' +
      '# @api {test} url\n' +
      '#*'
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
