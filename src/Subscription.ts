/**
 * A class that manages subscriptions to state changes in a state machine.
 * Provides methods to subscribe to state updates and handles cleanup of subscriptions.
 */
export class Subscription {
  /** Array of handler functions that will be called when state changes */
  #handlers: ((state: string) => void)[] = [];

  /**
   * Creates a new Subscription instance
   * @param unsubscribe - Function that will be called to remove a handler when unsubscribing
   */
  constructor() {
    this.#handlers = [];
  }

  /**
   * Subscribes a handler function to receive state updates
   * @param handler - Function that will be called with the new state when it changes
   * @returns A cleanup function that can be called to unsubscribe the handler
   */
  subscribe(handler: (state: string) => void) {
    this.#handlers.push(handler);
    return () => this.unsubscribe(handler);
  }

  /**
   * Unsubscribes a handler function from receiving state updates
   * @param handler - Function that was previously subscribed to state updates
   */
  unsubscribe(handler: (state: string) => void) {
    this.#handlers = this.#handlers.filter((h) => h !== handler);
  }

  /**
   * Clears all handlers from the subscription
   */
  clear() {
    this.#handlers = [];
  }
}
