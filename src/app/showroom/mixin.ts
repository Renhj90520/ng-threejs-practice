import * as _ from 'lodash';
export function applyMixins(derivedCtor, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      if (name !== 'constructor') {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
        );
      }
    });
  });
}

export class EventMixins {
  _events: any;
  on(eventName, callback?, context?) {
    if (dispatchEvent(this, 'on', eventName, [callback, context]) && callback) {
      if (!this._events) {
        this._events = {};
      }
      this._events[eventName] = this._events[eventName] || [];
      this._events[eventName].push({ callback, context, ctx: context || this });
    }
    return this;
  }
  once(eventName, callback?, context?) {
    if (
      !dispatchEvent(this, 'once', eventName, [callback, context]) ||
      !callback
    ) {
      return this;
    }

    const that = this;
    const events: any = _.once(function () {
      that.off(eventName, events);
      callback.apply(this, arguments);
    });

    events._callback = callback;
    this.on(eventName, events, context);
  }

  off(eventName, callback?, context?) {
    if (
      !this._events ||
      !dispatchEvent(this, 'off', eventName, [callback, context])
    ) {
      return this;
    }

    if (!eventName && !callback && !context) {
      this._events = undefined;
      return this;
    }

    const events = eventName ? [eventName] : _.keys(this._events);
    for (let i = 0; i < events.length; i++) {
      eventName = events[i];
      const event = this._events[eventName];
      if (event) {
        this._events[eventName] = [];
        if (callback || context) {
          for (let j = 0; j < event.length; j++) {
            const e = event[j];
            if (
              (callback &&
                callback !== e.callback &&
                callback !== e.callback._callback) ||
              (context && context !== e.context)
            ) {
              this._events.push(e);
            }
          }
        }
        if (this._events.length === 0) {
          delete this._events[eventName];
        }
      }
    }

    return this;
  }

  trigger(eventName, ...argss) {
    if (!this._events) return this;
    const args = Array.prototype.slice.apply(arguments);
    const context = args.slice(1);
    if (!dispatchEvent(this, 'trigger', eventName, context)) return this;
    const event = this._events[eventName];
    const all = this._events.all;
    if (event) {
      handleEvents(event, context);
    }
    if (all) {
      handleEvents(all, arguments);
    }

    return this;
  }
}

function dispatchEvent(listener, eventType, events, args) {
  const strReg = /\s+/;
  if (!events) return true;
  if (typeof events === 'object') {
    for (const event in events) {
      listener[eventType].apply(listener, [event, events[event]].concat(args));
    }

    return false;
  }

  if (strReg.test(events)) {
    events = events.split(strReg);
    for (let i = 0; i < events.length; i++) {
      listener[eventType].apply(listener, [events[i]].concat(args));
    }
    return false;
  }

  return true;
}

function handleEvents(events, args) {
  let i = -1;
  const eventLength = events.length;
  const callback = args[0];
  const context = args[1];
  const eventName = args[2];

  switch (args.length) {
    case 0:
      for (; ++i < eventLength; ) {
        const event = events[i];
        event.callback.call(event.ctx);
      }
      break;
    case 1:
      for (; ++i < eventLength; ) {
        const event = events[i];
        event.callback.call(event.ctx, callback);
      }
      break;
    case 2:
      for (; ++i < eventLength; ) {
        const event = events[i];
        event.callback.call(event.ctx, callback, context);
      }
      break;
    case 3:
      for (; ++i < eventLength; ) {
        const event = events[i];
        event.callback.call(event.ctx, callback, context, eventName);
      }
      break;
    default:
      for (; ++i < eventLength; ) {
        const event = events[i];
        event.callback.apply(event.ctx, args);
      }
      break;
  }
}
