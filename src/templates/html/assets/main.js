function byId(id) {
  return document.getElementById(id);
}

function bySelector(selector, el, sanitize) {
  return Array.prototype.slice.call((el || document).querySelectorAll(sanitize
    ? selector
      .replace(/\./g, '\\.')
      .replace(/\[/g, '\\[')
      .replace(/]/g, '\\]')
      .replace(/\$/g, '\\$')
      .replace(/\//g, '\\/')
      .replace(/:/g, '\\:')
    : selector
  ));
}

function bySanitizedSelector(selector, el) {
  return bySelector(selector, el, true);
}

function addClass(el, cls) {
  if (!Array.isArray(el)) {
    el = [el];
  }

  el.forEach((el) => {
    if (typeof el === 'string') {
      el = bySelector(el)[0];

      if (!el) {
        return;
      }
    }

    const className = el.className.split(' ');
    const index = className.findIndex(function (e) {
      return e === cls;
    });

    if (index !== -1) {
      return;
    }

    className.push(cls);

    el.className = className.join(' ').trim();
  });
}

function removeClass(el, cls) {
  if (!Array.isArray(el)) {
    el = [el];
  }

  el.forEach((el) => {
    if (typeof el === 'string') {
      el = bySelector(el)[0];

      if (!el) {
        return;
      }
    }

    const className = el.className.split(' ');
    const index = className.findIndex(function (e) {
      return e === cls;
    });

    if (index === - 1) {
      return;
    }

    className.splice(index, 1);

    el.className = className.join(' ').trim();
  });
}

function replaceClass(el, clsOld, clsNew) {
  removeClass(el, clsOld);
  addClass(el, clsNew);
}

function onChange(el, fn) {
  el.onchange = (event) => {
    fn(getValue(event.srcElement), event.srcElement);
  };
}

function onClick(el, fn) {
  el.onclick = (event) => {
    fn(event.srcElement);
  };
}

function selectorReplaceOptions(el, options) {
  const selectedValue = getValue(el);

  el.options.length = 0;

  Object.entries(options).forEach(([key, val]) => {
    const option = document.createElement('option');

    option.value = key;
    option.text = val;

    el.appendChild(option);

    Array.prototype.some.call(el, (option, i) => {
      if (getValue(option) === selectedValue) {
        el.selectedIndex = i;

        return true;
      }

      return false;
    });
  });
}

function selectorAppendOptionUniq(el, value, text) {
  const optionIndex = Array.prototype.findIndex.call(el.options, (option) => getValue(option) === value);

  if (optionIndex === -1) {
    const option = document.createElement('option');

    option.value = value;
    option.text = text;

    el.appendChild(option);

    el.selectedIndex = el.options.length - 1;
  } else {
    el.selectedIndex = optionIndex;
  }
}

function getValue(el) {
  return el.options ? el.options[el.selectedIndex].value : el.value;
}

function setValue(el, value) {
  if (el.options) {
    Array.prototype.some.call(el.options, (option, i) => {
      if (getValue(option) === value) {
        el.selectedIndex = i;

        return true;
      }

      return false;
    });
  } else {
    el.value = value;
  }
}

function del(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      delete obj[key];
    } else {
      return false;
    }
  }

  return true;
}

function get(obj, path, defaultValue) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return defaultValue;
    }
  }

  return obj;
}

function has(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return false;
    }
  }

  return true;
}

let lastHintsStatus = {};
let lastSelectedChapter = getValue(bySelector('[data-element="chapterSelector"]')[0]);
let lastSelectedContentType = {};
let lastSelectedVersions = {};
let presets = {};

onChange(bySelector('[data-element="chapterSelector"]')[0], (value) => {
  console.log(bySelector(`[data-element="chapter_${lastSelectedChapter}"]`), lastSelectedChapter);
  if (lastSelectedChapter) {
    addClass(bySelector(`[data-element="chapter_${lastSelectedChapter}"]`), 'hidden');
  }

  lastSelectedChapter = value;

  removeClass(bySelector(`[data-element="chapter_${lastSelectedChapter}"]`), 'hidden');
});

bySelector('[data-control-panel]').forEach((el) => {
  const family = el.dataset.controlPanel;

  const showHintEl = bySelector('button', el)[0];

  lastHintsStatus[family] = true;

  onClick(showHintEl, () => {
    if (lastHintsStatus[family]) {
      bySelector(`[data-block-hint="${family}"]`).forEach((el) => {
        addClass(el, 'hidden');
      });

      showHintEl.textContent = 'Show hints';
    } else {
      bySelector(`[data-block-hint="${family}"]`).forEach((el) => {
        removeClass(el, 'hidden');
      });

      showHintEl.textContent = 'Hide hints';
    }

    lastHintsStatus[family] = !lastHintsStatus[family];
  });

  const versionSelectorEl = bySelector('select', el)[0];

  lastSelectedVersions[family] = getValue(versionSelectorEl);

  onChange(versionSelectorEl, (value) => {
    addClass(bySelector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
    addClass(bySelector(`[data-element-menu-item="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');

    lastSelectedVersions[family] = value;

    removeClass(bySelector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
    removeClass(bySelector(`[data-element-menu-item="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
  });
});

bySelector('[data-block-control-panel]').forEach((el) => {
  const id = el.dataset.blockControlPanel;

  const contentTypeSelectorEl = bySelector('select', el)[0];

  lastSelectedContentType[id] = getValue(contentTypeSelectorEl);

  onChange(contentTypeSelectorEl, (value) => {
    for (const el of bySelector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
      addClass(el, 'hidden');
    }

    lastSelectedContentType[id] = value;

    for (const el of bySelector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
      removeClass(el, 'hidden');
    }
  });
});
