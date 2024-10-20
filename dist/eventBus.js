"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventBus = createEventBus;
/**
 * Creates and returns a new event bus.
 * @template E The type of events handled by this event bus.
 * @returns An object implementing the EventBus interface.
 */
function createEventBus() {
    const subscribers = [];
    function subscribe(callback) {
        subscribers.push(callback);
    }
    function publish(event) {
        for (const callback of subscribers) {
            callback(event);
        }
    }
    return {
        subscribe,
        publish,
    };
}
//# sourceMappingURL=eventBus.js.map