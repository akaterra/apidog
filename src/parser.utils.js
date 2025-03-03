function enumChapters(chapters, fn, acc, scope) {
  Object.entries(chapters).forEach(([chapterName, groups]) => {
    Object.entries(groups).forEach(([groupName, subgroups]) => {
      Object.entries(subgroups).forEach(([subgroupName, names]) => {
        Object.entries(names).forEach(([name, versions]) => {
          Object.entries(versions).forEach(([versionName, descriptor]) => {
            if (scope) {
              if (scope === 'api' && !descriptor.api) {
                return;
              }

              if (scope === 'note' && !descriptor.note) {
                return;
              }
            }

            fn({
              chapterName,
              groups,
              groupName,
              subgroups,
              subgroupName,
              names,
              name,
              versions,
              versionName,
              descriptor,
            }, acc);
          });
        });
      });
    });
  });

  return acc;
}

function enumChaptersApis(chapters, fn, acc) {
  return enumChapters(chapters, fn, acc, 'api');
}

function enumChaptersNotes(chapters, fn, acc) {
  return enumChapters(chapters, fn, acc, 'note');
}

function enumUriPlaceholders(uri, fn, acc) {
  const placeholderRegex = /:(\w+)/g;
  const pathQsIndex = uri.indexOf('?');

  let placeholder;

  while (placeholder = placeholderRegex.exec(pathQsIndex !== -1 ? uri.substr(0, pathQsIndex) : uri)) {
    fn(placeholder[1], false, acc);
  }

  if (pathQsIndex !== -1) {
    while (placeholder = placeholderRegex.exec(uri.substr(pathQsIndex + 1))) {
      fn(placeholder[1], true, acc);
    }
  }

  return acc;
}

function addUriDefaultScheme(uri) {
  if (!/^\w+:\/\//.test(uri)) {
    return `scheme://domain${uri[0] === '/' ? '' : '/'}${uri}`;
  }

  return uri;
}

module.exports = {
  addUriDefaultScheme,
  enumChapters,
  enumChaptersApis,
  enumChaptersNotes,
  enumUriPlaceholders,
};
