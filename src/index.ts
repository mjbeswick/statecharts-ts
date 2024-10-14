// Define the types for the State Machine

type Context = Record<string, any>; // Modify this based on your actual context structure

type Action = {
  (context: Context): void;
  guard?: (context: Context) => boolean; // Optional guard property
};

type After = {
  delay: number | ((context: Context) => number);
  target: () => State;
  guard?: (context: Context) => boolean; // Optional guard property
};

type EventHandler = {
  target: () => State;
  data?: (context: Context) => any;
  guard?: (context: Context) => boolean; // Optional guard property
};

type StateDefinition = {
  context: Context;
  action?: Action;
  after?: After;
  on?: Record<string, EventHandler>;
  states?: Record<string, StateDefinition>;
  state?: StateDefinition;
  parallel?: boolean;
};

export type State = {
  send: (event: string, data?: any) => void;
  setState: (newState: StateDefinition) => void;
  context: Context;
  action?: Action;
  after?: After;
  on?: Record<string, EventHandler>;
  states?: Record<string, State>;
  state?: StateDefinition;
  activeStates?: Record<string, State>;
  parallel?: boolean;
};

// Strongly typed `createState` function
export function createState(definition: StateDefinition, parent?: State): State {
  const state: State = {
    send: () => { },
    setState: () => { },
    context: definition.context,
    action: definition.action,
    after: definition.after,
    on: definition.on,
    states: definition.states ? {} : undefined,
    state: definition.parallel ? undefined : definition.state,
    activeStates: definition.parallel ? {} : undefined,
    parallel: definition.parallel,
  };

  if (definition.states) {
    if (state.parallel) {
      // Initialize each parallel sub-state
      Object.keys(definition.states).forEach((stateKey) => {
        const subStateDef = definition.states![stateKey];
        state.activeStates![stateKey] = createState(subStateDef);
        state.activeStates![stateKey].context = state.context;
      });

      if (definition.state) {
        throw new Error('state not value for parallel states');
      }

      // Handle setting parallel states
      state.setState = (newState: StateDefinition) => {
        throw new Error('setState not valid');
      };

      // Handle send for parallel states
      state.send = (event: string, data?: any) => {
        Object.values(state.activeStates!).forEach((activeState) => {
          if (activeState.on && activeState.on[event]) {
            const eventHandler = activeState.on[event];
            if (!eventHandler.guard || eventHandler.guard(state.context)) {
              activeState.setState(eventHandler.target());
              state.state = activeState.state;
            }
          }
        });
      };
    } else {
      // Non-parallel case (modified logic)
      Object.keys(definition.states).forEach((key) => {
        state.states![key] = createState(definition.states![key], state);
      });

      state.setState = (newState: StateDefinition) => {
        if (!newState.action?.guard || newState.action.guard(state.context)) {
          if (newState.action) {
            newState.action(state.context);
          }
        }
        if (newState.after && (!newState.after.guard || newState.after.guard(state.context))) {
          const delay =
            typeof newState.after.delay === 'function'
              ? newState.after.delay(state.context)
              : newState.after.delay;
          setTimeout(() => state.setState(newState.after!.target()), delay);
        }
        state.state = newState;
      };

      state.send = (event: string, data?: any) => {
        const currentState = state.state;
        if (currentState?.on && currentState.on[event]) {
          const eventHandler = currentState.on[event];
          if (!eventHandler.guard || eventHandler.guard(state.context)) {
            if (eventHandler.data) {
              const payload = eventHandler.data(state.context);
              console.log('Payload:', payload);
            }
            state.setState(eventHandler.target());
          }
        } else if (state.states) {
          // Check if any child state can handle the event
          Object.values(state.states).forEach((childState) => {
            if (childState.state?.on && childState.state.on[event]) {
              const eventHandler = childState.state.on[event];
              if (!eventHandler.guard || eventHandler.guard(state.context)) {
                if (eventHandler.data) {
                  const payload = eventHandler.data(state.context);
                  console.log('Payload:', payload);
                }
                state.setState(eventHandler.target());
                return;
              }
            }
          });
        } else {
          console.warn(`No transition defined for event '${event}'.`);
        }
      };

      if (!definition.state) {
        throw new Error(
          "Initial state must be defined when 'states' are provided."
        );
      }
    }

    if (definition.state) {
      state.setState(definition.state);
    }
  } else {
    // Single state case (modified logic)
    state.setState = (newState: StateDefinition) => {
      if (!newState.action?.guard || newState.action.guard(state.context)) {
        if (newState.action) newState.action(state.context);
      }
      if (newState.after && (!newState.after.guard || newState.after.guard(state.context))) {
        const delay =
          typeof newState.after.delay === 'function'
            ? newState.after.delay(state.context)
            : newState.after.delay;
        setTimeout(() => state.setState(newState.after!.target()), delay);
      }
      state.state = newState;
    };

    state.send = (event: string, data?: any) => {
      if (state.on && state.on[event]) {
        const eventHandler = state.on[event];
        if (!eventHandler.guard || eventHandler.guard(state.context)) {
          if (eventHandler.data) {
            const payload = eventHandler.data(state.context);
            console.log('Payload:', payload);
          }
          if (parent) {
            parent.setState(eventHandler.target());
          } else {
            state.setState(eventHandler.target());
          }
        }
      } else if (parent) {
        parent.send(event, data);
      }
    };
  }

  return state;
}
