const generator = require('../src/generator');

const hbs = () => {
  const hbsInstance = {
    compile: (template) => {
      hbsInstance.template = template;

      return (params) => {
        hbsInstance.params = params;

        return '';
      }
    },
    registerHelper(name, fn) {},
  };

  return hbsInstance;
};

describe('generator', () => {
  it('should generate with public filtering', () => {
    const blocks = [
      {
        $id: 0, api: {transport: {name: 'test'}}, private: true,
      },
      {
        $id: 1, api: {transport: {name: 'test'}}, private: false,
      },
      {
        $id: 2, api: {transport: {name: 'test'}}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {transport: {name: 'test'}}, private: ['a'],
      },
      {
        $id: 4, api: {transport: {name: 'test'}},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {}, {}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([1, 4]);
  });

  it('should generate with private filtering', () => {
    const blocks = [
      {
        $id: 0, api: {transport: {name: 'test'}}, private: true,
      },
      {
        $id: 1, api: {transport: {name: 'test'}}, private: false,
      },
      {
        $id: 2, api: {transport: {name: 'test'}}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {transport: {name: 'test'}}, private: ['a'],
      },
      {
        $id: 4, api: {transport: {name: 'test'}},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {}, {private: true}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([0, 2, 3]);
  });

  it('should generate with private filtering of slices', () => {
    const blocks = [
      {
        $id: 0, api: {transport: {name: 'test'}}, private: true,
      },
      {
        $id: 1, api: {transport: {name: 'test'}}, private: false,
      },
      {
        $id: 2, api: {transport: {name: 'test'}}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {transport: {name: 'test'}}, private: ['a'],
      },
      {
        $id: 4, api: {transport: {name: 'test'}},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {}, {private: ['a', 'b']}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([0, 2]);
  });
});

describe('generate sections', () => {
  it('should generate sections', () => {
    const A = {
      name: 'A',
    };
    const B = {
      name: 'B',
    };
    const blocks = [
      {
        api: {endpoint: 'endpoint'}, chapter: A, group: A, name: 'A', subgroup: A, title: 'A', version: '1',
      },
      {
        api: {}, chapter: A, family: 'a', group: A, name: 'A', subgroup: B, title: 'A', version: '2',
      },
      {
        api: {}, chapter: A, family: 'b', group: B, name: 'B', subgroup: B, title: 'B', version: '1',
      },
      {
        api: {endpoint: 'endpoint'}, chapter: B, group: A, name: 'A', subgroup: A, title: 'A', version: '1',
      },
      {
        api: {}, chapter: B, family: 'a', group: B, name: 'A', subgroup: A, title: 'A', version: '2',
      },
      {
        api: {}, chapter: B, family: 'b', group: B, name: 'B', subgroup: B, title: 'B', version: '1',
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections).toEqual({

      // chapter A
      A: {

        // group A
        A: {
          A: {
            endpoint__: {
              1: {
                api: {endpoint: 'endpoint'},
                chapter: A,
                contentType: ['form'],
                family: 'endpoint__',
                familyId: 'A___A___A___endpoint__',
                group: A,
                id: 'A___A___A___endpoint_____1',
                name: 'A',
                params: [],
                subgroup: A,
                title: 'A',
                version: '1',
                visualId: 'A___A___A___A___1',
              },
            },
          },
          B: {
            a: {
              2: {
                api: {},
                chapter: A,
                contentType: ['form'],
                family: 'a',
                familyId: 'A___A___B___a',
                group: A,
                id: 'A___A___B___a___2',
                name: 'A',
                params: [],
                subgroup: B,
                title: 'A',
                version: '2',
                visualId: 'A___A___B___A___2',
              },
            },
          },
        },

        // group B
        B: {
          B: {
            b: {
              1: {
                api: {},
                chapter: A,
                contentType: ['form'],
                family: 'b',
                familyId: 'A___B___B___b',
                group: B,
                id: 'A___B___B___b___1',
                name: 'B',
                params: [],
                subgroup: B,
                title: 'B',
                version: '1',
                visualId: 'A___B___B___B___1',
              },
            },
          },
        },
      },

      // chapter B
      B: {

        // group A
        A: {
          A: {
            endpoint__: {
              1: {
                api: {endpoint: 'endpoint'},
                chapter: B,
                contentType: ['form'],
                family: 'endpoint__',
                familyId: 'B___A___A___endpoint__',
                group: A,
                id: 'B___A___A___endpoint_____1',
                name: 'A',
                params: [],
                subgroup: A,
                title: 'A',
                version: '1',
                visualId: 'B___A___A___A___1',
              },
            },
          },
        },

        // group B
        B: {
          A: {
            a: {
              2: {
                api: {},
                chapter: B,
                contentType: ['form'],
                family: 'a',
                familyId: 'B___B___A___a',
                group: B,
                id: 'B___B___A___a___2',
                name: 'A',
                params: [],
                subgroup: A,
                title: 'A',
                version: '2',
                visualId: 'B___B___A___A___2',
              },
            },
          },
          B: {
            b: {
              1: {
                api: {},
                chapter: B,
                contentType: ['form'],
                family: 'b',
                familyId: 'B___B___B___b',
                group: B,
                id: 'B___B___B___b___1',
                name: 'B',
                params: [],
                subgroup: B,
                title: 'B',
                version: '1',
                visualId: 'B___B___B___B___1',
              },
            },
          },
        },
      },
    });
  });

  it('should generate sections filling default chapter', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.null.null.null.endpoint__['0.0.1'].chapter).toEqual({description: [], name: null, title: null});
  });

  it('should generate sections filling default group', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.null.null.null.endpoint__['0.0.1'].group).toEqual({description: [], name: null, title: null});
  });

  it('should generate sections filling default subgroup', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.null.null.null.endpoint__['0.0.1'].subgroup).toEqual({description: [], name: null, title: null});
  });

  it('should generate sections filling default version', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.null.null.null.endpoint__['0.0.1'].version).toEqual('0.0.1');
  });

  it('should generate sections skipping "ignore" blocks', () => {
    const blocks = [{ ignore: true }];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections).toEqual({});
  });

  // it('should raise exception on unknown use', () => {
  //   const blocks = [{ api: {}, use: ['unknown'] }];
  //
  //   expect(() => generate.generateSections(blocks)).toThrow();
  // });
});
