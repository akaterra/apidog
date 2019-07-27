const parser = require('../src/parser');

describe('parser for @api token by parseBlockLines', () => {
  it('should parse for http transport', () => {
    const lines = [
      '@api {get} /url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(block).toEqual({
      api: {
        endpoint: '/url',
        title: 'This is a title',
        transport: {name: 'http', method: 'get'},
      },
      title: 'This is a title',
      validate: block.validate,
    })
  });

  it('should parse for rabbitmq transport with exchange', () => {
    const lines = [
      '@api {rabbitmq:exchange} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'rabbitmq', exchange: 'exchange'},
      },
      title: 'This is a title',
      validate: block.validate,
    })
  });

  it('should parse for rabbitmq rpc transport with exchange', () => {
    const lines = [
      '@api {rabbitmqrpc:exchange} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'rabbitmqrpc', exchange: 'exchange'},
      },
      title: 'This is a title',
      validate: block.validate,
    })
  });

  it('should parse for nats transport with exchange', () => {
    const lines = [
      '@api {nats} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'nats'},
      },
      title: 'This is a title',
      validate: block.validate,
    })
  });

  it('should raise error on malformed', () => {
    const lines = [
      '@api',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });

  it('should raise error on missing transport', () => {
    const lines = [
      '@api url This is a title',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });

  it('should raise error on unknown transport', () => {
    const lines = [
      '@api {unknown} url This is a title',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });

  it('should raise error on duplicated definition', () => {
    const lines = [
      '@api url This is a title', '@api url This is a title',
    ];

    expect(() => parser.parseBlockLines(lines)).toThrow();
  });
});
