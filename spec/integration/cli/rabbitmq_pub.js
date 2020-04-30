const amqp = require('amqplib');

(async() => {
  const connection = await amqp.connect('amqp://127.0.0.1:5672');
  const channel = await connection.createChannel();
  await channel.assertQueue('subscribe');
  await channel.sendToQueue('subscribe', Buffer.from(process.argv[2] || 'test'));
})();
