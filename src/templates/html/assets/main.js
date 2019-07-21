(function () {
  let lastHintsStatus = {};
  let lastSelectedChapter = getValue(by.selector('[data-chapter-selector]')[0]);
  let lastSelectedContentType = {};
  let lastSelectedVersions = {};
  let lastSelectedVersionsCompareTo = {};

  on.change(by.selector('[data-chapter-selector]')[0], (value) => {
    if (lastSelectedChapter) {
      cls.add(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');
    }

    lastSelectedChapter = value;

    cls.remove(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');
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

    const blockControlPanelVersionCompareToSelector = by.selector('[data-control-panel-version-compare-to-selector]', el)[0];

    lastSelectedVersionsCompareTo[family] = getValue(blockControlPanelVersionCompareToSelector);

    on.change(blockControlPanelVersionCompareToSelector, (value) => {
      if (value !== 'null') {
        cls.add(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-content]`)[0], 'hidden');
        cls.remove(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-diff-content]`)[0], 'hidden');

        by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-diff-content]`)[0].innerHTML = HtmlDiff.execute(
          by.selector(`[data-block="${family}_${value}"] [data-block-compare-to-content]`)[0].innerHTML,
          by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-content]`)[0].innerHTML
        );
      } else {
        cls.remove(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-content]`)[0], 'hidden');
        cls.add(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"] [data-block-compare-to-diff-content]`)[0], 'hidden');
      }

      lastSelectedVersionsCompareTo[family] = value;
    });

    const blockControlPanelVersionSelector = by.selector('[data-control-panel-version-selector]', el)[0];

    lastSelectedVersions[family] = getValue(blockControlPanelVersionSelector);

    on.change(blockControlPanelVersionSelector, (value) => {
      cls.add(by.selector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
      cls.add(by.selector(`[data-element-menu-item="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
      cls.remove(by.selector(`[data-block="${family}_${value}"]`)[0], 'hidden');
      cls.remove(by.selector(`[data-element-menu-item="${family}_${value}"]`)[0], 'hidden');

      lastSelectedVersions[family] = value;

      blockControlPanelVersionCompareToSelector.onchange({srcElement: blockControlPanelVersionCompareToSelector});
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
})();
