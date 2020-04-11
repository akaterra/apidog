function prepareBody(params, paramDescriptors, paramsGroup) {
  if (paramsGroup === '$') {
    paramsGroup = null; // :( refactor
  } else if (!paramsGroup) {
    paramsGroup = null;
  }

  const arrayIndexRegex = /.*[^\\]\[(.*)\]$/; // /.+(?<!\\)\[(.*?(?<!\\))]$/;
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

    const type = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.initial;
    const typeIsList = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers.list;
    const typeIsOptional = paramsDescriptor && paramsDescriptor.field && paramsDescriptor.field.isOptional;
    const typeModifiers = paramsDescriptor && paramsDescriptor.type && paramsDescriptor.type.modifiers;

    if (typeIsList) {
      let typeIsListCounter = typeIsList === true ? 1 : typeIsList;

      while (typeIsListCounter) {
        pathKeys.push('0');

        if (pathKeyTypes[pathKeyTypes.length - 1] !== 'i') {
          pathKeyTypes[pathKeyTypes.length - 1] = 'a';
        }

        pathKeyTypes.push('i');

        typeIsListCounter -= 1;
      }
    }

    if (paramsDescriptor) {
      if (val === '') {
        if (typeModifiers && typeModifiers.none) {
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
                  bodyNode.push(undefined);
                }

                ind = bodyNode.length - 1;
                key = String(ind);
              }

              if (ind < 0) {
                throw new Error(`Invalid array index ${key}`);
              }

              let fillCount = ind - bodyNode.length;

              while (fillCount > 0) {
                bodyNode.push(undefined);

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
                let ind = key === '' ? -1 : parseInt(key);

                if (ind === -1) {
                  if (!bodyNode.length) {
                    bodyNode.push(undefined);
                  }

                  ind = bodyNode.length - 1;
                  key = String(ind);
                }

                if (ind < 0) {
                  throw new Error(`Invalid array index ${key}`);
                }

                let fillCount = ind - bodyNode.length;

                while (fillCount > 0) {
                  bodyNode.push(undefined);

                  fillCount -= 1;
                }

                if (!(key in bodyNode) || bodyNode[key] === undefined) {
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
