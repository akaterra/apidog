function prepareBody (params, paramsDescriptors, paramsGroup) {
  if (paramsGroup === '$') {
    paramsGroup = null; // :( refactor
  }

  const arrayIndexRegex = /.+(?<!\\)\[(.*?(?<!\\))]$/;
  const body = {
    body: {},
    type: 'params',
  };

  Object.entries(params).forEach(([key, val]) => {
    const paramsDescriptor = paramsDescriptors && paramsDescriptors.find((param) => param.field.name === key && param.group === paramsGroup);

    if (paramsDescriptor && paramsDescriptor.type) {
      switch (paramsDescriptor.type.modifiers.self) {
        case 'file':
        case 'parametrizedbody':
        case 'rawbody':
          body.type = paramsDescriptor.type.modifiers.self;
      }
    }
  });

  Object.entries(params).forEach(([key, val]) => {
    const paramsDescriptor = paramsDescriptors && paramsDescriptors.find((param) => param.field.name === key && param.group === paramsGroup);
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

    if (paramsDescriptor && paramsDescriptor.type.name.slice(-2) === '[]') {
      pathKeys.push(0);

      if (pathKeyTypes[pathKeyTypes.length - 1] !== 'i') {
        pathKeyTypes[pathKeyTypes.length - 1] = 'a';
      }

      pathKeyTypes.push('i');
    }

    if (paramsDescriptor) {
      if ((paramsDescriptor.type && paramsDescriptor.type.modifiers.none) || (paramsDescriptor.field && paramsDescriptor.field.isOptional)) {
        val = params[key] === '' ? void 0 : params[key];
      } else if (paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.null) {
        val = params[key] === '' ? null : params[key];
      }
    }

    const type = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.self;
    const typeIsList = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.list;

    if (val !== null && val !== void 0) {
      if (typeIsList) {

      } else {
        switch (type) {
          case 'array':
            val = [];

            break;

          case 'boolean':
            val = val === '' ? void 0 : (params[key] === '1' || params[key] === 'true');

            break;

          case 'isodate':
            val = val === '' ? void 0 : new Date(params[key]).toISOString();

            break;

          case 'number':
            val = val === '' ? void 0 : Number(params[key]);

            break;

          case 'object':
            val = {};

            break;
        }
      }
    }

    if (val !== void 0) {
      if (body.type !== 'params') {
        body.body[key] = val;
      } else {
        let bodyNode = body.body;

        pathKeyTypes.forEach((type, typeIndex) => {
          let key = pathKeys[typeIndex];

          if (typeIndex === pathKeys.length - 1) {
            if (Array.isArray(bodyNode)) {
              let ind = key === '' ? - 1 : parseInt(key);

              if (ind === - 1) {
                if (!bodyNode.length) {
                  bodyNode.push(void 0);
                }

                ind = bodyNode.length - 1;
                key = String(ind);
              }

              if (ind < 0) {
                throw new Error(`Invalid array index ${key}`);
              }

              let fillCount = ind - bodyNode.length;

              while (fillCount > 0) {
                bodyNode.push(void 0);

                fillCount -= 1;
              }

              bodyNode[key] = val;
            } else {
              bodyNode[key] = val;
            }
          } else {
            switch (type) {
              case 'a':
                if (!(key in bodyNode) || !Array.isArray(bodyNode[key])) {
                  bodyNode[key] = [];
                }

                break;

              case 'i':
                let ind = key === '' ? - 1 : parseInt(key);

                if (ind === - 1) {
                  if (!bodyNode.length) {
                    bodyNode.push(void 0);
                  }

                  ind = bodyNode.length - 1;
                  key = String(ind);
                }

                if (ind < 0) {
                  throw new Error(`Invalid array index ${key}`);
                }

                let fillCount = ind - bodyNode.length;

                while (fillCount > 0) {
                  bodyNode.push(void 0);

                  fillCount -= 1;
                }

                if (!(key in bodyNode) || bodyNode[key] === void 0) {
                  bodyNode[key] = pathKeyTypes[typeIndex + 1] === 'i' ? [] : {};
                }

                break;

              default:
                if (!(key in bodyNode) || bodyNode[key] === null || typeof bodyNode[key] !== 'object') {
                  bodyNode[key] = {};
                }
            }

            bodyNode = bodyNode[key];
          }
        });
      }
    }
  });

  return body;
};

if (typeof module !== 'undefined') {
  module.exports.prepareBody = prepareBody;
}
