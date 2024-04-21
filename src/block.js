class Block {
  constructor(props) {
    if (props && typeof props === 'object') {
      Object.assign(this, props);
    }
  }
}

module.exports = {
  Block,
};
