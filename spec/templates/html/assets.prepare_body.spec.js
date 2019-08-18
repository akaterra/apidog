const prepareBody = require('../../../src/templates/html/assets/prepare_body').prepareBody;

describe('template html assets prepareBody', () => {
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
    });

    expect(body.data).toEqual({
      a: 1,
      b: {c: 2, d: 3},
      c: {d: 5},
      d: [ {e: 6} ],
      e: [ [ void 0, {f: [ 7 ]} ] ],
      f: [ 8 ],
      g: [ {a: 9, b: 10} ],
    });
  });

  it('should parse param values according to param descriptors', () => {
    const body = prepareBody({
      'x[0].a': '1',
      'x[0].b': '0',
      'x[0].c': '1',
      'x[0].d': 'false',
      'x[0].e': 'true',
      'x[0].f': '2000-01-01'
    }, [
      { field: { name: 'x[0].a' }, type: { modifiers: {}, name: 'string' } },
      { field: { name: 'x[0].b' }, type: { modifiers: {}, name: 'boolean' } },
      { field: { name: 'x[0].c' }, type: { modifiers: {}, name: 'boolean' } },
      { field: { name: 'x[0].d' }, type: { modifiers: {}, name: 'boolean' } },
      { field: { name: 'x[0].e' }, type: { modifiers: {}, name: 'boolean' } },
      { field: { name: 'x[0].f' }, type: { modifiers: {}, name: 'isodate' } },
    ]);

    expect(body.data).toEqual({
      x: [
        {
          a: '1',
          b: false,
          c: true,
          d: false,
          e: true,
          f: '2000-01-01T00:00:00.000Z',
        },
      ],
    });
  });
});
