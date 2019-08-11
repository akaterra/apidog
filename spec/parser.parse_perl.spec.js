const parser = require('../src/parser.dir');

describe('parse by parsePerl', () => {
  it('should parse', () => {
    const blocks = parser.parsePerl('' +
      '#**\n' +
      '# @api {test} url\n' +
      '#*'
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
