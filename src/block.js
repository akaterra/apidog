class Block {
  constructor(props) {
    if (props && typeof props === 'object') {
      Object.assign(this, props);
    }
  }

  addToApidocString(fn) {
    if (!this._toApidocStringFns) {
      this._toApidocStringFns = [];
    } else if (this._toApidocStringFns.includes(fn) || (fn.group && this._toApidocStringFns.some((f) => f.group === fn.group))) {
      return this;
    }

    this._toApidocStringFns.push(fn);

    return this;
  }

  addValidateAfter(fn) {
    if (!this._validateFns) {
      this._validateFns = [];
    }

    this._validateFns.push(fn);

    return this;
  }

  toApidocStrings() {
    if (!this._toApidocStringFns) {
      return [];
    }

    return this._toApidocStringFns.map((fn) => fn(this)).filter((e) => !!e).flat();
  }

  toJSON() {
    return this.toObject();
  }

  toObject() {
    if (this.description?.length) {
      while (true) {
        if (this.description[this.description.length - 1].trim()) {
          break;
        }

        this.description.pop();
      }
    }

    return objWithRemoveUndefined(Object.keys(this).reduce((acc, key) => {
      if (key.startsWith('_')) {
        return acc;
      }

      acc[key] = this[key];

      return acc;
    }, {}));
  }

  toString() {
    return this.toApidocStrings();
  }

  valueOf() {
    return this.toApidocStrings();
  }
}

module.exports = {
  Block,
};

function objWithRemoveUndefined(obj, newObj = {}) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) {
      if (Array.isArray(obj[key])) {
        newObj[key] = objWithRemoveUndefined(obj[key], []);
      } else {
        newObj[key] = objWithRemoveUndefined(obj[key]);
      }
    } else if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    };
  });

  return newObj;
};
