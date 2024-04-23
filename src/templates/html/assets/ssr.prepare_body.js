function prepareBody(params, paramDescriptors, paramsGroup) {
  if (paramsGroup === '$') {
    paramsGroup = null; // :( refactor
  } else if (!paramsGroup) {
    paramsGroup = null;
  }

  const arrayIndexRegex = /^([0-9]|[1-9]\d+)$/;
  const body = {
    body: {},
    type: 'params',
  };

  Object.entries(params).forEach(([key, val]) => {
    let paramsDescriptor;

    if (Array.isArray(val)) {
      paramsDescriptor = paramDescriptors && paramDescriptors[val[1]];
      val = val[0];
    } else {
      paramsDescriptor = paramDescriptors && paramDescriptors.find((param) => param.field.name === key && param.group === paramsGroup);
    }

    if (paramsDescriptor && paramsDescriptor.type) {
      switch (paramsDescriptor.type.modifiers.initial) {
        case 'file':
        case 'parametrizedbody':
        case 'rawbody':
          body.type = paramsDescriptor.type.modifiers.initial;
      }
    }
  });

  Object.entries(params).forEach(([key, val]) => {
    let paramsDescriptor;

    if (Array.isArray(val)) {
      paramsDescriptor = paramDescriptors && paramDescriptors[val[1]];
      val = val[0];
    } else {
      paramsDescriptor = paramDescriptors && paramDescriptors.find((param) => param.field.name === key && param.group === paramsGroup);
    }

    const pathKeys = paramsDescriptor?.field.path ?? strSplitByPathEscaped(key);
    const type = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.initial;
    const typeIsList = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.list;
    const typeIsOptional = paramsDescriptor && paramsDescriptor.field && paramsDescriptor.field.isOptional;
    const typeModifiers = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers;

    if (typeIsList) {
      pathKeys.push('0');
    }

    if (paramsDescriptor) {
      if (val === '') {
        if (typeModifiers && typeModifiers.none) {
          return;
        }

        if (typeModifiers && typeModifiers.optional) {
          return;
        }
      }

      if (val === '' || val === 'null') {
        if (typeModifiers && typeModifiers.nullable) {
          val = null;
        }
      }
    }

    if (val !== null && val !== undefined) {
      switch (type) {
        case 'array':
          val = [];

          break;

        case 'boolean':
          val = val === true || val === 'true' || val === 1 || val === '1';

          break;

        case 'isodate':
          val = new Date(val).toISOString();

          break;

        case 'json':
          val = JSON.parse(val);
    
          break;

        case 'null':
          val = null;

          break;

        case 'number':
          val = Number(val);

          break;

        case 'object':
          val = {};

          break;
      }
    }

    if (val !== undefined) {
      if (typeModifiers) {
        if (typeModifiers.singleline) {
          if (typeof val === 'string') {
            val = val.replace(/(?:\r\n|\r|\n)/g, '');
          }
        }
      }

      if (body.type !== 'params') {
        body.body[key] = val;
      } else {
        let bodyNode = body;
        let bodyNodeKey = 'body';

        pathKeys.forEach((key, ind) => {
          if (key === '') {
            key = '0';
          }

          const isArrayIndex = arrayIndexRegex.test(key);

          if (isArrayIndex) {
            if (!Array.isArray(bodyNode[bodyNodeKey])) {
              bodyNode[bodyNodeKey] = [];
            }
          } else {
            if (!bodyNode[bodyNodeKey] || typeof bodyNode[bodyNodeKey] !== 'object') {
              bodyNode[bodyNodeKey] = {};
            }
          }

          if (ind === pathKeys.length - 1) {
            bodyNode[bodyNodeKey][key] = val;
          } else {
            bodyNode = bodyNode[bodyNodeKey];
            bodyNodeKey = key;
          }
        });
      }
    }
  });

  return body;
};

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

if (typeof module !== 'undefined') {
  module.exports.prepareBody = prepareBody;
}
