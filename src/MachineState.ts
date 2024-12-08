import { invariant } from './lib/invariant';
import { generateId } from './lib/generateId';

export type SerialisedState<S = string> =
  | S
  | { [K in string]: SerialisedState<S> };

/**
 * Represents an event that can be handled by the state machine.
 *
 * @template T - The type of data that can be carried by the event.
 */
export type MachineEvent<D = unknown> = {
  type: 'START' | 'STOP' | 'AFTER_DELAY' | string;
  data?: D;
};

/**
 * A function that updates the context.
 *
 * @template C - The type of context.
 * @param callback - A function that takes the current context and returns the new context.
 */
type UpdateContext<C> = (callback: (context: C) => C) => void;

/**
 * A function that sets a specific property of the context.
 *
 * @template C - The type of context.
 * @param key - A key of the context.
 * @param value - The value to set.
 */
type SetContext<C> = {
  <K extends keyof C>(key: K, value: C[K]): void;
};

/**
 * A callback function that can be scheduled to run after a delay.
 *
 * @template S - The type of state identifier.
 * @returns The state identifier.
 */
type AfterCallback<E extends MachineEvent, C> = ({
  context,
  setContext,
  updateContext,
  dispatch,
}: {
  context: C;
  setContext: SetContext<C>;
  updateContext: UpdateContext<C>;
  dispatch: (event: E) => void;
}) => Promise<string | void> | string | void;

/**
 * A function that is called when a state is entered.
 */
export type EnterAction<E extends MachineEvent, C> = (params: {
  context: C;
  setContext: SetContext<C>;
  updateContext: UpdateContext<C>;
  after: (ms: number, callback: AfterCallback<E, C>) => void;
}) => Promise<string | void> | string | void;

/**
 * A function that is called when a state is exited.
 */
export type ExitAction<C> = (params: { context: C }) => Promise<void> | void;

/**
 * A function that is called when a state is final.
 */
export type FinalAction<C> = (params: { context: C }) => Promise<void> | void;

/**
 * A function that is called when a transition is made.
 */
export type TransitionAction<C> = (params: {
  context: C;
  setContext: SetContext<C>;
  updateContext: UpdateContext<C>;
  state: SerialisedState<string>;
}) => Promise<void> | void;

/**
 * A function that is called when an event is handled.
 */
export type EventAction<E, C> = (params: {
  event: E;
  context: C;
  setContext: SetContext<C>;
  updateContext: UpdateContext<C>;
}) => string | void;

export class StateRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateRegistryError';
  }
}

export type MachineStateOptions<E extends MachineEvent, C extends object> = {
  id?: string;
  events?: E;
  context?: C;
  onEnter?: EnterAction<E, C>;
  onExit?: ExitAction<C>;
  onFinal?: FinalAction<C>;
  on?: {
    [K in E['type']]?: EventAction<Extract<E, { type: K }>, C>;
  };
};

export class MachineState<E extends MachineEvent, C extends object> {
  #context?: C;
  #children: MachineState<E, C>[] = [];
  #parent?: MachineState<E, C>;
  #timers: ReturnType<typeof setTimeout>[] = [];
  #actions: Partial<{
    [K in E['type']]: EventAction<Extract<E, { type: K }>, C>;
  }> = {};
  #active = false;
  #initialChildId?: string;
  #finalChildId?: string;
  #history?: 'shallow' | 'deep';
  #id: string;

  events: E = {} as E;

  onEnter?: EnterAction<E, C>;
  onExit?: ExitAction<C>;
  onFinal?: FinalAction<C>;
  onTransition?: TransitionAction<C>;

  get id(): string {
    return this.#id;
  }

  get isActive(): boolean {
    return this.#active;
  }

  get isParallel(): boolean {
    return !this.#initialChildId;
  }

  get isFinal(): boolean {
    return !this.#finalChildId;
  }

  get initialChildId(): string | undefined {
    return this.#initialChildId;
  }

  set initialChildId(value: string | undefined) {
    this.#initialChildId = value;
  }

  get children(): MachineState<E, C>[] {
    return this.#children;
  }

  get context(): C {
    if (this.#context) {
      return this.#context;
    }

    return this.#parent?.context as C;
  }

  set context(value: C) {
    if (this.#context !== undefined) {
      this.#context = value;
    } else if (this.#parent) {
      this.#parent.context = value;
    } else {
      throw new Error('Context not found in current or parent state nodes');
    }
  }

  constructor(options: MachineStateOptions<E, C>) {
    this.#id = options.id ?? generateId();
    this.#context = options.context;
    this.onEnter = options.onEnter;
    this.onExit = options.onExit;
    this.onFinal = options.onFinal;

    if (options.on) {
      for (const [eventType, handler] of Object.entries(options.on)) {
        this.setTransitionAction(
          eventType as E['type'],
          handler as EventAction<Extract<E, { type: E['type'] }>, C>,
        );
      }
    }
  }

  addChildState(child: MachineState<E, C>, initial = false, final = false) {
    if (this.#children.some((c) => c.id === child.id)) {
      throw new StateRegistryError(
        `Child state with ID ${child.id} already exists`,
      );
    }

    child.#parent = this;
    this.#children.push(child);

    if (initial) {
      this.#initialChildId = child.id;

      if (this.isActive) {
        child.enter();
      }
    }

    if (final) {
      this.#finalChildId = child.id;
    }

    return this;
  }

  /**
   * Removes a child state from the current state node.
   *
   * @param child - The child state to remove.
   * @returns The current state node.
   */
  removeChildState(child: MachineState<E, C>) {
    child.#parent = undefined;

    if (this.#active) {
      child.exit();
    }

    this.#children = this.#children.filter((c) => c !== child);

    if (this.#initialChildId === child.id) {
      this.#initialChildId = undefined;
    }

    return this;
  }

  /**
   * Appends a child state to the current state node.
   *
   * @param params - The parameters for the child state.
   * @returns The child state node.
   */
  appendChild(params: {
    id: string;
    onEnter?: EnterAction<E, C>;
    onExit?: ExitAction<C>;
    on?: {
      [K in E['type']]?: EventAction<Extract<E, { type: K }>, C>;
    };
    initial?: boolean;
    final?: boolean;
  }) {
    const child = new MachineState<E, C>({
      id: params.id,
      context: this.#context,
      onEnter: params.onEnter,
      onExit: params.onExit,
      on: params.on,
    });

    this.addChildState(child, params.initial, params.final);

    return child;
  }

  /**
   * Sets an action for an event type.
   */
  setTransitionAction<T extends E['type']>(
    eventType: T,
    action: EventAction<Extract<E, { type: T }>, C>,
  ) {
    this.#actions[eventType] = action;
  }

  /**
   * Dispatches an event to the current state node.
   *
   * @param event - The event to dispatch.
   */
  dispatch(event: E): void {
    this.getRootState().propagateEvent(event);
  }

  /**
   * Propagates an event to the current state node.
   *
   * @param event - The event to propagate.
   */
  private propagateEvent(event: E) {
    // Only dispatch events if the state is active
    if (this.#active) {
      const action = this.#actions[event.type as E['type']];

      // If the action exists, dispatch the event
      if (action) {
        const targetId = action({
          event: event as Extract<E, { type: E['type'] }>,
          context: this.context,
          setContext: this.setContext.bind(this),
          updateContext: this.updateContext.bind(this),
        });

        // If the action returns a targetId, transition to that state
        if (targetId) {
          this.transition(targetId);
        }
      }

      // Dispatch the event to all children
      for (const child of this.#children) {
        if (child.isActive) {
          child.propagateEvent(event);
        }
      }
    } else {
      console.warn('State is not active, skipping event dispatch', event);
    }
  }

  /**
   * Transitions to the target state.
   * This method should be called on the state that is currently active.
   *
   * @param targetId - The ID of the target state.
   */
  async transition(targetId: string) {
    // Find target state and common ancestor
    const targetState =
      this.getStateById(targetId, this) ||
      this.findTargetStateInAncestors(targetId);

    invariant(targetState, `State with ID ${targetId} not found`);
    invariant(targetState.#parent, 'Target state has no parent');

    const commonAncestor = this.findCommonAncestor(targetState);
    invariant(commonAncestor, 'Common ancestor not found');

    // Exit current state branch up to common ancestor and collect states to enter
    const { statesToEnter } = await this.exitToAncestor(commonAncestor);

    // Enter collected states in reverse order
    await Promise.all(
      statesToEnter
        .slice(1)
        .reverse()
        .map((state) => state.enter()),
    );

    // Enter target state
    await targetState.enter();

    // Notify ancestors of transition
    this.notifyAncestorsOfTransition(targetState);
  }

  private getRootState() {
    let current: MachineState<E, C> | undefined = this; // eslint-disable-line @typescript-eslint/no-this-alias

    while (current.#parent) {
      current = current.#parent;
    }

    return current;
  }

  private findTargetStateInAncestors(targetId: string) {
    let ancestor = this.#parent;

    while (ancestor) {
      const found = ancestor.getStateById(targetId);

      if (found) {
        return found;
      }

      ancestor = ancestor.#parent;
    }

    return undefined;
  }

  private findCommonAncestor(targetState: MachineState<E, C>) {
    let ancestor: MachineState<E, C> | undefined = this; // eslint-disable-line @typescript-eslint/no-this-alias

    while (ancestor) {
      if (this.isAncestorOf(ancestor, targetState)) {
        return ancestor;
      }

      ancestor = ancestor.#parent;
    }

    return undefined;
  }

  private isAncestorOf(
    ancestor: MachineState<E, C>,
    node: MachineState<E, C>,
  ): boolean {
    let current = node;

    while (current.#parent) {
      if (current.#parent === ancestor) {
        return true;
      }

      current = current.#parent;
    }

    return false;
  }

  private async exitToAncestor(ancestor: MachineState<E, C>) {
    const statesToEnter: MachineState<E, C>[] = [];
    let currentState: MachineState<E, C> = this; // eslint-disable-line @typescript-eslint/no-this-alias

    while (currentState !== ancestor) {
      await currentState.exit();

      currentState = currentState.#parent!;

      invariant(currentState, 'Current state not found');

      statesToEnter.push(currentState);
    }

    return { statesToEnter };
  }

  private notifyAncestorsOfTransition(targetState: MachineState<E, C>) {
    const context = this.context;
    const setContext = this.setContext.bind(this);
    const updateContext = this.updateContext.bind(this);
    let currentState = targetState;

    while (currentState) {
      currentState.onTransition?.({
        state: currentState.serialiseState(),
        context,
        setContext,
        updateContext,
      });

      currentState = currentState.#parent!;
    }
  }

  /**
   * Returns the active children of the current state.
   *
   * @returns The active children of the current state.
   */
  getActiveChildren() {
    return this.#children.filter((child) => child.isActive);
  }

  /**
   * Serialises the current state.
   *
   * @returns The serialised state.
   */
  serialiseState(): SerialisedState {
    const activeChildren = this.getActiveChildren();

    if (activeChildren.length === 0) {
      return this.id;
    }

    return Object.fromEntries(
      activeChildren.map((child, index) => [index, child.serialiseState()]),
    );
  }

  /**
   * Enters the current state.
   */
  async enter() {
    console.log('Entering state', this.id);
    // Set the state as active
    this.#active = true;

    // Bind the after function to the current state context
    const context = this.context;
    const after = this.after.bind(this);
    const setContext = this.setContext.bind(this);
    const updateContext = this.updateContext.bind(this);

    const enterPromise = Promise.resolve(
      this.onEnter?.({
        after,
        context,
        setContext,
        updateContext,
      }),
    ).then((targetId) => {
      if (targetId) {
        this.transition(targetId);
      }
    });

    if (this.#children.length) {
      const childEnterPromises: Promise<void>[] = [];

      // Check if the state is parallel, meaning it can have multiple active child states
      if (this.isParallel) {
        // If parallel, enter all child states
        for (const child of this.#children) {
          childEnterPromises.push(child.enter());
        }
      } else {
        // Select the first initial child state or the first child state if no initial state is found
        const initialChild = this.#children.find(
          (child) => child.id === this.initialChildId,
        );

        if (!initialChild) {
          throw new Error(`No initial child state found for state ${this.id}`);
        }

        // Enter the selected initial child state
        childEnterPromises.push(initialChild.enter());
      }

      await Promise.all([enterPromise, ...childEnterPromises]);
    }

    if (this.isFinal) {
      this.#parent?.onFinal?.({
        context,
      });
    }
  }

  /**
   * Exits the current state and performs cleanup unless preserving history.
   *
   * @param preserveHistory - Whether to preserve history.
   */
  async exit(preserveHistory?: 'shallow' | 'deep') {
    console.log('Exiting state', this.id);
    // Perform cleanup unless we're preserving history
    if (!preserveHistory) {
      this.cleanup();
      this.#active = false;
    }

    // Clear all timers regardless of history
    this.#timers.forEach(clearTimeout);
    this.#timers = [];

    const exitPromise = this.onExit?.({
      context: this.context,
    });

    // Exit active children, preserving history if specified
    const historyToPreserve =
      preserveHistory === 'deep' ? 'deep' : this.#history;

    const childExitPromises = this.#children
      .filter((child) => child.isActive)
      .map((child) => child.exit(historyToPreserve));

    const promises = [exitPromise, ...childExitPromises];

    await Promise.all(promises);
  }

  /**
   * Schedules a callback to be executed after a specified delay.
   *
   * @param ms - The delay in milliseconds.
   * @param callback - The callback to execute.
   */
  after(ms: number, callback: AfterCallback<E, C>) {
    console.log('Scheduling callback', ms, callback);
    // Create a timer that will execute the callback function after the specified delay
    const timer = setTimeout(async () => {
      // Execute the callback function to get the ID of the state to transition to
      const stateId = await callback({
        context: this.context,
        setContext: this.setContext.bind(this),
        updateContext: this.updateContext.bind(this),
        dispatch: this.dispatch.bind(this),
      });

      if (stateId) {
        // Transition to the new state
        this.transition(stateId);
      }
    }, ms);

    // Store the timer to ensure it can be cleared later if necessary
    this.#timers.push(timer);
  }

  /*
   * Searches for and returns a StateNode with the given ID in the state tree
   * Performs a breadth-first search starting from the current node
   * Can exclude a specific node ID from the search
   * Returns undefined if no matching node is found
   *
   * @param id - The ID of the state to search for
   * @param current - The current state node to start the search from
   * @param excludeId - The ID of the state to exclude from the search
   * @returns The state node with the given ID, or undefined if not found
   */
  getStateById(
    id: string,
    current: MachineState<E, C> = this,
    excludeId?: string,
  ) {
    // Return early if we've found the excluded ID
    if (current.id === excludeId) {
      return undefined;
    }

    // Check if current node matches target ID
    if (current.id === id) {
      return current;
    }

    // Initialize queue with current node's children
    const queue: MachineState<E, C>[] = [...current.#children];

    // Perform breadth-first search
    while (queue.length > 0) {
      const node = queue.shift()!;

      // Skip excluded nodes
      if (node.id === excludeId) {
        continue;
      }

      // Return if we found the target ID
      if (node.id === id) {
        return node;
      }

      // Add children to queue to continue search
      queue.push(...node.#children);
    }
  }

  /**
   * Returns the child state with the given ID.
   *
   * @param id - The ID of the child state to search for.
   * @returns The child state with the given ID, or undefined if not found.
   */
  getChildById(id: string) {
    return this.#children.find((child) => child.id === id);
  }

  /**
   * Clears all timers and handlers.
   */
  cleanup() {
    // Clear all timers
    this.#timers.forEach(clearTimeout);
    this.#timers = [];

    // Recursively cleanup children
    this.#children.forEach((child) => child.cleanup());
  }

  /**
   * Sets a specific property of the context.
   *
   * @param key - A key of the context.
   * @param value - The value to set.
   */
  setContext<K extends keyof C>(key: K, value: C[K]): void {
    this.context[key] = value;
  }

  /**
   * Updates the context by applying a callback function to the current context.
   *
   * @param callback - A function that takes the current context and returns the new context.
   */
  updateContext(callback: (context: C) => Partial<C>) {
    if (!this.#context) {
      throw new Error('Context not found');
    }

    const result = callback(this.context);

    if (typeof result !== 'object') {
      throw new Error('Context update must return an object');
    }

    this.context = {
      ...this.context,
      ...result,
    };
  }

  /**
   * Checks if the current state matches a given path.
   *
   * @param path - The path to check against.
   * @returns True if the current state matches the path, false otherwise.
   */
  matches(path: string): boolean {
    // Split path into segments and keep original order
    const segments = path.split('.');

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentState: MachineState<E, C> | undefined = this;

    // Traverse down the path
    for (const segment of segments) {
      currentState = currentState.getChildById(segment);

      invariant(
        currentState,
        `State with ID "${segment}" not found in "${path}"`,
      );
    }

    return currentState.isActive;
  }

  /**
   * Clones the current state node.
   *
   * @returns A new state node with the same context and children.
   */
  clone() {
    return new MachineState<E, C>(this);
  }
}
