// index.ts

type Action<C> = (context: C) => void;

// AfterTransition now correctly uses E in the target
type AfterTransition<E extends string, C> = {
  delay: number | ((context: C) => number);
  target: () => StateResult<E, C>;
};

// OnTransition now maps events of type E to their respective targets
type OnTransition<E extends string, C> = {
  [K in E]: {
    target: () => StateResult<E, C>;
  };
};

// StateDefinition now correctly uses E and C, with E extending string
type StateDefinition<E extends string, C> = {
  context: C;
  action?: Action<C>;
  after?: AfterTransition<E, C>;
  on?: OnTransition<E, C>;
  initial?: StateResult<E, C>;
  states?: Record<string, StateResult<E, C>>;
};

// InternalState includes internal methods for state management
type InternalState<E extends string, C> = StateResult<E, C> & {
  _enterState: (machine: StateMachine<E, C>) => void;
  _exitState: () => void;
};

// StateResult is now generic over E and C, with E extending string
export type StateResult<E extends string, C> = {
  send: (event: E) => void;
} & Partial<{
  setState: (state: StateResult<E, C>) => void;
  value: StateResult<E, C>;
}>;

// State class implementing InternalState<E, C>
class State<E extends string, C> implements InternalState<E, C> {
  private action?: Action<C>;
  private after?: AfterTransition<E, C>;
  private on?: OnTransition<E, C>;
  private context: C;
  private machine?: StateMachine<E, C>;
  private timer?: ReturnType<typeof setTimeout>;

  // Implement InternalState<E, C>
  _enterState!: (machine: StateMachine<E, C>) => void;
  _exitState!: () => void;

  constructor(definition: StateDefinition<E, C>) {
    this.context = definition.context;
    this.action = definition.action;
    this.after = definition.after;
    this.on = definition.on;

    // Bind internal methods to maintain correct 'this' context
    this._enterState = this.enterState.bind(this);
    this._exitState = this.exitState.bind(this);
  }

  send(event: E): void {
    if (this.on && this.on[event]) {
      const targetState = this.on[event].target();
      if (this.machine) {
        this.machine.transitionTo(targetState);
      }
    }
  }

  // Internal method to handle entering the state
  private enterState(machine: StateMachine<E, C>): void {
    this.machine = machine;
    this.action?.(this.context);
    if (this.after) {
      const delay =
        typeof this.after.delay === 'function'
          ? this.after.delay(this.context)
          : this.after.delay;
      this.timer = setTimeout(() => {
        const target = this.after!.target();
        machine.transitionTo(target);
      }, delay);
    }
  }

  // Internal method to handle exiting the state
  private exitState(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}

// StateMachine class implementing StateResult<E, C>
class StateMachine<E extends string, C> implements StateResult<E, C> {
  private currentState: InternalState<E, C>;
  private context: C;
  private states: Record<string, InternalState<E, C>>;

  setState!: (state: StateResult<E, C>) => void;
  value!: StateResult<E, C>;

  // Implement StateResult<E, C>
  send(event: E): void {
    this.currentState.send(event);
  }

  constructor(definition: StateDefinition<E, C>) {
    this.context = definition.context;
    this.states = {} as Record<string, InternalState<E, C>>;

    if (definition.states) {
      // Initialize all states
      for (const key in definition.states) {
        const state = definition.states[key];
        if (!(state instanceof State)) {
          throw new Error(`State "${key}" must be created using createState.`);
        }
        this.states[key] = state as InternalState<E, C>;
      }

      if (!definition.initial) {
        throw new Error(
          "Initial state must be defined when 'states' are provided."
        );
      }

      // Ensure the initial state is one of the defined states
      const initialState = Object.values(this.states).find(
        (state) => state === definition.initial
      );

      if (!initialState) {
        throw new Error('Initial state must be one of the defined states.');
      }

      this.currentState = initialState;
    } else {
      if (!(definition.initial instanceof State)) {
        throw new Error('Initial state must be a valid State.');
      }
      this.currentState = definition.initial as InternalState<E, C>;
    }

    // Bind methods
    this.setState = (state: StateResult<E, C>) => this.transitionTo(state);
    this.value = this.currentState;

    // Enter the initial state
    this.currentState._enterState(this);
  }

  transitionTo(state: StateResult<E, C>): void {
    const targetState = state as InternalState<E, C>;
    if (this.currentState === targetState) return;
    this.currentState._exitState();
    this.currentState = targetState;
    this.value = this.currentState;
    this.currentState._enterState(this);
  }
}

// createState now correctly constrains E to extend string
export function createState<E extends string = string, C = any>(
  definition: StateDefinition<E, C>
): StateResult<E, C> {
  if (definition.states) {
    return new StateMachine<E, C>(definition);
  } else {
    return new State<E, C>(definition);
  }
}
