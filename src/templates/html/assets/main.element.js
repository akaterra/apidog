const by = {
  id(id) {
    return document.getElementById(id);
  },
  sanitizedSelector(selector, el) {
    return by.selector(selector, el, true);
  },
  selector(selector, el, sanitize) {
    const els = Array.prototype.slice.call((el || document).querySelectorAll(sanitize
      ? selector
        .replace(/\./g, '\\.')
        .replace(/\[/g, '\\[')
        .replace(/]/g, '\\]')
        .replace(/\$/g, '\\$')
        .replace(/\//g, '\\/')
        .replace(/:/g, '\\:')
      : selector
    ));

    if (els.length === 0) {
      console.warn(`Elements by selector ${selector} were not found`)
    }

    return els;
  },
};

const cls = {
  add(el, cls) {
    if (!Array.isArray(el)) {
      el = [el];
    }

    el = el.map((el) => typeof el === 'string' ? by.selector(el) : el).flat();

    el.forEach((el) => {
      if (!el) {
        return;
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

    return cls;
  },
  rem(el, cls) {
    if (!Array.isArray(el)) {
      el = [el];
    }

    el = el.map((el) => typeof el === 'string' ? by.selector(el) : el).flat();

    el.forEach((el) => {
      if (!el) {
        return;
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

    return cls;
  },
  replace(el, clsOld, clsNew) {
    cls.rem(el, clsOld);

    cls.add(el, clsNew);

    return cls;
  }
};

const on = {
  change(el, fn) {
    el.onchange = (event) => {
      fn(getValue(event.srcElement), event.srcElement);
    };

    return on;
  },
  click(el, fn) {
    el.onclick = (event) => {
      fn(event.srcElement);
    };

    return on;
  }
};

function getValue(el) {
  if (!el) {
    return;
  }

  if (el.type && el.type === 'checkbox') {
    return el.checked;
  }

  if (el.options) {
    return el.options[el.selectedIndex].value;
  }

  if (el.files) {
    return el.files[0];
  }

  return el.value;
}

function setValue(el, value) {
  if (!el) {
    return;
  }

  if (el.type && (el.type === 'checkbox' || el.type === 'radio')) {
    el.checked = !!value;
  } else if (el.options) {
    Array.prototype.some.call(el.options, (option, i) => {
      if (getValue(option) === value) {
        el.selectedIndex = i;

        return true;
      }

      return false;
    });
  } else if (el.files) {

  } else {
    el.value = value;
  }
}

function isVisible(el) {
  return el.offsetHeight > 0;
}

if (typeof module !== 'undefined') {
  module.exports = {
    by,
    cls,
    getValue,
    setValue,
    isVisible,
    on,
  };
}
