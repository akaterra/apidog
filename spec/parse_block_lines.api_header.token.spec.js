const parse = require('../src/parse');

describe('parse @apiHeader token by parseBlockLines', () => {
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
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      headers: [{
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
    });
  });
});
