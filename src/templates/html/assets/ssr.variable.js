/**
 * Send sample request variable
 */
const ssrVariable = (function () {
  let presets = {};

  ssr.onRequestPrepareParams((el, {headers, params}) => {
    const blockId = el.dataset.block;
    const blockDescriptor = sections[el.dataset.block];

    api.set()

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
      headers[key] = val.replace(/\$\{(.+)}/g, (_, sub) => {
        const [ns, key] = sub.split(':', 1);

        return presets[key ? ns : null] && presets[key ? ns : null][key || ns] || '';
      });
    });

    Object.entries(params).forEach(([key, val]) => {
      params[key] = val.replace(/\$\{(.+)}/g, (_, sub) =>{
        const [ns, key] = sub.split(':', 1);

        return presets[key ? ns : null] && presets[key ? ns : null][key || ns] || '';
      });
    });
  });

  ssr.onResponse((el, text, contentType) => {
    const blockId = el.dataset.block;
    const blockDescriptor = sections[el.dataset.block];

    if (blockDescriptor.sampleRequestVariable) {
      switch (contentType) {
        case 'json':
          text = JSON.parse(text);

          break;
      }

      for (const blockDescriptorSsrVariable of blockDescriptor.sampleRequestVariable) {
        if (blockDescriptorSsrVariable.responsePath) {
          if (!presets[blockDescriptorSsrVariable.ns]) {
            presets[blockDescriptorSsrVariable.ns] = {};
          }

          const val = getByPath(text, blockDescriptorSsrVariable.responsePath);

          presets[blockDescriptorSsrVariable.ns][blockDescriptorSsrVariable.field.name] = val;

          for (const el of by.selector(`[data-block-ssr-input-global-id="_v_${blockDescriptorSsrVariable.field.name}"]`)) {
            setValue(el, val);
          }
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

        if (!(acc[blockDescriptorSsrVariable.ns in acc)) {
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
