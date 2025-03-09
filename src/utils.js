const defaults = require('lodash.defaultsdeep');
const set = require('lodash.set');

const TYPE_TO_DEFAULT_VALUE = {
  boolean: () => true,
  currency: (opts) => opts?.defaultCurrencyValue ?? 'USD',
  date: (opts) => opts.now.slice(0, 10),
  datetime: (opts) => opts.now,
  'date-time': (opts) => opts.now,
  email: (opts) => opts?.defaultEmailValue ?? 'example@example.com',
  file: () => new ParamFile(),
  hostname: (opts) => opts?.defaultHostnameValue ?? 'example.com',
  id: () => 1,
  int32: () => 0,
  int64: () => 0,
  integer: () => 0,
  ipv4: () => '1.2.3.4',
  ipv6: () => '::1',
  latitude: () => 51.477928, // greenwich
  longitude: () => -0.001545, // greenwich
  natural: () => 1,
  negative: () => -0.1,
  negativeinteger: () => -1,
  number: () => 0.1,
  phonenumber: (opts) => opts?.defaultPhoneNumberValue ?? '+1234567890',
  positive: () => 0.1,
  positiveinteger: () => 1,
  password: (opts) => opts?.defaultPasswordValue ?? 'pa$$word',
  secretkey: (opts) => opts?.defaultSecretKeyValue ?? 'secret1234',
  string: () => '',
  time: (opts) => opts.now.slice(11, 19),
  uri: (opts) => opts?.defaultUriValue ?? 'http://example.com',
  url: (opts) => opts?.defaultUrlValue ?? 'http://example.com',
  uuid: () => '10000000-2345-0000-6789-000000000000',
}

class Param {
  get type() {
    return null;
  }

  constructor(value, description) {
    this.description = description;
    this.value = value;
  }

  toJSON() {
    return this.valueOf();
  }

  valueOf() {
    return this.value;
  }
}

class ParamFile extends Param {
  get type() {
    return 'file';
  }

  valueOf() {
    return this.value ?? './example.txt';
  }
}

function convertParamGroupVariantToSampleBody(paramGroupVariant, paramDescriptors, opts, path, sample) {
  if (!sample) {
    sample = {};
  }

  if (!opts?.now) {
    opts = { ...opts, now: new Date().toISOString() };
  }

  Object.entries(paramGroupVariant).forEach(([ propKey, propVariants ]) => {
    const param = paramDescriptors[propVariants[0].list[0]];

    if (!param || param.type?.modifiers?.undefined) {
      return;
    }

    let paramPath = path ? `${path}.${propKey}` : propKey;

    if (param.type?.modifiers?.list) {
      paramPath += '[0]'.repeat(param.type.modifiers.list);
    }

    let paramValue = param.field.defaultValue !== undefined
      ? param.field.defaultValue
      : param.type?.allowedValues?.[0] ?? TYPE_TO_DEFAULT_VALUE[param.type?.modifiers?.initial]?.(opts) ?? null;

    if (opts?.primitiveValueAsParam && !param.type?.modifiers?.object && !(paramValue instanceof Param)) {
      paramValue = new Param(String(paramValue), param.description?.join('\n').trim());
    }

    set(sample, paramPath, paramValue);
    convertParamGroupVariantToSampleBody(propVariants[0].prop, paramDescriptors, opts, paramPath, sample);
  });

  if (Object.keys(sample).length === 1 && sample[module.exports.root]) {
    sample = sample[module.exports.root];
  }

  return sample;
}

function convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith(src, paramGroupVariant, paramDescriptors, opts, path, sample) {
  sample = defaults(
    src,
    convertParamGroupVariantToSampleBody(paramGroupVariant, paramDescriptors, opts, path, sample),
  );

  return sample;
}

function contentTypeToInternalContentType(contentType) {
  switch (contentType.toLowerCase().replace(/\s+$/, '')) {
    case 'application/json':
      return 'json';
    case 'application/xml':
      return 'xml';
    case 'application/x-www-form-urlencoded':
      return 'form';
    case 'multipart/form-data':
      return 'multipart';
    default:
      return 'json';
  }
}

function forEach(iterable, fn, ...args) {
  let index = 0;

  for (const value of iterable) {
    if (fn(value, index, iterable.length !== undefined && iterable.length === index + 1, ...args) === false) {
      break;
    }

    index += 1;
  }
}

function isNotEmpty(value) {
  return value !== null && value !== undefined && value !== '';
}

function quote(val) {
  if (typeof val === 'string' && (val.indexOf(' ') !== - 1 || val.indexOf(',') !== - 1)) {
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

/**
 * a.b.c -> ['a', 'b' 'c']
 * a[0].b -> ['a', '0', 'b']
 * a."b.c" -> ['a', 'b.c']
 * a."b\"c" -> ['a', 'b"c']
 * a..b.c -> ['a', '', 'b', 'c']
 * a...b.c -> ['a', '', 'b', 'c']
 * a.b.c. -> ['a', 'b', 'c']
 * .a.b.c -> ['a', 'b', 'c']
 */
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
            if (sub || rul.TP === 'index' || chunks.at(-1) || chunks.length === 0) {
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

  if (chunks.length > 1 && chunks.at(-1) === '') {
    chunks.pop();
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

  warn(message, ...arg) {
    console.warn(this.generateMessage(message), ...arg);

    return this;
  }

  throw(error, ...arg) {
    console.warn(this.generateMessage(String(error)), ...arg);

    throw error;
  }

  generateMessage(message) {
    return `${message} [ file: ${this.file}:${this.lineNum} line: "${this.line ? this.line.trim() : ''}" ]`;
  }
}

module.exports = {
  convertParamGroupVariantToSampleBody,
  convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith,
  contentTypeToInternalContentType,
  forEach,
  isNotEmpty,
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
  root: String.fromCharCode(255), // Symbol('root'),
  Param,
  ParamFile,
};
