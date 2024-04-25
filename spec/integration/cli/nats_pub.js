const nats = require('nats');

(async () => {
  const connection = nats.connect({ service: [ 'nats://127.0.0.1:4222' ] });

  await connection.publish('subscribe', process.argv[2] || 'test');
  await connection.close();
})();
