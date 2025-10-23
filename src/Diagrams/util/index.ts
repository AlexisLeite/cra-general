import { Callback, Callbacks, Map, UnSubscriber } from './types'

export type { Callback, Map, UnSubscriber } from './types'

/**
 * @public
 *
 * The `EventEmitter` class is a generic utility for handling events. It allows subscribing to and emitting events.
 * This class is generic and works with a `Map` where keys are event names and values are the types associated with those events.
 *
 * @typeParam  Events - An extension of `Map` where the key is the event name and the value is the type of data associated with that event.
 */
export class EventEmitter<Events extends Map> {
  protected callbacks: Record<'on' | 'once', Callbacks<Events>> = {
    on: {} as Callbacks<Events>,
    once: {} as Callbacks<Events>,
  }
  protected enabled = true

  protected debugMode = false
  debug(enable = true) {
    this.debugMode = enable
  }

  /**
   * Emits an event with the given data. Any listeners subscribed to this event will be invoked with the passed data.
   *
   * @param event - The event name to emit.
   * @param data - The data associated with the event. Its type is dependent on the event name.
   */
  emit<K extends keyof Events>(event: K, data: Events[K]) {
    this.callbacks.on[event]?.forEach((current) => {
      current(data)
    })

    this.callbacks.once[event]?.forEach((current) => {
      current(data)
    })
    this.callbacks.once[event] = []
  }

  /**
   * Reflects the current emitter state. A disabled state indicates that the emitter wont call listeners until its functionality gets enabled again.
   */
  get isEnabled() {
    return this.enabled
  }

  /**
   * Subscribes a callback function to an event. The callback is invoked each time the event is emitted.
   *
   * @param event - The event name to listen to.
   * @param cb - The callback function to be invoked when the event is emitted.
   * @returns A function to unsubscribe the event listener.
   */
  on<K extends keyof Events>(event: K, cb: Callback<Events, K>): UnSubscriber {
    if (!this.callbacks.on[event]) this.callbacks.on[event] = []
    this.callbacks.on[event].push(cb)

    return () => {
      this.callbacks.on[event] = this.callbacks.on[event].filter(
        (c) => c !== cb,
      )
    }
  }

  /**
   * Subscribes a callback function to an event for a single occurrence. After the event is emitted once, the listener is automatically removed.
   *
   * @param event - The event name to listen to for a single occurrence.
   * @param cb - The callback function to be invoked when the event is emitted.
   * @returns A function to unsubscribe the event listener.
   */
  once<K extends keyof Events>(
    event: K,
    cb: Callback<Events, K>,
  ): UnSubscriber {
    if (!this.callbacks.once[event]) this.callbacks.once[event] = []
    this.callbacks.once[event].push(cb)

    return () => {
      this.callbacks.once[event] = this.callbacks.once[event].filter(
        (c) => c !== cb,
      )
    }
  }
}
