function requestWs(app) {
  const ws = {
    on(event, fn) {

    },
    send(message) {
      ws.$sendResolve(message);
    },
    terminate() {

    },
  };

  ws.$sendPromise = new Promise((resolve) => ws.$sendResolve = resolve);

  const req = {
    pipes: [],
    do(fn) {
      req.pause().pipes.push(() => fn(ws));

      return req;
    },
    expect(fn) {
      req.pipes.push(() => ws.$sendPromise.then((message) => fn(message, ws)))

      return req;
    },
    pause() {
      req.pipes.push(() => new Promise((resolve) => setTimeout(resolve, 100)));

      return req;
    },
    send(url) {
      req.pipes.push(() => app.wsServer.emit('connection', ws, { url }));

      return req;
    },
    async then(success, fail) {
      try {
        for (const pipe of req.pipes) {
          await pipe();
        }

        success();
      } catch (e) {
        fail(e);
      }
    },
  };

  return req;
}

module.exports = {
  requestWs,
};
