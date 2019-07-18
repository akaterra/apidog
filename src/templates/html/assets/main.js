(function () {
  let lastHintsStatus = {};
  let lastSelectedChapter = getValue(by.selector('[data-element="chapterSelector"]')[0]);
  let lastSelectedContentType = {};
  let lastSelectedVersions = {};

  on.change(by.selector('[data-element="chapterSelector"]')[0], (value) => {
    if (lastSelectedChapter) {
      cls.add(by.selector(`[data-element="chapter_${lastSelectedChapter}"]`), 'hidden');
    }

    lastSelectedChapter = value;

    cls.remove(by.selector(`[data-element="chapter_${lastSelectedChapter}"]`), 'hidden');
  });

  by.selector('[data-control-panel]').forEach((el) => {
    const family = el.dataset.controlPanel;

    const showHintEl = by.selector('button', el)[0];

    lastHintsStatus[family] = true;

    on.click(showHintEl, () => {
      if (lastHintsStatus[family]) {
        by.selector(`[data-block-hint="${family}"]`).forEach((el) => {
          cls.add(el, 'hidden');
        });

        showHintEl.textContent = 'Show hints';
      } else {
        by.selector(`[data-block-hint="${family}"]`).forEach((el) => {
          cls.remove(el, 'hidden');
        });

        showHintEl.textContent = 'Hide hints';
      }

      lastHintsStatus[family] = !lastHintsStatus[family];
    });

    const versionSelectorEl = by.selector('select', el)[0];

    lastSelectedVersions[family] = getValue(versionSelectorEl);

    on.change(versionSelectorEl, (value) => {
      cls.add(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
      cls.add(by.selector(`[data-element-menu-item="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');

      lastSelectedVersions[family] = value;

      cls.remove(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
      cls.remove(by.selector(`[data-element-menu-item="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
    });
  });

  by.selector('[data-block-control-panel]').forEach((el) => {
    const id = el.dataset.blockControlPanel;

    const contentTypeSelectorEl = by.selector('select', el)[0];

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
})();
