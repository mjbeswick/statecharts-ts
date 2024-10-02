// machine.ts

type Guard<TContext, TEvent> = (context: TContext, event: TEvent) => boolean | Promise<boolean>;

type Transition<TContext, TEvent> = {
  target: string | string[];
  action?: (context: TContext, event: TEvent) => void | Promise<void>;
  cond?: Guard<TContext, TEvent>;
};

type AfterTransition<TContext, TEvent> = {
  delay: number | ((context: TContext, event?: TEvent) => number);
  transition: Transition<TContext, TEvent>;
};

export type StateDefinition<TEvent extends { type: string }, TContext> = {
  transitions?: Record<string, Transition<TContext, TEvent>>;
  onEntry?: (context: TContext, event?: TEvent) => void | Promise<void>;
  onExit?: (context: TContext, event?: TEvent) => void | Promise<void>;
  after?: AfterTransition<TContext, TEvent>[];
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

  async send(event: TEvent): Promise<void> {
    const nextStates: Set<string> = new Set();
    const exitedStates: Set<string> = new Set();
    const transitionsToExecute: Array<{
      transition: Transition<TContext, TEvent>;
      state: string;
    }> = [];

    for (const state of this.currentStates) {
      const stateDef = this.getStateDefinition(state);
      if (!stateDef) continue;

      const transition = stateDef.transitions && stateDef.transitions[event.type];
      if (transition) {
        // Evaluate guard condition if present
        let canTransition = true;
        if (transition.cond) {
          canTransition = await transition.cond(this.context, event);
        }
        if (canTransition) {
          transitionsToExecute.push({ transition, state });
        } else {
          nextStates.add(state);
        }
      } else {
        nextStates.add(state);
      }
    }

    // Execute transitions
    for (const { transition, state } of transitionsToExecute) {
      // Exit current state
      exitedStates.add(state);

      // Run exit action
      await this.executeStateExit(state, event);

      // Run transition action if any
      if (transition.action) {
        try {
          await transition.action(this.context, event);
        } catch (error) {
          await this.handleError(error, state, event);
          return;
        }
      }

      // Add target states
      const targets = Array.isArray(transition.target)
        ? transition.target
        : [transition.target];
      targets.forEach((targetState) => {
        nextStates.add(targetState);
      });
    }

    // Update currentStates
    this.currentStates = nextStates;

    // Exit states
    for (const state of exitedStates) {
      this.cancelTimersForState(state);
    }

    // Enter new states
    await this.enterStates(Array.from(nextStates), event);

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

  /**
   * Serializes the current state(s) and context of the machine.
   */
  serialize(): string {
    const data = {
      currentStates: Array.from(this.currentStates),
      context: this.context,
    };
    return JSON.stringify(data);
  }

  /**
   * Parses the serialized data and restores the machine's state(s) and context.
   * Note: The stateDefinition must be the same as when the machine was serialized.
   */
  static parse<TEvent extends { type: string }, TContext>(
    serializedData: string,
    stateDefinition: StateDefinition<TEvent, TContext>
  ): Machine<TEvent, TContext> {
    const data = JSON.parse(serializedData);
    const machine = new Machine<TEvent, TContext>(
      stateDefinition,
      data.context,
      data.currentStates
    );
    return machine;
  }

  private notifySubscribers(): void {
    const currentStatesArray = Array.from(this.currentStates);
    this.subscribers.forEach((callback) => callback(currentStatesArray));
  }

  private getStateDefinition(statePath: string): StateDefinition<TEvent, TContext> | undefined {
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

  private async enterStates(states: string[], event?: TEvent): Promise<void> {
    for (const statePath of states) {
      const stateDef = this.getStateDefinition(statePath);
      if (stateDef) {
        // Add state to currentStates
        this.currentStates.add(statePath);

        // Run onEntry action if any
        if (stateDef.onEntry) {
          try {
            await stateDef.onEntry(this.context, event);
          } catch (error) {
            await this.handleError(error, statePath, event);
            return;
          }
        }

        // Handle after (delayed transitions)
        if (stateDef.after) {
          for (const afterTransition of stateDef.after) {
            const { delay, transition } = afterTransition;
            let delayMs: number;

            if (typeof delay === 'function') {
              delayMs = delay(this.context, event);
            } else {
              delayMs = delay;
            }

            const timerId = setTimeout(async () => {
              // Run action if any
              if (transition.action) {
                try {
                  await transition.action(this.context, { type: 'after' } as TEvent);
                } catch (error) {
                  await this.handleError(error, statePath, event);
                  return;
                }
              }
              // Add target states
              const targets = Array.isArray(transition.target)
                ? transition.target
                : [transition.target];
              this.currentStates = new Set(targets);
              await this.enterStates(targets);
              this.notifySubscribers();
            }, delayMs);
            // Store timer to cancel if needed
            this.timers.set(timerId as unknown as number, timerId);
          }
        }

        // If parallel, enter all child states
        if (stateDef.parallel && stateDef.states) {
          const subStateNames = Object.keys(stateDef.states);
          const subStatePaths = subStateNames.map((name) => `${statePath}.${name}`);
          await this.enterStates(subStatePaths);
        } else if (stateDef.states && stateDef.initial) {
          // Enter initial substate
          const initialSubStatePath = `${statePath}.${stateDef.initial}`;
          await this.enterStates([initialSubStatePath]);
        }
      }
    }
  }

  private async executeStateExit(statePath: string, event?: TEvent): Promise<void> {
    const stateDef = this.getStateDefinition(statePath);
    if (stateDef && stateDef.onExit) {
      try {
        await stateDef.onExit(this.context, event);
      } catch (error) {
        await this.handleError(error, statePath, event);
      }
    }
    // Remove state from currentStates
    this.currentStates.delete(statePath);
  }

  private cancelTimersForState(state: string): void {
    // Since we didn't store timers per state, we can cancel all timers
    this.timers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.timers.clear();
  }

  private async handleError(error: any, state: string, event?: TEvent): Promise<void> {
    console.error(`Error in state "${state}":`, error);
    // Implement error handling strategy, e.g., transition to an error state
    // For now, we just log the error
  }
}
