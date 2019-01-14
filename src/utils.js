function strSplitBy(str, splitter, limit, trim) {
  if (str) {
    var splitted = str.trim().split(splitter);
    var splittedWithRest = [];

    for (var i = 0; i < splitted.length; i ++) {
      if (splitted[i] !== '') {
        splittedWithRest.push(trim ? splitted[i].trim() : splitted[i]);

        if (splittedWithRest.length === limit) {
          i += 1;

          while (i < splitted.length) {
            if (splitted[i] !== '') {
              break;
            }

            i += 1;
          }

          splittedWithRest.push(splitted.slice(i).join(splitter));

          break;
        }
      }
    }

    return splittedWithRest;
  }

  return [];
}

function strSplitByComma(str, limit) {
  return strSplitBy(str, ',', limit, true);
}

function strSplitBySpace(str, limit) {
  return strSplitBy(str, ' ', limit);
}

function strSplitByQuotedTokens(str) {
  return str.match(/(".*?(?<!\\)"|[^",\s]+)(?=\s*,|\s*$)/g).map((term) => term.replace(/^"(.*)"$/, '$1'));
}

function strExtractByRegex(str, regex) {
  var strExtracted = str.match(regex);

  if (strExtracted) {
    return strExtracted[1];
  }

  return null;
}

function strExtractByCurlyBrackets(str) {
  return strExtractByRegex(str, /^\{(.*)\}$/);
}

function strExtractByBrackets(str) {
  return strExtractByRegex(str, /^\((.*)\)$/);
}

function strExtractByRoundBrackets(str) {
  return strExtractByRegex(str, /^\[(.*)\]$/);
}

module.exports = {
  strExtractByCurlyBrackets: strExtractByCurlyBrackets,
  strExtractByBrackets: strExtractByBrackets,
  strExtractByRoundBrackets: strExtractByRoundBrackets,
  strSplitBy: strSplitBy,
  strSplitByComma: strSplitByComma,
  strSplitByQuotedTokens: strSplitByQuotedTokens,
  strSplitBySpace: strSplitBySpace,
}
