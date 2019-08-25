const parseForm = require('../../../src/templates/html/assets/main.func').parseForm;
const parseXML = require('../../../src/templates/html/assets/main.func').parseXML;

describe('template html assets parseForm', () => {
  it('should parse', () => {
    expect(parseForm('a=1&b=2&c=3')).toEqual({
      a: '1',
      b: '2',
      c: '3',
    });
  });
});

describe('template html assets parseXML', () => {
  it('should parse', () => {

  });
});
