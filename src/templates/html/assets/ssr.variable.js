/**
 * Send sample request variable
 */
const ssrVariable = (function () {
  let presets = {};

  ssr.onRequestPrepareParams((el, {headers, params}) => {
    const blockId = el.dataset.block;

    const blockDescriptor = sections[blockId];

    api.set();

    by.selector('[data-block-ssr-input="variable"]', el).forEach((blockSsrInputEl) => {
      const blockDescriptorSsrVariable = blockDescriptor.sampleRequestVariable
        .find((variable) => variable.field.name === blockSsrInputEl.name);

      if (blockDescriptorSsrVariable) {
        if (!presets[blockDescriptorSsrVariable.ns]) {
          presets[blockDescriptorSsrVariable.ns] = {};
        }

        presets[blockDescriptorSsrVariable.ns][blockDescriptorSsrVariable.field.name] = getValue(blockSsrInputEl);
      }
    });

    Object.entries(headers).forEach(([key, val]) => {
      if (typeof val === 'string') {
        headers[key] = val.replace(/^@(\w+)|(?!\\).@(\w+)/g, (a, sub1, sub2, sub3, sub4) => {
          const [ns, key] = (sub2 || sub1).split(':', 1);

          return presets[key ? ns : null] && presets[key ? ns : null][key || ns] || '';
        }).replace(/\\@/g, _ => '@');
      }
    });

    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string') {
        params[key] = val.replace(/^@(\w+)|(?!\\).@(\w+)/g, (a, sub1, sub2, sub3, sub4) => {
          const [ns, key] = (sub2 || sub1).split(':', 1);

          return presets[key ? ns : null] && presets[key ? ns : null][key || ns] || '';
        }).replace(/\\@/g, _ => '@');
      }
    });
  });

  ssr.onResponse((el, text, contentType) => {
    const blockId = el.dataset.block;
    const blockDescriptor = sections[blockId];

    if (blockDescriptor.sampleRequestVariable) {
      switch (contentType) {
        case 'form':
          text = parseForm(text);

          break;

        case 'json':
          text = JSON.parse(text);

          break;

        case 'xml':
          text = parseXML(text);
    
          break;
      }

      for (const blockDescriptorSsrVariable of blockDescriptor.sampleRequestVariable) {
        if (blockDescriptorSsrVariable.responsePath) {
          if (!presets[blockDescriptorSsrVariable.ns]) {
            presets[blockDescriptorSsrVariable.ns] = {};
          }

          const val = getByPath(text, blockDescriptorSsrVariable.responsePath);

          presets[blockDescriptorSsrVariable.ns][blockDescriptorSsrVariable.field.name] = val;

          api.setGlobalValues(blockId, blockDescriptorSsrVariable.field.name, val);
        }
      }
    }
  });

  const api = {
    get(ns) {
      return presets[ns] || {};
    },
    set(ns, values) {
      presets[ns] = values;

      return api;
    },

    setGlobalValues(blockId, name, value) {
      for (const el of by.selector(`[data-block-ssr-input-global-id="_v_${name}"]`)) {
        setValue(el, value);
      }

      return api;
    },

    getNsValues(blockId) {
      return by.selector(`[data-block="${blockId}"] [data-block-ssr-input="variable"]`).reduce((acc, blockSsrInputEl) => {
        const blockDescriptor = sections[blockId];

        const blockDescriptorSsrVariable = blockDescriptor.sampleRequestVariable
          .find((variable) => variable.field.name === blockSsrInputEl.name);

        if (!(blockDescriptorSsrVariable.ns in acc)) {
          acc[blockDescriptorSsrVariable.ns] = {};
        }

        if (blockDescriptorSsrVariable) {
          acc[blockDescriptorSsrVariable.ns][blockDescriptorSsrVariable.field.name] = getValue(blockSsrInputEl);
        }

        return acc;
      }, {});
    },

    setNsValues(ns) {
      Object.entries(ns).forEach((key, val) => {
        if (!(key in presets)) {
          presets[key] = val;
        } else {
          Object.assign(presets[key], val);
        }
      });

      return api;
    },
  };

  return api;
})();
