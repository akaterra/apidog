function quote(val) {
  if (typeof val === 'string' && val.indexOf(' ') !== - 1) {
    return `"${val.replace(/"/g, '\\"')}"`;
  }

  return val;
}

function strSplitBy(str, splitter, limit, trim) {
  if (str) {
    const splitted = str.trim().split(splitter);
    const splittedWithRest = [];

    for (let i = 0; i < splitted.length; i += 1) {
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


class Logger {
  constructor() {
    this.file = null;
    this.line = null;
    this.lineNum = null;
  }

  setFile(file) {
    this.file = file;

    return this;
  }

  setLine(line) {
    this.line = line;

    return this;
  }

  setLineNum(lineNum) {
    this.lineNum = lineNum;

    return this;
  }

  info(message) {
    console.info(this.generateMessage(message));

    return this;
  }

  warn(message) {
    console.warn(this.generateMessage(message));

    return this;
  }

  throw(error) {
    error = String(error);

    throw new Error(this.generateMessage(error));
  }

  generateMessage(message) {
    return `${message} [ file: ${this.file}:${this.lineNum} line: "${this.line ? this.line.trim() : ''}" ]`;
  }
}

module.exports = {
  quote,
  strExtractByCurlyBrackets,
  strExtractByBrackets,
  strExtractByRoundBrackets,
  strSplitBy,
  strSplitByComma,
  strSplitByQuotedTokens,
  strSplitBySpace,
  Logger,
  logger: new Logger(),
};
