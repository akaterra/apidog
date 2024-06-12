function forEach(iterable, fn, ...args) {
  let index = 0;

  for (const value of iterable) {
    if (fn(value, index, iterable.length !== undefined && iterable.length === index + 1, ...args) === false) {
      break;
    }

    index += 1;
  }
}

function quote(val) {
  if (typeof val === 'string') {
    return `"${val.replace(/"/g, '\\"')}"`;
  }

  return String(val);
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

const PUSH = 0;
const NEXT = 1;
const NOOP = 2;
const A = {
  0: { '.': { OP: PUSH, ST: 0 }, '[': { OP: PUSH, ST: 1 }, '"': { OP: NEXT, ST: 3 } },
  1: { ']': { OP: PUSH, ST: 2, TP: 'index' }, '"': { OP: NOOP, ST: 4 } },
  2: { '.': { OP: NEXT, ST: 0 }, '[': { OP: NEXT, ST: 1 }, '*': { RG: /./, OP: NOOP, ST: 0 } },
  3: { '"': { OP: PUSH, ST: 0 } },
  4: { '"': { OP: NOOP, ST: 1 } },
};

function strSplitByPathEscaped(str) {
  const chunks = [];
  let st = 0;
  let sub = '';
  let i = 0;
  let s = 0;

  while (i < str.length) {
    const sym = str[i];
    const rul = A[st][sym] ?? A[st]['*'];

    if (rul) {
      if (!rul.RG || rul.RG.test(sym)) {
        switch (rul.OP) {
          case PUSH:
            if (sub || rul.TP === 'index') {
              chunks.push(sub);
              sub = '';
            }
            // no break
          case NEXT:
            s = i + 1;
            break;
          case NOOP:
            break;
          default:
            sub += sym;
        }
  
        st = rul.ST;
      }
    } else {
      sub += sym;
    }

    i += 1;
  }

  if (s < str.length) {
    chunks.push(str.slice(s));
  }

  return chunks;
}

function strSplitByEscaped(str, splitter = '.') {
  return str.split(new RegExp(`(?<!\\\\)\\${splitter}`, 'g')).map((term) => term.replace('\\', ''));
}

function strSplitByQuotedTokens(str, splitter = ',') {
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
    console.warn(this.generateMessage(String(error)));

    throw error;
  }

  generateMessage(message) {
    return `${message} [ file: ${this.file}:${this.lineNum} line: "${this.line ? this.line.trim() : ''}" ]`;
  }
}

module.exports = {
  forEach,
  quote,
  strExtractByCurlyBrackets,
  strExtractByBrackets,
  strExtractByRoundBrackets,
  strSplitBy,
  strSplitByComma,
  strSplitByEscaped,
  strSplitByPathEscaped,
  strSplitByQuotedTokens,
  strSplitBySpace,
  Logger,
  logger: new Logger(),
};
