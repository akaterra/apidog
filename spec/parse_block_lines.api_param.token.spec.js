const parse = require('../src/parse');

describe('parse @apiParam token by parseBlockLines', () => {
  it('should parse multiple params', () => {
    const lines = [
      '@apiParam A_B.C',
      '@apiParam A_B.C This is a description',
      '@apiParam A_B.C This is a description', 'Some description',
      '@apiParam A_B.C=A This is a description',
      '@apiParam A_B.C="A B C" This is a description',
      '@apiParam [A_B.C] This is a description',
      '@apiParam [A_B.C=A] This is a description',
      '@apiParam [A_B.C="A B C"] This is a description',
      '@apiParam (groupA) A_B.C This is a description',
      '@apiParam {typeA} A_B.C This is a description',
      '@apiParam {typeA=A,B,C} A_B.C This is a description',
      '@apiParam {typeA="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiParam (groupA) {typeA="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
    ];

    expect(parse.parseBlockLines(lines)).toEqual({
      params: [{
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
      paramsGroups: {
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

  it('should parse multiple params prefixed by @apiParamPrefix', () => {
    const lines = [
      '@apiParamPrefix prefix.',
      '@apiParam A_B.C',
    ];

    expect(parse.parseBlockLines(lines).params).toEqual([
      {
        description: [],
        field: { defaultValue: null, name: 'prefix.A_B.C' },
        group: null,
        type: null,
      }
    ]);
  });
});
