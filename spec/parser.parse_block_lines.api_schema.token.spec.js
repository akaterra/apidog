const parser = require('../src/parser.block_lines');

describe('parser for @apiSchema token by parseBlockLines', () => {
  it('should parse JSON Schema', () => {
    const lines = [
      '@apiSchema (group) {jsonschema=./spec/sample/jsonschema.json} @apiParam',
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

  it('should parse JSON Schema by internal path', () => {
    const lines = [
      '@apiSchema (group) {jsonschema=./spec/sample/jsonschema.json#definitions.test} @apiParam',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@apiParam (group) {Number} [x] Title',
    ]);
  });

  it('should raise error on unknown schema type', () => {
    const lines = [
      '@apiSchema (group) {unknown=unknown} @apiParam',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSchema',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
