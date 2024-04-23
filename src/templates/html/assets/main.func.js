function del(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      delete obj[key];
    } else {
      return false;
    }
  }

  return true;
}

function get(obj, path, defaultValue) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return defaultValue;
    }
  }

  return obj;
}

function has(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return false;
    }
  }

  return true;
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

function strToPathEscaped(str) {
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

// function getByPath(obj, path) {
//   const arrayIndexRegex = /.*[^\\]\[(.*)\]$/; // /.+(?<!\\)\[(.*?(?<!\\))]$/;
//   const pathKeys = path.split('.');
//   const pathKeyTypes = [];

//   for (let i = 0; i < pathKeys.length; i += 1) {
//     let j = i;
//     let sub = pathKeys[i];
//     let arrayIndex;

//     arrayIndex = arrayIndexRegex.exec(pathKeys[i]);

//     if (arrayIndex) {
//       const pathSlice = [];

//       while (true) {
//         if (arrayIndex) {
//           pathSlice.unshift(arrayIndex[1]);
//           pathKeyTypes.push('i');
//           i += 1;
//           sub = sub.substr(0, sub.length - arrayIndex[1].length - 2);
//           arrayIndex = arrayIndexRegex.exec(sub);
//         } else {
//           pathKeys.splice(j, 1, sub, ...pathSlice);
//           pathKeyTypes.splice(j, 0, 'a');
//           break;
//         }
//       }
//     } else {
//       pathKeyTypes.push('o');
//     }
//   }

//   for (const key of pathKeys) {
//     if (obj) {
//       obj = obj[key];
//     } else {
//       break;
//     }
//   }

//   return obj;
// }

// if (typeof module !== 'undefined') {
//   module.exports = {
//     del,
//     get,
//     // getByPath,
//     has,
//   };
// }

function parseForm(text) {
  return text.split('&').reduce((acc, pair) => {
    const [key, val] = pair.split('=', 2);

    acc[decodeURIComponent(key)] = decodeURIComponent(val);

    return acc;
  }, {});
}

function parseXML(text) {
  return text;
}

function parseUrl(url) {
  const a = document.createElement("a");

  a.href = url;

  return {
    fullPath: `${a.hostname}:${a.port || 80}${a.pathname || ''}`,
    host: a.hostname,
    path: a.pathname,
    port: a.port,
    queryParams: a.search ? parseForm(a.search.substr(1)) : {},
  };
};

function Raw(value) {
  this.value = value;
}

if (typeof module !== 'undefined') {
  module.exports = {
    del,
    get,
    has,
    parseForm,
    parseXML,
    Raw,
    strToPathEscaped,
  };
}
