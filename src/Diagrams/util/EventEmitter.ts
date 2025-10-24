import { Callback, Callbacks, Map, UnSubscriber } from './types';

export type { Callback, Map, UnSubscriber } from './types';

/**
 * @public
 *
 * The `EventEmitter` class is a generic utility for handling events. It allows subscribing to and emitting events.
 * This class is generic and works with a `Map` where keys are event names and values are the types associated with those events.
 *
 * @typeParam  Events - An extension of `Map` where the key is the event name and the value is the type of data associated with that event.
 */
export class EventEmitter<Events extends Map> {
  protected callbacks: Record<'on', Callbacks<Events>> = {
    on: {} as Callbacks<Events>,
  };
  protected enabled = true;

  protected debugMode = false;
  debug(enable = true) {
    this.debugMode = enable;
  }

  /**
   * Emits an event with the given data. Any listeners subscribed to this event will be invoked with the passed data.
   *
   * @param event - The event name to emit.
   * @param data - The data associated with the event. Its type is dependent on the event name.
   */
  emit<K extends keyof Events>(event: K, data: Events[K]) {
    for (const { cb } of [...(this.callbacks.on[event] ?? [])].sort(
      (a, b) => a.priority - b.priority,
    )) {
      if (cb(data) === false) {
        break;
      }
    }
  }

  /**
   * Reflects the current emitter state. A disabled state indicates that the emitter wont call listeners until its functionality gets enabled again.
   */
  get isEnabled() {
    return this.enabled;
  }

  /**
   * Subscribes a callback function to an event. The callback is invoked each time the event is emitted.
   *
   * @param event - The event name to listen to.
   * @param cb - The callback function to be invoked when the event is emitted.
   * @returns A function to unsubscribe the event listener.
   */
  on<K extends keyof Events>(
    event: K,
    cb: Callback<Events, K>,
    priority = Infinity,
  ): UnSubscriber {
    if (!this.callbacks.on[event]) this.callbacks.on[event] = [];
    this.callbacks.on[event].push({ cb, priority });

    return () => {
      this.callbacks.on[event] = this.callbacks.on[event].filter(
        (c) => c.cb !== cb,
      );
    };
  }
}
