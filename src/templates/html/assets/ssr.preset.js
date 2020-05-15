/**
 * Send sample request preset
 */
const ssrPreset = (function () {
  let presets = {};

  by.selector('[data-block]').forEach((el) => {
    const blockId = el.dataset.block;

    const blockSsrPresetSelectEl = by.selector('[data-block-ssr-preset-selector]', el)[0];

    if (blockSsrPresetSelectEl) {
      on.change(blockSsrPresetSelectEl, (presetName) => {
        api
          .setName(blockId, presetName === 'new' ? '' : presetName)
          .setValues(blockId, api.get(blockId, presetName));
      });
    }

    const blockSsrPresetSaveEl = by.selector('[data-block-ssr-preset-save]', el)[0];

    if (blockSsrPresetSaveEl) {
      on.click(blockSsrPresetSaveEl, () => {
        const presetName = api.getName(blockId);

        if (!presetName) {
          return;
        }

        api.set(blockId, presetName, api.getValues(blockId));

        const blockDescriptor = sections[blockId];

        request.http.put(
          `${blockDescriptor.sampleRequestPreset}/preset/${encodeURIComponent(blockId)}/${encodeURIComponent(presetName)}`,
          api.get(blockId, presetName),
          'json'
        ).then(() => {
          selector.option.appendUniq(blockSsrPresetSelectEl, presetName, presetName);
        });
      });
    }

    const blockSsrPresetLoadListEl = by.selector('[data-block-ssr-preset-load-list]', el)[0];

    if (blockSsrPresetLoadListEl && blockSsrPresetSelectEl) {
      on.click(blockSsrPresetLoadListEl, () => {
        const blockDescriptor = sections[blockId];

        request.http.get(
          `${blockDescriptor.sampleRequestPreset}/preset/${encodeURIComponent(blockId)}`
        ).then(({text}) => {
          Object.assign(presets, JSON.parse(text));

          selector.option.replace(blockSsrPresetSelectEl, Object.entries(presets[blockId]).reduce((acc, [key, val]) => {
            acc[key] = key;

            return acc;
          }, {'new': 'New'}));
        });
      });
    }
  });

  function getNameEl(blockId) {
    return by.selector(`[data-block="${blockId}"] [data-block-ssr-preset-name]`)[0];
  }

  const api = {
    get(blockId, name) {
      return presets[blockId] && presets[blockId][name] || {};
    },
    set(blockId, name, values) {
      if (!(blockId in presets)) {
        presets[blockId] = {};
      }

      presets[blockId][name] = values;

      return api;
    },

    getName(blockId) {
      const el = getNameEl(blockId);

      if (el) {
        return getValue(el);
      }

      return null;
    },
    setName(blockId, name) {
      const el = getNameEl(blockId);

      if (el) {
        setValue(el, name);
      }

      return api;
    },

    getValues(blockId) {
      return {
        endpoint: ssr.getEndpoint(blockId),
        headers: ssr.getHeaders(blockId),
        params: ssr.getParams(blockId),
      }
    },
    setValues(blockId, values) {
      if (values.endpoint) {
        ssr.setEndpoint(blockId, values.endpoint);
      }

      if (values.headers) {
        ssr.setHeaders(blockId, values.headers);
      }

      if (values.params) {
        ssr.setParams(blockId, values.params);
      }

      return api;
    },
  };

  return api;
})();
