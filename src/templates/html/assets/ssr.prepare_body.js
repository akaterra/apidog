if (typeof module !== 'undefined') {
  strToPathEscaped = require('./main.func').strToPathEscaped;
}

function prepareBody(params, paramDescriptors, paramsGroup) {
  // FIXME
  if (paramsGroup === '$' || !paramsGroup || paramsGroup === 'null') {
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

    let pathKeys = paramsDescriptor.field.pathPrepared ?? paramsDescriptor?.field?.path ?? strToPathEscaped(key);

    if (!paramsDescriptor.field.pathPrepared && paramDescriptors) {
      const pathKeysTmp = [...pathKeys];

      if (pathKeys.length > 1) {
        let offset = 0;

        for (let l = 1; l <= pathKeys.length; l += 1) {
          const pathChunk = pathKeys.slice(0, -l).join('.');
          const parentParamsDescriptor = paramDescriptors.find(
            (param) => param.field?.path
              ? param.group === paramsGroup && param.field.path.join('.') === pathChunk
              : false
          );

          if (!parentParamsDescriptor) {
            break;
          }

          if (
            parentParamsDescriptor.type?.modifiers?.list &&
            !arrayIndexRegex.test(pathKeys[pathKeys.length - l - 1]) &&
            pathKeys[pathKeys.length - l - 1] !== ''
          ) {
            pathKeysTmp.splice(pathKeysTmp.length - l - offset, 0, 0);

            offset += 1;
          }
        }
      }

      const typeIsList = !!paramsDescriptor?.type?.modifiers?.list;

      if (typeIsList) {
        pathKeysTmp.push(0);
      }

      paramsDescriptor.field.pathPrepared = pathKeys = pathKeysTmp;
    }

    const type = paramsDescriptor?.type?.modifiers?.initial;
    const typeModifiers = paramsDescriptor?.type?.modifiers;

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

        case 'integer':
          val = parseInt(val, 10);
  
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
            key = 0;
          }

          const isArrayIndex = typeof key === 'number' || arrayIndexRegex.test(key);

          if (isArrayIndex) {
            if (!Array.isArray(bodyNode[bodyNodeKey])) {
              bodyNode[bodyNodeKey] = [];
            }
          } else {
            if (!bodyNode[bodyNodeKey] || typeof bodyNode[bodyNodeKey] !== 'object') {
              bodyNode[bodyNodeKey] = {};
            }
          }

          if (ind < pathKeys.length - 1) {
            bodyNode = bodyNode[bodyNodeKey];
            bodyNodeKey = key;
          } else {
            bodyNode[bodyNodeKey][key] = val;
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
