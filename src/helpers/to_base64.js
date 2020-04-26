module.exports = (...args) => {
    const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

    return new handlebars.SafeString(Buffer.from(args[0]).toString('base64'));
};
