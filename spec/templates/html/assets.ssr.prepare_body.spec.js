const prepareBody = require('../../../src/templates/html/assets/ssr.prepare_body').prepareBody;

describe('template html assets SSR prepareBody', () => {
  it('should set values by path', () => {
    const body = prepareBody({
      'a': 1,
      'b.c': 2,
      'b.d': 3,
      'c': 4,
      'c.d': 5,
      'd[0].e': 6,
      'e[0][1].f[0]': 7,
      'f[]': 8,
      'g[].a': 9,
      'g[].b': 10,
      'h[]': 11,
      'i.j[]': 12,
      'k[]': 13,
      'k.d[]': 14,
      'l[0].m[]': 15,
      'm[0][1].n[0][]': 16,
      'n[][]': 17,
      'o[].a[]': 18,
      'o[].b[]': 19,
    }, [
      { field: { name: 'h' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'i.j' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'k.d' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'l[0].m' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'm[0][1].n[0]' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'n[]' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'o[].a' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
      { field: { name: 'o[].b' }, group: null, type: { modifiers: { list: true }, name: 'string[]' } },
    ]);

    expect(body.body).toEqual({
      a: 1,
      b: {c: 2, d: 3},
      c: {d: 5},
      d: [ {e: 6} ],
      e: [ [ undefined, {f: [ 7 ]} ] ],
      f: [ 8 ],
      g: [ {a: 9, b: 10} ],
      h: [ 11 ],
      i: {j: [ 12 ]},
      k: {d: [ 14 ]},
      l: [ {m: [ 15 ]} ],
      m: [ [ undefined, { n: [ [ 16 ] ]} ] ],
      n: [ [ 17 ] ],
      o: [ {a: [ 18 ], b: [ 19 ]} ],
    });
  });

  it('should parse param values according to param descriptors', () => {
    const body = prepareBody({
      'x[0].a': '1',
      'x[0].b': '0',
      'x[0].c': '1',
      'x[0].d': 'false',
      'x[0].e': 'true',
      'x[0].f': '2000-01-01',
      'x[0].g': '1',
    }, [
      { field: { name: 'x[0].a' }, group: null, type: { modifiers: { initial: 'string' }, name: 'string' } },
      { field: { name: 'x[0].b' }, group: null, type: { modifiers: { initial: 'boolean' }, name: 'boolean' } },
      { field: { name: 'x[0].c' }, group: null, type: { modifiers: { initial: 'boolean' }, name: 'boolean' } },
      { field: { name: 'x[0].d' }, group: null, type: { modifiers: { initial: 'boolean' }, name: 'boolean' } },
      { field: { name: 'x[0].e' }, group: null, type: { modifiers: { initial: 'boolean' }, name: 'boolean' } },
      { field: { name: 'x[0].f' }, group: null, type: { modifiers: { initial: 'isodate' }, name: 'isodate' } },
      { field: { name: 'x[0].g' }, group: null, type: { modifiers: { initial: 'number' }, name: 'number' } },
    ]);

    expect(body.body).toEqual({
      x: [
        {
          a: '1',
          b: false,
          c: true,
          d: false,
          e: true,
          f: '2000-01-01T00:00:00.000Z',
          g: 1,
        },
      ],
    });
  });
});
