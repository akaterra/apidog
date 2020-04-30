const utils = require('../src/utils');

describe('utils', () => {
  it('should strSplitByQuotedTokens', () => {
    expect(utils.strSplitByQuotedTokens(`a , b,"c" , "d,e"`)).toEqual(['a', 'b', 'c', 'd,e']);
  });
});
