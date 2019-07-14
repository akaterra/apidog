(function () {
  let presets = {};

  by.selector('[data-block]').forEach((el) => {
    const blockId = el.dataset.block;
    const blockElementPresetSelect = by.selector('[data-block-element="presetSelect"]', el)[0];

    if (blockElementPresetSelect) {
      on.change(blockElementPresetSelect, (value) => {
        if (value === 'new') {
          setValue(by.selector('[data-block-element="presetName"]', el)[0], '');

          return;
        }

        setValue(by.selector('[data-block-element="presetName"]', el)[0], value);

        if (blockId in presets && value in presets[blockId]) {
          const preset = presets[blockId][value];

          if (preset.endpoint) {
            setValue(by.selector('[data-block-element="endpoint"]', el)[0], preset.endpoint);
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

    const blockElementPresetSave = by.selector('[data-block-element="presetSave"]', el)[0];

    if (blockElementPresetSave) {
      on.click(blockElementPresetSave, () => {
        const presetName = getValue(by.selector('[data-block-element="presetName"]', el)[0]);

        if (!presetName) {
          return;
        }

        const blockHeaders = {};
        const blockParams = {};
        const blockEndpoint = by.selector('[data-block-element="endpoint"]', el)[0].value;

        by.selector('[data-block-element]', el).forEach((blockEl) => {
          switch (blockEl.dataset.blockElement) {
            case 'header':
              blockHeaders[blockEl.name] = getValue(blockEl);

              break;

            case 'param':
              blockParams[blockEl.name] = getValue(blockEl);

              break;
          }
        });

        const blockDescriptor = sections[el.dataset.block];

        request(
          'http',
          `${blockDescriptor.sampleRequestProxy}/preset/${encodeURIComponent(blockId)}/${encodeURIComponent(presetName)}`,
          'PATCH',
          {
            endpoint: blockEndpoint,
            headers: blockHeaders,
            params: blockParams,
          },
          undefined,
          'json'
        ).then(() => {
          selector.option.appendUniq(blockElementPresetSelect, presetName, presetName);
        });
      });
    }

    const blockElementPresetLoadList = by.selector('[data-block-element="presetLoadList"]', el)[0];

    if (blockElementPresetLoadList && blockElementPresetSelect) {
      on.click(blockElementPresetLoadList, () => {
        const blockDescriptor = sections[el.dataset.block];

        request(
          'http',
          `${blockDescriptor.sampleRequestProxy}/preset/${encodeURIComponent(blockId)}`,
          'GET'
        ).then(({text}) => {
          Object.assign(presets, JSON.parse(text));

          selector.option.replace(blockElementPresetSelect, Object.entries(presets[blockId]).reduce((acc, [key, val]) => {
            acc[key] = key;

            return acc;
          }, {'new': 'New'}));
        });
      });
    }
  });
})();
