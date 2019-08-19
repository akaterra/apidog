const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSuccess token', () => {
  it('should parse multiple errors', () => {
    const lines = [
      '@apiSuccess A_B.C',
      '@apiSuccess A_B.C This is a description',
      '@apiSuccess A_B.C This is a description', 'Some description',
      '@apiSuccess A_B.C=A This is a description',
      '@apiSuccess A_B.C="A B C" This is a description',
      '@apiSuccess [A_B.C] This is a description',
      '@apiSuccess [A_B.C=A] This is a description',
      '@apiSuccess [A_B.C="A B C"] This is a description',
      '@apiSuccess (groupA) A_B.C This is a description',
      '@apiSuccess {typeA} A_B.C This is a description',
      '@apiSuccess {typeA=A,B,C} A_B.C This is a description',
      '@apiSuccess {typeA="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiSuccess (groupA) {typeA="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      successs: [{ // 0
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
        type: { allowedValues: [], modifiers: { typea: true }, name: 'typeA' },
      }, { // 10
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], modifiers: { typea: true }, name: 'typeA' },
      }, { // 11
        description: ['This is a description'],
        field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { typea: true }, name: 'typeA' },
      }, { // 12
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { typea: true }, name: 'typeA' },
      }],
      successsGroups: {
        $: [{ // 0
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
          type: { allowedValues: [], modifiers: { typea: true }, name: 'typeA' },
        }, { // 9
          description: ['This is a description'],
          field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
          group: null,
          type: { allowedValues: ['A', 'B', 'C'], modifiers: { typea: true }, name: 'typeA' },
        }, { // 10
          description: ['This is a description'],
          field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
          group: null,
          type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { typea: true }, name: 'typeA' },
        }],
        groupA: [{ // 0
          description: ['This is a description'],
          field: { defaultValue: null, isOptional: false, name: 'A_B.C' },
          group: 'groupA',
          type: null,
        }, { // 1
          description: ['This is a description'],
          field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
          group: 'groupA',
          type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { typea: true }, name: 'typeA' },
        }],
      }
    });
  });
});