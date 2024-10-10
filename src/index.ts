// src/index.ts

type Action<C> = (context: C) => void;

type AfterTransition<E extends string, C> = {
  delay: number | ((context: C) => number);
  target: () => StateResult<E, C>;
};

type OnTransition<E extends string, C> = {
  [K in E]: {
    target: () => StateResult<E, C>;
  };
};

type StateDefinition<E extends string, C> = {
  context: C;
  action?: Action<C>;
  after?: AfterTransition<E, C>;
  on?: OnTransition<E, C>;
  initial?: StateResult<E, C>;
  states?: Record<string, StateResult<E, C>>;
};

// Separate types for State Machine and Single States
export type StateMachine<E extends string, C> = {
  send: (event: E) => void;
  setState: (state: StateResult<E, C>) => void;
  value: StateResult<E, C>;
  context: C;
};

export type StateResult<E extends string, C> = {
  send: (event: E) => void;
  context: C; // Added context here
} & Partial<{
  setState: (state: StateResult<E, C>) => void;
  action: Action<C>;
  after: AfterTransition<E, C>;
  on: OnTransition<E, C>;
}>;

export function createState<E extends string, C>(
  definition: StateDefinition<E, C>
): StateMachine<E, C> | StateResult<E, C> {
  if (definition.states) {
    // Create state machine
    const stateMachine: StateMachine<E, C> = {
      send: () => {},
      setState: () => {},
      value: null as unknown as StateResult<E, C>, // Temporarily set to null, will be initialized
      context: definition.context,
    };

    const states = definition.states;

    // Assign send methods of states to the state machine's send
    for (const key in states) {
      const state = states[key];
      state.send = (event: E) => stateMachine.send(event);
    }

    // Implement setState
    stateMachine.setState = (state: StateResult<E, C>) => {
      stateMachine.value = state;

      if (state.action) {
        state.action(stateMachine.context);
      }

      if (state.after) {
        const delay =
          typeof state.after.delay === 'function'
            ? state.after.delay(stateMachine.context)
            : state.after.delay;

        setTimeout(() => {
          const target = state.after!.target();
          stateMachine.setState!(target);
        }, delay);
      }
    };

    // Implement send
    stateMachine.send = (event: E) => {
      const currentState = stateMachine.value;

      if (currentState && currentState.on && currentState.on[event]) {
        const target = currentState.on[event].target();
        stateMachine.setState!(target);
      } else {
        console.warn(
          `No transition defined for event '${event}' in state '${currentState}'.`
        );
      }
    };

    // Initialize with initial state
    if (definition.initial) {
      stateMachine.setState(definition.initial);
    } else {
      throw new Error(
        "Initial state must be defined when 'states' are provided."
      );
    }

    return stateMachine;
  } else {
    // Create single state
    const state: StateResult<E, C> = {
      send: (event: E) => {},
      context: definition.context, // Now allowed
    };

    // Assign action, after, on if present
    if (definition.action) {
      state.action = definition.action;
    }
    if (definition.after) {
      state.after = definition.after;
    }
    if (definition.on) {
      state.on = definition.on;
    }

    // Implement send
    state.send = (event: E) => {
      if (state.on && state.on[event]) {
        const target = state.on[event].target();
        state.setState?.(target);
      }
    };

    // Implement setState
    state.setState = (newState: StateResult<E, C>) => {
      if (newState.action) {
        newState.action(newState.context);
      }

      if (newState.after) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(newState.context)
            : newState.after.delay;

        setTimeout(() => {
          const target = newState.after!.target();
          newState.setState?.(target);
        }, delay);
      }

      // Note: Do NOT set state.value to avoid circular references
    };

    // Initialize state
    if (definition.initial) {
      state.setState?.(definition.initial);
    }

    return state;
  }
}
