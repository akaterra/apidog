const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiError annotation', () => {
  it('should parse multiple errors', () => {
    const lines = [
      '@apiError A_B.C',
      '@apiError A_B.C This is a description',
      '@apiError A_B.C This is a description', 'Some description',
      '@apiError A_B.C=A This is a description',
      '@apiError A_B.C="A B C" This is a description',
      '@apiError [A_B.C] This is a description',
      '@apiError [A_B.C=A] This is a description',
      '@apiError [A_B.C="A B C"] This is a description',
      '@apiError (groupA) A_B.C This is a description',
      '@apiError {typeA} A_B.C This is a description',
      '@apiError {typeA=A,B,C} A_B.C This is a description',
      '@apiError {typeA="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiError (groupA) {typeA="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
      '@apiError (isNotTyped) A_B.C This is a description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      errors: [{ // 0
        description: [],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 1
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 2
        description: ['This is a description', 'Some description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
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
        field: { defaultValue: null, isOptional: true, name: 'A_B.C' },
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
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: 'groupA',
        type: null,
      }, { // 9
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 10
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 11
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 12
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 13
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: 'isNotTyped',
        type:null,
      }],
      errorsGroups: {
        $: {
          isTyped: true,
          list: [{ // 0
            description: [],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: null,
            type: null,
          }, { // 1
            description: ['This is a description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: null,
            type: null,
          }, { // 2
            description: ['This is a description', 'Some description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
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
            field: { defaultValue: null, isOptional: true, name: 'A_B.C' },
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
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: null,
            type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
          }, { // 9
            description: ['This is a description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: null,
            type: { allowedValues: ['A', 'B', 'C'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
          }, { // 10
            description: ['This is a description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: null,
            type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
          }],
        },
        groupA: {
          isTyped: true,
          list: [{
            description: ['This is a description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: 'groupA',
            type: null,
          }, {
            description: ['This is a description'],
            field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
            group: 'groupA',
            type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
          }],
        },
        isNotTyped: {
          isTyped: false,
          list: [{ // 0
            description: ['This is a description'],
            field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
            group: 'isNotTyped',
            type: null,
          }],
        },
      },
    });
  });
});
