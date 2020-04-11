const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiHeader', () => {
  it('should parse multiple headers', () => {
    const lines = [
      '@apiHeader A_B.C',
      '@apiHeader A_B.C This is a description',
      '@apiHeader A_B.C This is a description', 'Some description',
      '@apiHeader A_B.C=A This is a description',
      '@apiHeader A_B.C="A B C" This is a description',
      '@apiHeader [A_B.C] This is a description',
      '@apiHeader [A_B.C=A] This is a description',
      '@apiHeader [A_B.C="A B C"] This is a description',
      '@apiHeader (groupA) A_B.C This is a description',
      '@apiHeader {typeA} A_B.C This is a description',
      '@apiHeader {typeA=A,B,C} A_B.C This is a description',
      '@apiHeader {typeA="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiHeader (groupA) {typeA="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
      '@apiHeader (isNotTyped) A_B.C This is a description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      header: [{ // 0
        description: [],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 1
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 2
        description: ['This is a description', 'Some description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 3
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 4
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: false, name: 'A_B.C' },
        group: null,
        type: null
      }, { // 5
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: true, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 6
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: true, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 7
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: null,
        type: null
      }, { // 8
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: 'groupA',
        type: null,
      }, { // 9
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 10
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 11
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 12
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 13
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: 'isNotTyped',
        type:null,
      }],
      headerGroup: {
        null: { isTyped: true, list: [ 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11 ]},
        groupA: { isTyped: true, list: [ 8, 12 ] },
        isNotTyped: { isTyped: false, list: [ 13 ]},
      },
      headerGroupVariant: {
        null: Object({ isTyped: true, prop: Object({ A_B: [ Object({ list: [ 0 ], prop: Object({ C: [ Object({ list: [ 1 ], prop: Object({  }) }), Object({ list: [ 2 ], prop: Object({  }) }), Object({ list: [ 3 ], prop: Object({  }) }), Object({ list: [ 4 ], prop: Object({  }) }), Object({ list: [ 5 ], prop: Object({  }) }), Object({ list: [ 6 ], prop: Object({  }) }), Object({ list: [ 7 ], prop: Object({  }) }), Object({ list: [ 9 ], prop: Object({  }) }), Object({ list: [ 10 ], prop: Object({  }) }), Object({ list: [ 11 ], prop: Object({  }) }) ] }) }) ], C: [ Object({ list: [ 0 ], prop: Object({  }) }) ] }) }),
        groupA: Object({ isTyped: true, prop: Object({ A_B: [ Object({ list: [ 8 ], prop: Object({ C: [ Object({ list: [ 12 ], prop: Object({  }) }) ] }) }) ], C: [ Object({ list: [ 8 ], prop: Object({  }) }) ] }) }),
        isNotTyped: Object({ isTyped: false, prop: Object({ A_B: [ Object({ list: [ 13 ], prop: Object({  }) }) ], C: [ Object({ list: [ 13 ], prop: Object({  }) }) ] }) }),
      },
    });
  });
});
