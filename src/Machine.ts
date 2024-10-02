export type Transition<TContext, TEvent> = {
  target: string | string[];
  action?: (context: TContext, event: TEvent) => void;
};

export type StateDefinition<TEvent extends { type: string }, TContext> = {
  transitions?: Record<string, Transition<TContext, TEvent>>;
  enter?: (context: TContext, send: (event: TEvent) => void) => void;
  after?: Record<number, Transition<TContext, TEvent>>;
  states?: Record<string, StateDefinition<TEvent, TContext>>;
  parallel?: boolean;
  initial?: string;
};

export class Machine<TEvent extends { type: string }, TContext> {
  private stateDefinition: StateDefinition<TEvent, TContext>;
  private context: TContext;
  private currentStates: Set<string>;
  private subscribers: Array<(state: string[]) => void> = [];
  private timers: Map<number, NodeJS.Timeout> = new Map();

  constructor(
    stateDefinition: StateDefinition<TEvent, TContext>,
    context: TContext,
    initialStates: string[]
  ) {
    this.stateDefinition = stateDefinition;
    this.context = context;
    this.currentStates = new Set();
    // Enter initial states
    this.enterStates(initialStates);
  }

  send(event: TEvent): void {
    const nextStates: Set<string> = new Set();
    const exitedStates: Set<string> = new Set();

    // For each current state, check for transitions
    this.currentStates.forEach((state) => {
      const stateDef = this.getStateDefinition(state);
      if (!stateDef) return;

      const transition =
        stateDef.transitions && stateDef.transitions[event.type];
      if (transition) {
        // Run action if any
        if (transition.action) {
          transition.action(this.context, event);
        }

        // Exiting current state
        exitedStates.add(state);

        // Add target states
        const targets = Array.isArray(transition.target)
          ? transition.target
          : [transition.target];
        targets.forEach((targetState) => {
          nextStates.add(targetState);
        });
      } else {
        // No transition, remain in current state
        nextStates.add(state);
      }
    });

    // Update currentStates
    this.currentStates = nextStates;

    // Exit states
    exitedStates.forEach((state) => {
      // Cancel any after timers
      this.cancelTimersForState(state);
    });

    // Enter new states
    this.enterStates(Array.from(nextStates));

    // Notify subscribers
    this.notifySubscribers();
  }

  getState(): string[] {
    return Array.from(this.currentStates);
  }

  getContext(): TContext {
    return this.context;
  }

  onTransition(callback: (state: string[]) => void): void {
    this.subscribers.push(callback);
  }

  offTransition(callback: (state: string[]) => void): void {
    this.subscribers = this.subscribers.filter((cb) => cb !== callback);
  }

  private notifySubscribers(): void {
    const currentStatesArray = Array.from(this.currentStates);
    this.subscribers.forEach((callback) => callback(currentStatesArray));
  }

  private getStateDefinition(
    statePath: string
  ): StateDefinition<TEvent, TContext> | undefined {
    const pathSegments = statePath.split('.');
    let currentStateDef = this.stateDefinition;
    for (const segment of pathSegments) {
      if (currentStateDef.states && currentStateDef.states[segment]) {
        currentStateDef = currentStateDef.states[segment];
      } else {
        return undefined;
      }
    }
    return currentStateDef;
  }

  private enterStates(states: string[]): void {
    states.forEach((statePath) => {
      const stateDef = this.getStateDefinition(statePath);
      if (stateDef) {
        // Add state to currentStates
        this.currentStates.add(statePath);

        // Run enter function if any
        if (stateDef.enter) {
          stateDef.enter(this.context, this.send.bind(this));
        }

        // Handle after (delayed transitions)
        if (stateDef.after) {
          for (const delay in stateDef.after) {
            const ms = parseInt(delay, 10);
            const transition = stateDef.after[ms];
            const timerId = setTimeout(() => {
              // Run action if any
              if (transition.action) {
                transition.action(this.context, { type: 'after' } as TEvent);
              }
              // Add target states
              const targets = Array.isArray(transition.target)
                ? transition.target
                : [transition.target];
              targets.forEach((targetState) => {
                this.currentStates.add(targetState);
              });
              this.notifySubscribers();
            }, ms);
            // Store timer to cancel if needed
            this.timers.set(timerId as unknown as number, timerId);
          }
        }

        // If parallel, enter all child states
        if (stateDef.parallel && stateDef.states) {
          const subStateNames = Object.keys(stateDef.states);
          const subStatePaths = subStateNames.map(
            (name) => `${statePath}.${name}`
          );
          this.enterStates(subStatePaths);
        } else if (stateDef.states && stateDef.initial) {
          // Enter initial substate
          const initialSubStatePath = `${statePath}.${stateDef.initial}`;
          this.enterStates([initialSubStatePath]);
        }
      }
    });
  }

  private cancelTimersForState(state: string): void {
    // Since we didn't store timers per state, we may need to adjust the implementation
    // For now, we can cancel all timers
    this.timers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.timers.clear();
  }
}
