const fs = require('fs');
const parser = require('../src/parser.block_lines');
const utils = require('../src/utils');

describe('parser.block_lines parseBlockLines @apiSchema annotation', () => {
  it('should parse JSON', () => {
    const lines = [
      '@apiSchema (group) {json=./spec/sample/raw.json} @apiParam',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@apiParam {String} a="a a a"',
      '@apiParam {Object} b',
      '@apiParam {String[][]} b.a=a',
      '@apiParam {Number} b.b=1',
      '@apiParam {Boolean} c=true',
    ]);
  });

  it('should parse JSON by internal path', () => {
    const lines = [
      '@apiSchema (group) {json=./spec/sample/raw.json#b} @apiParam',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@apiParam {String[][]} a=a',
      '@apiParam {Number} b=1',
    ]);
  });
});
