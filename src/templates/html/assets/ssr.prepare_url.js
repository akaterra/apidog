function prepareUrl(url, params) {

  return url.replace(/:\w+/g, (key) => {
    if (has(params, key.substr(1))) {
      const value = get(params, key.substr(1));

      del(params, key.substr(1));

      return encodeURIComponent(Array.isArray(value) ? value[0] : value);
    } else {
      return key;
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports.prepareUrl = prepareUrl;
}
