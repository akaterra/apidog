const parse = require('../src/parse');

describe('parse @apiError token by parseBlockLines', () => {
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
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      errors: [{
        description: [],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description', 'Some description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: 'A', name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: 'A B C', name: 'A_B.C' },
        group: null,
        type: null
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: 'A', name: 'A_B.C' },
        group: null,
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: 'A B C', name: 'A_B.C' },
        group: null,
        type: null
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: 'groupA',
        type: null,
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: { allowedValues: [], name: 'typeA' },
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], name: 'typeA' },
      }, {
        description: ['This is a description'],
        field: { defaultValue: null, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], name: 'typeA' },
      }, {
        description: ['This is a description'],
        field: { defaultValue: 'A B C', name: 'A_B.C' },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], name: 'typeA' },
      }],
      errorsGroups: {
        $: [{
          description: [],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description', 'Some description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: 'A', name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: 'A B C', name: 'A_B.C' },
          group: null,
          type: null
        }, {
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: 'A', name: 'A_B.C' },
          group: null,
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: 'A B C', name: 'A_B.C' },
          group: null,
          type: null
        }, {
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: { allowedValues: [], name: 'typeA' },
        }, {
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: { allowedValues: ['A', 'B', 'C'], name: 'typeA' },
        }, {
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: null,
          type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], name: 'typeA' },
        }],
        groupA: [{
          description: ['This is a description'],
          field: { defaultValue: null, name: 'A_B.C' },
          group: 'groupA',
          type: null,
        }, {
          description: ['This is a description'],
          field: { defaultValue: 'A B C', name: 'A_B.C' },
          group: 'groupA',
          type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], name: 'typeA' },
        }],
      }
    });
  });
});
