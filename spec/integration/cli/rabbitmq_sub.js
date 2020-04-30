const amqp = require('amqplib');

(async() => {
  const connection = await amqp.connect('amqp://127.0.0.1:5672');
  const channel = await connection.createChannel();
  await channel.assertQueue('publish');
  await channel.consume('publish', (message) => {
    console.log(message);
  });
})();
