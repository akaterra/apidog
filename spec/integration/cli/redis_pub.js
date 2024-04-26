const redis = require('redis');

(async () => {
  const connectiin = await redis.createClient('redis://127.0.0.1:6379');

  await connectiin.publish('subscribe', process.argv[2] || 'test', () => connectiin.quit());  
})();
