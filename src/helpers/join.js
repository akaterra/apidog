module.exports = (input, align, unsafe) => {
  const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

  if (!Array.isArray(input)) {
    input = [input];
  }

  input = input.filter((line) => line).map((line) => String(line));

  if (align === true) {
    let indentIndex = 999;

    input.forEach((line) => {
      const rowIndentIndex = line.search(/\S/);

      if (rowIndentIndex !== -1 && rowIndentIndex < indentIndex) {
        indentIndex = rowIndentIndex;
      }
    });

    input = input.map((line) => line.substr(indentIndex));
  }

  input = input.map((line) => line || '').join('\n');

  if (unsafe) {
    return new handlebars.SafeString(input);
  }

  return input;
};
