const nats = require('nats');

const connectiin = nats.connect('nats://127.0.0.1:4222');

connectiin.subscribe('subscribe', (message) => console.log(message));
