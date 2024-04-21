const parser = require('../src/parser.block_lines');
const apiToken = require('../src/annotations/api');

describe('parser.block_lines parseBlockLines @api annotation', () => {
  it('should parse http transport', () => {
    const lines = [
      '@api {get} /url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(block).toEqual(new parser.Block({
      api: {
        endpoint: '/url',
        title: 'This is a title',
        transport: {name: 'http', method: 'get'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
  });

  it('should parse nats pub transport', () => {
    const lines = [
      '@api {natspub} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'natspub'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
  });

  it('should parse nats rpc transport', () => {
    const lines = [
      '@api {natsrpc} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'natsrpc'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
  });

  it('should parse rabbitmq pub transport with exchange', () => {
    const lines = [
      '@api {rabbitmqpub:exchange} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'rabbitmqpub', exchange: 'exchange'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
  });

  it('should parse rabbitmq rpc transport with exchange', () => {
    const lines = [
      '@api {rabbitmqrpc:exchange} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'rabbitmqrpc', exchange: 'exchange'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
  });

  it('should parse socket io transport', () => {
    const lines = [
      '@api {socketio} url This is a title',
    ];

    const block = parser.parseBlockLines(lines);

    expect(parser.parseBlockLines(lines)).toEqual(new parser.Block({
      api: {
        endpoint: 'url',
        title: 'This is a title',
        transport: {name: 'socketio'},
      },
      title: 'This is a title',
      validate: block.validate,
    }));
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
