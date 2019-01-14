const parse = require('../src/parse');

describe('parse @apiSuccess token by parseBlockLines', () => {
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

    expect(parse.parseBlockLines(lines)).toEqual({
      successs: [{
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
      successsGroups: {
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
