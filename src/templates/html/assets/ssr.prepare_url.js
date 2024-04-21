function prepareUrl(url, queryParams, params) {
  const usedQueryParams = [];
  let preparedUrl = url.replace(/:\w+/g, (key) => {
    if (has(params, key.substr(1))) {
      const value = get(params, key.substr(1));

      del(params, key.substr(1));

      return encodeURIComponent(Array.isArray(value) ? value[0] : value);
    } else if (has(queryParams, key.substr(1))) {
      const value = get(queryParams, key.substr(1));

      usedQueryParams.push(key.substr(1));

      return encodeURIComponent(Array.isArray(value) ? value[0] : value);
    } else {
      return key;
    }
  });

  if (queryParams) {
    const preparedUrlQueryParams = []; 

    for (const [queryKey, queryValue] of Object.entries(queryParams)) {
      if (!preparedUrl.includes(queryKey)) {
        const strValue = String(Array.isArray(queryValue) ? queryValue[0] : queryValue);

        if (strValue !== '') {
          preparedUrlQueryParams.push(`${queryKey}=${encodeURIComponent(strValue)}`);
        }
      }
    }

    if (preparedUrlQueryParams.length) {
      if (url.lastIndexOf('?') === -1) {
        preparedUrl += '?';
      }

      preparedUrl += preparedUrlQueryParams.join('&');
    }
  }

  return preparedUrl;
}

if (typeof module !== 'undefined') {
  module.exports.prepareUrl = prepareUrl;
}
