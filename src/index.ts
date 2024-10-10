type Action<C> = (context: C) => void;

type AfterTransition<C> = {
  delay: number | ((context: C) => number);
  target: () => UnifiedState<C>;
};

type OnTransition<C> = {
  [K: string]: {
    target: () => UnifiedState<C>;
  };
};

type UnifiedState<C> = {
  send: (event: keyof OnTransition<C>) => void;
  setState: (state: UnifiedState<C>) => void;
  context?: C;
  action?: Action<C>;
  after?: AfterTransition<C>;
  on?: OnTransition<C>;
  states?: Record<string, UnifiedState<C>>;
  value?: UnifiedState<C>; // If it's a state machine, this tracks the current state
};

export function createState<C>(definition: UnifiedState<C>): UnifiedState<C> {
  const state: UnifiedState<C> = {
    send: (event: keyof OnTransition<C>) => {},
    setState: () => {},
    context: definition.context,
    action: definition.action,
    after: definition.after,
    on: definition.on,
    states: definition.states,
    value: undefined, // Will be assigned later if it's a state machine
  };

  if (definition.states) {
    // It's a state machine
    state.value = definition.value ?? (null as unknown as UnifiedState<C>); // Temporary assignment

    // Assign send methods of states to the state machine's send
    for (const key in definition.states) {
      const childState = definition.states[key];
      childState.send = (event: keyof OnTransition<C>) => state.send(event);
    }

    // Set the current state
    state.setState = (newState: UnifiedState<C>) => {
      state.value = newState;
      if (newState.action) {
        newState.action(state.context!);
      }

      if (newState.after) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(state.context!)
            : newState.after.delay;

        setTimeout(() => {
          const targetState = newState.after!.target();
          state.setState!(targetState);
        }, delay);
      }
    };

    // Implement send method for state machine
    state.send = (event: keyof OnTransition<C>) => {
      const currentState = state.value;
      if (currentState?.on && currentState.on[event]) {
        const target = currentState.on[event].target();
        state.setState!(target);
      } else {
        console.warn(`No transition defined for event '${String(event)}'.`);
      }
    };

    // Initialize with the first state
    if (definition.value) {
      state.setState(definition.value);
    } else {
      throw new Error(
        "Initial state must be defined when 'states' are provided."
      );
    }
  } else {
    // It's a single state
    state.setState = (newState: UnifiedState<C>) => {
      if (newState.action) {
        newState.action(newState.context!);
      }

      if (newState.after) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(newState.context!)
            : newState.after.delay;

        setTimeout(() => {
          const target = newState.after!.target();
          state.setState!(target);
        }, delay);
      }
    };

    // Implement send method for a single state
    state.send = (event: keyof OnTransition<C>) => {
      if (state.on && state.on[event]) {
        const target = state.on[event].target();
        state.setState(target);
      }
    };
  }

  return state;
}
