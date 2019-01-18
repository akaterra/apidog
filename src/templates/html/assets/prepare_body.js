const arrayIndexRegex = /.+(?<!\\)\[(.*?(?<!\\))]$/;

const prepareBody = (params, paramsDescriptors) => {
  const body = {};

  Object.keys(params).forEach((key) => {
    const paramsDescriptor = paramsDescriptors && paramsDescriptors.find((param) => param.field.name === key);
    const pathKeys = key.split('.');
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

    const type = paramsDescriptor && paramsDescriptor.type.name.split(':')[0].toLowerCase();

    let value = params[key];

    if (paramsDescriptor) {
      if (paramsDescriptor.type.modifiers.none) {
        value = params[key] === '' ? void 0 : params[key];
      } else if (paramsDescriptor && paramsDescriptor.type.modifiers.null) {
        value = params[key] === '' ? null : params[key];
      }
    }

    const [typeSimple, typeIsArray] = type && type.substr(-2, 0) === '[]'
      ? [type.substr(0, -2), true]
      : [type, false];

    if (value !== null && value !== void 0) {
      if (typeIsArray) {
        value = [];
      } else {
        switch (typeSimple) {
          case 'array':
            value = [];

            break;

          case 'boolean':
            value = value === '' ? void 0 : (params[key] === '1' || params[key] === 'true');

            break;

          case 'isodate':
            value = value === '' ? void 0 : new Date(params[key]).toISOString();

            break;

          case 'number':
            value = value === '' ? void 0 : Number(params[key]);

            break;

          case 'object':
            value = {};

            break;
        }
      }
    }

    if (value !== void 0) {
      let bodyNode = body;

      pathKeyTypes.forEach((type, typeIndex) => {
        const key = pathKeys[typeIndex];

        if (typeIndex === pathKeys.length - 1) {
          if (Array.isArray(bodyNode)) {
            let ind = key === '' ? 0 : parseInt(key);

            if (ind < 0) {
              throw new Error(`Invalid array index ${key}`);
            }

            const bodyNodeLength = bodyNode.length;

            while (ind >= bodyNodeLength) {
              bodyNode.push(void 0);

              ind -= 1;
            }

            bodyNode[key === '' ? 0 : parseInt(key)] = value;
          } else {
            bodyNode[key] = value;
          }
        } else {
          switch (type) {
            case 'a':
              if (! (key in bodyNode) || ! Array.isArray(bodyNode[key])) {
                bodyNode[key] = [];
              }

              break;

            case 'i':
              let ind = key === '' ? 0 : parseInt(key);

              if (ind < 0) {
                throw new Error(`Invalid array index ${key}`);
              }

              const bodyNodeLength = bodyNode.length;

              while (ind >= bodyNodeLength) {
                bodyNode.push(void 0);

                ind -= 1;
              }

              if (! (key in bodyNode) || bodyNode[key] === void 0) {
                bodyNode[key] = pathKeyTypes[typeIndex + 1] === 'i' ? [] : {};
              }

              break;

            default:
              if (! (key in bodyNode) || bodyNode[key] === null || typeof bodyNode[key] !== 'object') {
                bodyNode[key] = {};
              }
          }

          bodyNode = bodyNode[key];
        }
      });
    }
  });

  return body;
};

if (typeof module !== 'undefined') {
  module.exports.prepareBody = prepareBody;
}
