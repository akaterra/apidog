module.exports = (input, align, unsafe) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  if (!Array.isArray(input)) {
    input = [input];
  }

  const startNonEmptyIndex = input.findIndex((line) => line.trim() !== '');
  const finalNonEmptyIndex = input.findLastIndex((line) => line.trim() !== '');

  input = input.slice(startNonEmptyIndex, finalNonEmptyIndex + 1).map((line) => String(line));

  if (align === true) {
    let indentIndex = Infinity;

    input.forEach((line) => {
      const rowIndentIndex = line.search(/\S/);

      if (rowIndentIndex !== -1 && rowIndentIndex < indentIndex) {
        indentIndex = rowIndentIndex;
      }
    });

    if (indentIndex !== Infinity) {
      input = input.map((line) => line.slice(indentIndex));
    }
  }

  input = input.map((line) => line || '').join('\n');

  if (unsafe) {
    return new handlebars.SafeString(input);
  }

  return input;
};
