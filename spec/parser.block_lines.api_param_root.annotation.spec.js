const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParamRoot annotation', () => {
  beforeEach(function () {
    jasmine.addMatchers(require('jasmine-diff')(jasmine, {}));
  });

  it('should parse multiple params', () => {
    const lines = [
      '@apiParamRoot {typeA}',
      '@apiParamRoot (groupA) {typeA} This is a description',
    ];

    expect(parser.parseBlockLines(lines).toObject()).toEqual({
      param: [{ // 0
        description: [],
        field: { name: '', path: [''] },
        group: null,
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 1
        description: [ 'This is a description' ],
        field: { name: '', path: [''] },
        group: 'groupA',
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }],
      paramGroup: {
        null: { isTyped: true, list: [ 0 ]},
        groupA: { isTyped: true, list: [ 1 ] },
      },
      paramGroupVariant: {
        null: {
          isTyped: true,
          prop: {
            '': [
              {
                list: [ 0 ],
                parent: null,
                prop: {},
              },
            ],
          },
        },
        groupA: {
          isTyped: true,
          prop: {
            '': [
              {
                list: [ 1 ],
                parent: null,
                prop: {},
              },
            ],
          },
        },
      },
    });
  });
});
