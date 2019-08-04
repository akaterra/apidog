const main = (function () {
  let lastHintsStatus = {};
  let lastSelectedChapter = getValue(by.selector('[data-chapter-selector]')[0]);
  let lastSelectedContentType = {};
  let lastSelectedVersions = {};
  let lastSelectedVersionsCompareTo = {};

  on.change(by.selector('[data-chapter-selector]')[0], (chapterId) => {
    api.showChapter(chapterId);
  });

  by.selector('[data-control-panel]').forEach((el) => {
    const familyId = el.dataset.controlPanel;

    const showHintEl = by.selector('button', el)[0];

    on.click(showHintEl, () => {
      api.toggleHints(familyId);
    });

    const blockControlPanelVersionCompareToSelector = by.selector('[data-control-panel-version-compare-to-selector]', el)[0];

    lastSelectedVersionsCompareTo[familyId] = getValue(blockControlPanelVersionCompareToSelector);

    on.change(blockControlPanelVersionCompareToSelector, (value) => {
      if (value !== 'null') {
        cls.add(by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-content]`)[0], 'hidden');
        cls.remove(by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-diff-content]`)[0], 'hidden');

        by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-diff-content]`)[0].innerHTML = HtmlDiff.execute(
          by.selector(`[data-block="${familyId}_${value}"] [data-block-compare-to-content]`)[0].innerHTML,
          by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-content]`)[0].innerHTML
        );
      } else {
        cls.remove(by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-content]`)[0], 'hidden');
        cls.add(by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"] [data-block-compare-to-diff-content]`)[0], 'hidden');
      }

      lastSelectedVersionsCompareTo[familyId] = value;
    });

    const blockControlPanelVersionSelector = by.selector('[data-control-panel-version-selector]', el)[0];

    lastSelectedVersions[familyId] = getValue(blockControlPanelVersionSelector);

    on.change(blockControlPanelVersionSelector, (value) => {
      api.showVersion(familyId, value);
    });
  });

  by.selector('[data-block-control-panel]').forEach((el) => {
    const id = el.dataset.blockControlPanel;

    const contentTypeSelectorEl = by.selector('[data-block-content-type]', el)[0];

    lastSelectedContentType[id] = getValue(contentTypeSelectorEl);

    on.change(contentTypeSelectorEl, (value) => {
      for (const el of by.selector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
        cls.add(el, 'hidden');
      }

      lastSelectedContentType[id] = value;

      for (const el of by.selector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
        cls.remove(el, 'hidden');
      }
    });
  });

  function getControlPanelEl(familyId) {
    return by.selector(`[data-control-panel="${familyId}"]`)[0];
  }

  const api = {
    showChapter(chapterId) {
      if (lastSelectedChapter) {
        cls.add(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');
      }
  
      lastSelectedChapter = chapterId;
  
      cls.remove(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');

      return api;
    },

    hideHints(familyId) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        by.selector(`[data-block-hint="${familyId}"]`).forEach((el) => {
          cls.add(el, 'hidden');
        });

        const showHintEl = by.selector('button', controlPanelEl)[0];

        if (showHintEl) {
          showHintEl.textContent = 'Show hints';
        }
      }

      return api;
    },
    showHints(familyId) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        by.selector(`[data-block-hint="${familyId}"]`).forEach((el) => {
          cls.remove(el, 'hidden');
        });

        const showHintEl = by.selector('button', controlPanelEl)[0];

        if (showHintEl) {
          showHintEl.textContent = 'Hide hints';
        }
      }

      return api;
    },
    toggleHints(familyId) {
      if (lastHintsStatus[familyId] === undefined) {
        lastHintsStatus[familyId] = true;
      }

      if (lastHintsStatus[familyId]) {
        api.hideHints(familyId);
      } else {
        api.showHints(familyId);
      }

      lastHintsStatus[familyId] = !lastHintsStatus[familyId];

      return api;
    },

    showVersion(familyId, version) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        const blockControlPanelVersionCompareToSelectorEl = by.selector(
          '[data-control-panel-version-compare-to-selector]',
          controlPanelEl
        )[0];

        if (blockControlPanelVersionCompareToSelectorEl) {
          cls.add(by.selector(`[data-block="${familyId}_${lastSelectedVersions[familyId]}"]`)[0], 'hidden');
          cls.add(by.selector(`[data-element-menu-item="${familyId}_${lastSelectedVersions[familyId]}"]`)[0], 'hidden');
          cls.remove(by.selector(`[data-block="${familyId}_${version}"]`)[0], 'hidden');
          cls.remove(by.selector(`[data-element-menu-item="${familyId}_${version}"]`)[0], 'hidden');

          lastSelectedVersions[familyId] = version;

          blockControlPanelVersionCompareToSelectorEl.onchange({srcElement: blockControlPanelVersionCompareToSelectorEl});
        }

        const blockControlPanelVersionSelectorEl = by.selector(
          '[data-control-panel-version-selector]',
          controlPanelEl
        )[0];

        if (blockControlPanelVersionSelectorEl) {
          setValue(blockControlPanelVersionSelectorEl, version);
        }
      }

      return api;
    },
  };

  return api;
})();
