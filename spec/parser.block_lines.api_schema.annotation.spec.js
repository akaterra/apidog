const fs = require('fs');
const parser = require('../src/parser.block_lines');
const utils = require('../src/utils');

describe('parser.block_lines parseBlockLines @apiSchema annotation', () => {
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
