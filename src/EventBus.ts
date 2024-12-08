import { MachineEvent } from './MachineState';

export class EventBusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventBusError';
  }
}

/**
 * A custom error class for EventBus-related errors.
 * Used to distinguish errors that occur during event handling and validation
 * from other types of errors in the system.
 */
export class EventBus<E extends MachineEvent, T = string> {
  private subscriptions: Map<T | '*', Set<(event: E) => void>>;

  constructor() {
    this.subscriptions = new Map();
    this.subscriptions.set('*', new Set());
  }

  /**
   * Subscribes a callback to handle events of a specific type.
   *
   * @param eventType - The type of event to subscribe to
   * @param callback - The callback function to execute when events occur
   * @returns A function to unsubscribe the callback
   */
  on(eventType: T, callback: (event: E) => void) {
    const currentSet = this.subscriptions.get(eventType) || new Set();
    this.subscriptions.set(eventType, new Set([...currentSet, callback]));

    return () => this.off(eventType, callback);
  }

  /**
   * Unsubscribes a callback from handling events of a specific type.
   *
   * @param eventType - The type of event to unsubscribe from
   * @param callback - The callback function to remove
   */
  off(eventType: T, callback: (event: E) => void) {
    this.subscriptions.get(eventType)?.delete(callback);
  }

  /**
   * Sends an event to all subscribed handlers.
   *
   * @param event - The event to send to subscribers
   * @throws {EventBusError} When event validation fails or handlers throw errors
   */
  async send(event: E) {
    // Validate event
    if (!event || !event.type) {
      throw new EventBusError('Invalid event: Event must have a type property');
    }

    // Handle global subscribers
    try {
      await Promise.all(
        Array.from(this.subscriptions.get('*') ?? []).map((callback) =>
          Promise.resolve(callback(event)),
        ),
      );
    } catch (error) {
      throw new EventBusError(
        `Global handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Handle event-specific subscribers
    const subscriptions = this.subscriptions.get(event.type as T);
    if (!subscriptions?.size) {
      console.warn(`No subscriptions for event type: ${event.type}`);
      return;
    }

    try {
      await Promise.all(
        Array.from(subscriptions).map((callback) =>
          Promise.resolve(callback(event)),
        ),
      );
    } catch (error) {
      throw new EventBusError(
        `Event handler failed for "${event.type}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Removes all subscriptions and cleans up resources.
   */
  cleanup() {
    this.subscriptions.clear();
    this.subscriptions.set('*', new Set());
  }

  /**
   * Enhanced clear method that uses cleanup
   */
  clear() {
    this.cleanup();
  }
}
