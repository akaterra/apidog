const parser = require('../src/parser.block_lines');

describe('parser for @apiSchema token by parseBlockLines', () => {
  it('should parse', () => {
    const lines = [
      '@apiSchema (group) {./spec/sample/jsonschema.json} @apiParam',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@apiParam (group) {String} [a] Title',
      '@apiParam (group) {Number} b=5',
      '@apiParam (group) {Boolean} [c]',
      'Description',
      '@apiParam (group) {Object} [d]',
      '@apiParam (group) {String} [d.a] Title',
      '@apiParam (group) {Number} d.b=5',
      '@apiParam (group) {Boolean} [d.c]',
      'Description',
      '@apiParam (group) {Object[]} [e]',
      '@apiParam (group) {String} [e[].a] Title',
      '@apiParam (group) {Number} e[].b=5',
      '@apiParam (group) {Boolean} [e[].c]',
      'Description',
      '@apiParam (group) {String=a,b,c} [f]',
    ]);
  });

  // it('should raise error on malformed definition', () => {
  //   const lines = [
  //     '@apiUse',
  //   ];
  //
  //   expect(() => parser.parseBlockLines(lines)).toThrow();
  // });
});
