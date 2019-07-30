/**
 * Send sample request preset
 */
(function () {
  let presets = {};

  by.selector('[data-block]').forEach((el) => {
    const blockId = el.dataset.block;
    const blockSsrPresetSelector = by.selector('[data-block-ssr-preset-selector]', el)[0];

    if (blockSsrPresetSelector) {
      on.change(blockSsrPresetSelector, (value) => {
        if (value === 'new') {
          setValue(by.selector('[data-block-ssr-preset-name]', el)[0], '');

          return;
        }

        setValue(by.selector('[data-block-ssr-preset-name]', el)[0], value);

        if (blockId in presets && value in presets[blockId]) {
          const preset = presets[blockId][value];

          if (preset.endpoint) {
            setValue(by.selector('[data-block-ssr-endpoint]', el)[0], preset.endpoint);
          }

          if (preset.headers) {
            Object.entries(preset.headers).forEach(([key, val]) => {
              const el = by.sanitizedSelector(`#${blockId}_h_${key}`)[0];

              if (el) {
                setValue(el, val);
              }
            });
          }

          if (preset.params) {
            Object.entries(preset.params).forEach(([key, val]) => {
              const el = by.sanitizedSelector(`#${blockId}_p_${key}`)[0];

              if (el) {
                setValue(el, val);
              }
            });
          }
        }
      });
    }

    const blockSsrPresetSave = by.selector('[data-block-ssr-preset-save]', el)[0];

    if (blockSsrPresetSave) {
      on.click(blockSsrPresetSave, () => {
        const presetName = getValue(by.selector('[data-block-ssr-preset-name]', el)[0]);

        if (!presetName) {
          return;
        }

        const endpoint = by.selector('[data-block-ssr-endpoint]', el)[0].value;
        const headers = {};
        const params = {};

        by.selector('[data-block-ssr-input]', el).forEach((blockSsrInputEl) => {
          switch (blockSsrInputEl.dataset.blockSsrInput) {
            case 'header':
              headers[blockSsrInputEl.name] = getValue(blockSsrInputEl);

              break;

            case 'param':
              params[blockSsrInputEl.name] = getValue(blockSsrInputEl);

              break;
          }
        });

        const blockDescriptor = sections[el.dataset.block];

        request.http.put(
          `${blockDescriptor.sampleRequestProxy}/preset/${encodeURIComponent(blockId)}/${encodeURIComponent(presetName)}`,
          {
            endpoint,
            headers,
            params,
          },
          'json'
        ).then(() => {
          selector.option.appendUniq(blockSsrPresetSelector, presetName, presetName);
        });
      });
    }

    const blockSsrPresetLoadList = by.selector('[data-block-ssr-preset-load-list]', el)[0];

    if (blockSsrPresetLoadList && blockSsrPresetSelector) {
      on.click(blockSsrPresetLoadList, () => {
        const blockDescriptor = sections[el.dataset.block];

        request.http.get(
          `${blockDescriptor.sampleRequestProxy}/preset/${encodeURIComponent(blockId)}`
        ).then(({text}) => {
          Object.assign(presets, JSON.parse(text));

          selector.option.replace(blockSsrPresetSelector, Object.entries(presets[blockId]).reduce((acc, [key, val]) => {
            acc[key] = key;

            return acc;
          }, {'new': 'New'}));
        });
      });
    }
  });
})();
