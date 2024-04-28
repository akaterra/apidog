class Block {
  constructor(props) {
    if (props && typeof props === 'object') {
      Object.assign(this, props);
    }
  }

  addToApidocString(fn) {
    if (!this._toApidocStringFns) {
      this._toApidocStringFns = [];
    } else if (this._toApidocStringFns.includes(fn)) {
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
}

module.exports = {
  Block,
};
