const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiSampleRequestVariable annotation', () => {
  it('should parse', () => {
    const lines = [
      '@apiSampleRequestVariable name1',
      '@apiSrVariable name2=123',
      '@apiSampleRequestVariable {response.name} name3',
      '@apiSrVariable {response.name} name4=123',
      '@apiSampleRequestVariable (namespace) name1',
      '@apiSrVariable (namespace) name2=123',
      '@apiSampleRequestVariable (namespace) {response.name} name3',
      '@apiSrVariable (namespace) {response.name} name4=123',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      sampleRequestVariable: [
        {
          field: {defaultValue: null, name: 'name1'},
          ns: null,
          responsePath: null,
        },
        {
          field: {defaultValue: '123', name: 'name2'},
          ns: null,
          responsePath: null,
        },
        {
          field: {defaultValue: null, name: 'name3'},
          ns: null,
          responsePath: 'response.name',
        },
        {
          field: {defaultValue: '123', name: 'name4'},
          ns: null,
          responsePath: 'response.name',
        },
        {
          field: {defaultValue: null, name: 'name1'},
          ns: 'namespace',
          responsePath: null,
        },
        {
          field: {defaultValue: '123', name: 'name2'},
          ns: 'namespace',
          responsePath: null,
        },
        {
          field: {defaultValue: null, name: 'name3'},
          ns: 'namespace',
          responsePath: 'response.name',
        },
        {
          field: {defaultValue: '123', name: 'name4'},
          ns: 'namespace',
          responsePath: 'response.name',
        },
      ],
    })
  });

  it('should raise error on malformed definition', () => {
    const lines = [
      '@apiSampleRequestVariable',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
