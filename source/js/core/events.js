define([], function () {
  "use strict";
  var arr     = Array.prototype,
      manager = {};

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `'*'` will bind the callback to all events fired
  function on(events, callback, context) {
    /* jshint validthis: true */
    var ev, list, tail;
    events = events.split(/\s+/);
    var calls = this._events || (this._events = {});
    // The events.length check before events.shift() protects us against prototype.js
    while (events.length && (ev = events.shift())) {
      // create an immutable callback list, allowing traversal during
      // modification. the tail is an empty object that will always be used
      // as the next node
      list = calls[ev] || (calls[ev] = {});
      tail = list.tail || (list.tail = list.next = {});
      tail.callback = callback;
      tail.context = context;
      list.tail = tail.next = {};
    }
    return this;
  }

  // remove one or many callbacks. if `context` is null, removes all callbacks
  // with that function. if `callback` is null, removes all callbacks for the
  // event. if `events` is null, removes all bound callbacks for all events
  function off(events, callback, context) {
    /* jshint validthis: true */
    var ev,
      calls = this._events,
      node;

    if (!events) {
      delete this._events;
    } else if (calls) {
      events = events.split(/\s+/);
      while (events.length && (ev = events.shift())) {
        node = calls[ev];
        delete calls[ev];
        if (!callback || !node) {
          continue;
        }

        // create a new list, omitting the indicated event/context pairs
        while ((node = node.next) && node.next) {
          if (node.callback === callback && (!context || node.context === context)) {
            continue;
          }
          this.on(ev, node.callback, node.context);
        }
      }
    }

    return this;
  }

  // emit an event, firing all bound callbacks. callbacks are passed the
  // same arguments as `emit` is, apart from the event name.
  function emit(events) {
    /* jshint validthis: true */
    var event, node, calls, tail, args, rest;
    if (!(calls = this._events)) {
      return this;
    }

    (events = events.split(/\s+/)).push(null);

    // save references to the current heads & tails
    while (events.length && (event = events.shift())) {
      if (!(node = calls[event])) {
        continue;
      }
      events.push({
        next: node.next,
        tail: node.tail
      });
    }

    // traverse each list, stopping when the saved tail is reached.
    rest = arr.slice.call(arguments, 1);
    while ((node = events.pop())) {
      tail = node.tail;
      args = node.event ? [node.event].concat(rest) : rest;
      while ((node = node.next) !== tail) {
        node.callback.apply(node.context || this, args);
      }
    }

    return this;
  }

  manager.on = function () {
    var args = Array.prototype.slice.call(arguments);
    on.apply(manager, args);
  };
  manager.off = function () {
    var args = Array.prototype.slice.call(arguments);
    off.apply(manager, args);
  };
  manager.emit = function () {
    var args = Array.prototype.slice.call(arguments);
    emit.apply(manager, args);
  };

  return {
    on   : manager.on,
    off  : manager.off,
    emit : manager.emit
  };
});