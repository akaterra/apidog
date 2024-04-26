const redis = require('redis');

(async () => {
  const connection = await redis.createClient('redis://127.0.0.1:6379');

  await connection.subscribe('publish', (message, channel) => {
    console.log(channel, message);
  });
})();
