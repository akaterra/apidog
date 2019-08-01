const ee = (function () {
  const events = {};

  const fn = {
    emit(event, ...args) {
      if (event in events) {
        for (const cb of events[event]) {
          cb(...args);
        }
      }

      return fn;
    },
    on(event, cb) {
      if (!(event in events)) {
        events[event] = [];
      }

      events[event].push(cb);

      return fn;
    },
  };

  return fn;
})();
