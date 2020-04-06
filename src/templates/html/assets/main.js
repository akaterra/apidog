const main = (function () {
  let lastHintsStatus = {};
  let lastSelectedChapter = getValue(by.selector('[data-chapter-selector]')[0]);
  let lastSelectedContentType = {};
  let lastSelectedVersions = {};
  let lastSelectedVersionsCompareTo = {};

  function getChapterSelectorEl() {
    return by.selector('[data-chapter-selector]')[0];
  }

  function getVerisionSelectorEl() {
    return by.selector('[data-version-selector]')[0];
  }

  function getVerisionSelectorCompareToEl() {
    return by.selector('[data-version-compare-to-selector]')[0];
  }

  on.change(getChapterSelectorEl(), (chapterId) => {
    api.showChapter(chapterId);
  });

  on.change(getVerisionSelectorEl(), (version) => {
    Object.keys(families).map((familyId) => api.showVersion(familyId, version === 'null' ? null : version));
  });

  on.change(getVerisionSelectorCompareToEl(), (versionCompareTo) => {
    Object.keys(families).map((familyId) => api.showVersionComparedTo(familyId, versionCompareTo === 'null' ? null : versionCompareTo));
  });

  by.selector('[data-control-panel]').forEach((el) => {
    const familyId = el.dataset.controlPanel;

    const showHintEl = by.selector('button', el)[0];

    on.click(showHintEl, () => {
      api.toggleHints(familyId);
    });

    const blockControlPanelVersionCompareToSelector = by.selector('[data-control-panel-version-compare-to-selector]', el)[0];

    lastSelectedVersionsCompareTo[familyId] = getValue(blockControlPanelVersionCompareToSelector);

    on.change(blockControlPanelVersionCompareToSelector, (versionCompareTo) => {
      api.showVersionComparedTo(familyId, versionCompareTo === 'null' ? null : versionCompareTo);
    });

    const blockControlPanelVersionSelector = by.selector('[data-control-panel-version-selector]', el)[0];

    lastSelectedVersions[familyId] = getValue(blockControlPanelVersionSelector);

    on.change(blockControlPanelVersionSelector, (version) => {
      api.showVersion(familyId, version);
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
        cls.rem(el, 'hidden');
      }
    });
  });

  function getControlPanelEl(familyId) {
    return by.selector(`[data-control-panel="${familyId}"]`)[0];
  }

  const api = {
    idFrom(...args) {
      return args.join('___');
    },
    parseId(id) {
      return id.split('___');
    },

    showChapter(chapterId) {
      setValue(getChapterSelectorEl(), chapterId);

      if (lastSelectedChapter) {
        cls.add(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');
      }
  
      lastSelectedChapter = chapterId;
  
      cls.rem(by.selector(`[data-chapter="${lastSelectedChapter}"]`), 'hidden');

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
          showHintEl.textContent = _(config.locale || 'en', 'showHints');
        }
      }

      return api;
    },
    showHints(familyId) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        by.selector(`[data-block-hint="${familyId}"]`).forEach((el) => {
          cls.rem(el, 'hidden');
        });

        const showHintEl = by.selector('button', controlPanelEl)[0];

        if (showHintEl) {
          showHintEl.textContent = _(config.locale || 'en', 'hideHints');
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

    jumpToByHash(hash) {
      const [chapter, group, subgroup, family, version] = api.parseId(hash);

      if (chapter) {
        main.showChapter(chapter);

        if (version) {
          main.showVersion(api.idFrom(chapter, group, subgroup, family), version);
        }
      }

      const aEl = by.selector(`a[name="${decodeURIComponent(hash)}"]`)[0];

      if (aEl) {
        window.scrollTo(0, aEl.offsetTop);
      }

      return api;
    },

    showVersion(familyId, version) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        if (version === null) {
          version = lastSelectedVersions[familyId];
        }

        if (families[familyId].indexOf(version) !== -1) {
          const blockControlPanelVersionCompareToSelectorEl = by.selector(
            '[data-control-panel-version-compare-to-selector]',
            controlPanelEl
          )[0];

          if (blockControlPanelVersionCompareToSelectorEl) {
            cls.add(by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"]`)[0], 'hidden');
            cls.add(by.selector(`[data-element-menu-item="${api.idFrom(familyId, lastSelectedVersions[familyId])}"]`)[0], 'hidden');
            cls.rem(by.selector(`[data-block="${api.idFrom(familyId, version)}"]`)[0], 'hidden');
            cls.rem(by.selector(`[data-element-menu-item="${api.idFrom(familyId, version)}"]`)[0], 'hidden');

            for (const el of by.selector(`[data-family="${familyId}"]`)) {
              cls.rem(el, 'hidden');
            }

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
        } else {
          for (const el of by.selector(`[data-family="${familyId}"]`)) {
            cls.add(el, 'hidden');
          }
        }
      }

      return api;
    },

    showVersionComparedTo(familyId, versionCompareTo) {
      const controlPanelEl = getControlPanelEl(familyId);

      if (controlPanelEl) {
        if (families[familyId].indexOf(versionCompareTo) === -1) {
          versionCompareTo = null;
        }

        if (versionCompareTo !== null) {
          cls.add(by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-content]`)[0], 'hidden');
          cls.rem(by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-diff-content]`)[0], 'hidden');

          by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-diff-content]`)[0].innerHTML = HtmlDiff.execute(
            by.selector(`[data-block="${api.idFrom(familyId, versionCompareTo)}"] [data-block-compare-to-content]`)[0].innerHTML,
            by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-content]`)[0].innerHTML
          );
        } else {
          cls.rem(by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-content]`)[0], 'hidden');
          cls.add(by.selector(`[data-block="${api.idFrom(familyId, lastSelectedVersions[familyId])}"] [data-block-compare-to-diff-content]`)[0], 'hidden');
        }

        const blockControlPanelVersionCompareToSelectorEl = by.selector(
          '[data-control-panel-version-compare-to-selector]',
          controlPanelEl
        )[0];

        if (blockControlPanelVersionCompareToSelectorEl) {
          setValue(blockControlPanelVersionCompareToSelectorEl, versionCompareTo === null ? 'null' : versionCompareTo);
        }

        lastSelectedVersionsCompareTo[familyId] = versionCompareTo;
      }

      return api;
    },
  };

  return api;
})();
