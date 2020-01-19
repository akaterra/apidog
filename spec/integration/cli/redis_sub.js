const redis = require('redis');

const connectiin = redis.createClient('redis://127.0.0.1:6379');

connectiin.subscribe('publish');
connectiin.on('message', (channel, message) => {
  console.log(channel, message);
});
