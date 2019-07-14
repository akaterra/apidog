const by = {
  id(id) {
    return document.getElementById(id);
  },
  sanitizedSelector(selector, el) {
    return by.selector(selector, el, true);
  },
  selector(selector, el, sanitize) {
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
  },
};

const cls = {
  add(el, cls) {
    if (!Array.isArray(el)) {
      el = [el];
    }

    el.forEach((el) => {
      if (typeof el === 'string') {
        el = by.selector(el)[0];

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

    return cls;
  },
  remove(el, cls) {
    if (!Array.isArray(el)) {
      el = [el];
    }

    el.forEach((el) => {
      if (typeof el === 'string') {
        el = by.selector(el)[0];

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

    return cls;
  },
  replace(el, clsOld, clsNew) {
    cls.remove(el, clsOld);

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
  return el.options
    ? el.options[el.selectedIndex].value
    : el.value;
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

if (typeof module !== 'undefined') {
  module.exports = {
    by,
    cls,
    getValue,
    setValue,
    on,
  };
}
