const redis = require('redis');

const connectiin = redis.createClient('redis://127.0.0.1:6379');

connectiin.publish('subscribe', process.argv[2] || 'test', () => connectiin.quit());
