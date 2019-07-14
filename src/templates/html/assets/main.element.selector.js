const selector = {
  option: {
    appendUniq(el, value, text) {
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

      return selector;
    },
    replace(el, options) {
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

      return selector;
    },
  },
};

if (typeof module !== 'undefined') {
  module.exports.selector = selector;
}
