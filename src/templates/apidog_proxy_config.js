module.exports = {
  amqp: {
    allowedHeaders: [
      'X-Request-Id',
      'correlationId',
      'User-Agent',
    ],
    default: 'amqp://username:password@ip:5672/virtualHost',
  },
  http: {
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'User-Agent',
    ],
  }
};
