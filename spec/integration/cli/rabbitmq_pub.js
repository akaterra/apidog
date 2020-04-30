const amqp = require('amqplib');

(async() => {
  const connection = await amqp.connect('amqp://127.0.0.1:5672/test');
  const channel = await connection.createChannel();
  await channel.assertQueue('publish');
  await channel.sendToQueue('publish', Buffer.from(process.argv[2] || 'test'));
})();
