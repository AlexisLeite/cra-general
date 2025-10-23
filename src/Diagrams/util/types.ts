/**
 * @public
 *
 * A basic Record
 * */
export type Map = Record<string, unknown>

/**
 * @public
 *
 * This is the callback provided by the listener any time it wants to subscribe to an event.
 */
export type Callback<
  Events extends Map,
  K extends keyof Events = keyof Events,
> = (data: Events[K]) => unknown

/**
 * @internal
 *
 * This is the emitter's callbacks storage
 */
export type Callbacks<Events extends Map> = {
  [K in keyof Events]: Callback<Events, K>[]
}

/**
 * @public
 *
 * A method that unsubscribes the recently made subscription.
 */
export type UnSubscriber = () => void
