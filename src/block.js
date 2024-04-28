class Block {
  validate = [];

  constructor(props) {
    if (props && typeof props === 'object') {
      Object.assign(this, props);
    }
  }

  addValidateAfter(fn) {
    this.validate.push(fn);

    return this;
  }
}

module.exports = {
  Block,
};
