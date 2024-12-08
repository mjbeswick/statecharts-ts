/**
 * Throws an error with the provided message if the condition is falsy.
 * Acts as a type guard to inform TypeScript of guaranteed conditions after the check.
 *
 * @param condition - The condition to assert.
 * @param message - The error message to throw if the condition is falsy.
 * @throws {InvariantError} When the condition is falsy
 */
export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

export function invariant(
  condition: unknown,
  message: string | (() => string),
): asserts condition {
  if (condition === false || condition === null || condition === undefined) {
    const errorMessage = typeof message === 'function' ? message() : message;

    throw new InvariantError(errorMessage);
  }
}
