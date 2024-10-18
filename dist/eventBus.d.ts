/**
 * Represents an event bus for managing event subscriptions and publications.
 * @template E The type of events handled by this event bus.
 */
export type EventBus<E> = {
    /**
     * Subscribes a callback function to receive events.
     * @param callback The function to be called when an event is published.
     */
    subscribe: (callback: (event: E) => void) => void;
    /**
     * Publishes an event to all subscribed callbacks.
     * @param event The event to be published.
     */
    publish: (event: E) => void;
};
/**
 * Creates and returns a new event bus.
 * @template E The type of events handled by this event bus.
 * @returns An object implementing the EventBus interface.
 */
export declare function createEventBus<E>(): EventBus<E>;
