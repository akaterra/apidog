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

function getByPath(obj, path) {
  const arrayIndexRegex = /.+(?<!\\)\[(.*?(?<!\\))]$/;
  const pathKeys = path.split('.');
  const pathKeyTypes = [];

  for (let i = 0; i < pathKeys.length; i += 1) {
    let j = i;
    let sub = pathKeys[i];
    let arrayIndex;

    arrayIndex = arrayIndexRegex.exec(pathKeys[i]);

    if (arrayIndex) {
      const pathSlice = [];

      while (true) {
        if (arrayIndex) {
          pathSlice.unshift(arrayIndex[1]);
          pathKeyTypes.push('i');
          i += 1;
          sub = sub.substr(0, sub.length - arrayIndex[1].length - 2);
          arrayIndex = arrayIndexRegex.exec(sub);
        } else {
          pathKeys.splice(j, 1, sub, ...pathSlice);
          pathKeyTypes.splice(j, 0, 'a');
          break;
        }
      }
    } else {
      pathKeyTypes.push('o');
    }
  }

  for (const key of pathKeys) {
    if (obj) {
      obj = obj[key];
    } else {
      break;
    }
  }

  return obj;
}

if (typeof module !== 'undefined') {
  module.exports = {
    del,
    get,
    getByPath,
    has,
  };
}

function parseForm(text) {
  return text.split('&').reduce((acc, pair) => {
    const [key, val] = pair.split('=', 2);

    acc[decodeURIComponent(key)] = decodeURIComponent(val);

    return acc;
  }, {});
}

function parseXML(text) {
  return text
}

function Raw(value) {
  this.value = value;
}

if (typeof module !== 'undefined') {
  module.exports.parseForm = parseForm;
  module.exports.parseXML = parseXML;
  module.exports.Raw = Raw;
}
