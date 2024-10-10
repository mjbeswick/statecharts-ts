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

export type UnifiedState<C> = {
  send: (event: keyof OnTransition<C>) => void;
  setState: (state: UnifiedState<C>) => void;
  context?: C;
  action?: Action<C>;
  after?: AfterTransition<C>;
  on?: OnTransition<C>;
  states?: Record<string, UnifiedState<C>>;
  value?: UnifiedState<C>;
};

export function createState<C>(
  definition: Omit<UnifiedState<C>, 'send' | 'setState'>
): UnifiedState<C> {
  const state: UnifiedState<C> = {
    send: () => {}, // Placeholder, will be initialized later
    setState: () => {}, // Placeholder, will be initialized later
    context: definition.context,
    action: definition.action,
    after: definition.after,
    on: definition.on,
    states: definition.states,
    value: undefined,
  };

  if (definition.states) {
    // State machine case
    state.value = definition.value ?? (null as unknown as UnifiedState<C>);

    // Set state method to change current state in a state machine
    state.setState = (newState: UnifiedState<C>) => {
      state.value = newState;
      if (newState.action) newState.action(state.context!);
      if (newState.after) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(state.context!)
            : newState.after.delay;
        setTimeout(() => state.setState!(newState.after!.target()), delay);
      }
    };

    state.send = (event: keyof OnTransition<C>) => {
      const currentState = state.value;
      if (currentState?.on && currentState.on[event]) {
        state.setState(currentState.on[event].target());
      } else {
        console.warn(`No transition defined for event '${String(event)}'.`);
      }
    };

    if (!definition.value) {
      throw new Error(
        "Initial state must be defined when 'states' are provided."
      );
    } else {
      state.setState(definition.value);
    }
  } else {
    // Single state case
    state.setState = (newState: UnifiedState<C>) => {
      if (newState.action) newState.action(state.context!);
      if (newState.after) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(state.context!)
            : newState.after.delay;
        setTimeout(() => state.setState!(newState.after!.target()), delay);
      }
    };

    state.send = (event: keyof OnTransition<C>) => {
      if (state.on && state.on[event]) {
        state.setState(state.on[event].target());
      }
    };
  }

  return state;
}
