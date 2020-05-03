const fs = require('fs');
const parser = require('../src/parser.block_lines');
const utils = require('../src/utils');

describe('parser.block_lines parseBlockLines @apiSchema annotation', () => {
  it('should parse JSON Schema', () => {
    const lines = [
      '@apiSchema (group) {jsonschema=./spec/sample/jsonschema.json} @apiParam',
    ];

    parser.parseBlockLines(lines, {}, {
      logger: utils.logger,
      schema: {
        jsonschema: {
          'jsonschema.external.json': JSON.parse(fs.readFileSync(__dirname + '/sample/jsonschema.external.json', 'utf8')),
        }
      }
    });

    expect(lines).toEqual([
      '',
      '@apiParam (group) {Boolean} [a]',
      'Description',
      '@apiParam (group) {Number} b=5',
      '@apiParam (group) {String} [c] Title',
      '@apiParam (group) {Object} [d]',
      '@apiParam (group) {Boolean} [d.a]',
      'Description',
      '@apiParam (group) {Number} d.b="Hello, world!"',
      '@apiParam (group) {String} [d.c] Title',
      '@apiParam (group) {Object[]} [e]',
      '@apiParam (group) {String} [e[].a] Title',
      '@apiParam (group) {Number} e[].b=5',
      '@apiParam (group) {Boolean} [e[].c]',
      'Description',
      '@apiParam (group) {Boolean:Enum=a,b,c,"Hello, world!"} [f]',
      '@apiParam (group) {Boolean:Enum=a,b,c,"Hello, world!"} g',
      '@apiParam (group) {Number:Enum=a,b,c,"Hello, world!"} [h]',
      '@apiParam (group) {Number:Enum=a,b,c,"Hello, world!"} i',
      '@apiParam (group) {String:Enum=a,b,c,"Hello, world!"} [j]',
      '@apiParam (group) {String:Enum=a,b,c,"Hello, world!"} k',
      '@apiParam (group) {Number} [x=5]',
      "@apiParam (group) {Number} [y]",
      "@apiParam (group) {String} [y]",
      "@apiParam (group) {Number} [z]",
      "@apiParam (group) {String} [z]",
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
});
