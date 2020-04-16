module.exports = (...args) => {
    const handlebars = typeof require === 'function' ? require('handlebars') : window.Handlebars;

    const options = args.pop();

    return new handlebars.SafeString(args.filter(_ => _).join(' / '));
}
