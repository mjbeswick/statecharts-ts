// Utility type to extract valid state names for autocompletion
type StateNames<States> = keyof States & string;

// Event configuration with a target limited to valid state names
type EventConfig<States, Data = any> = {
  target: StateNames<States>; // Target must be one of the available state names
  data?: Data; // Optional data for the event
  guard?: (data?: Data) => boolean; // Optional guard function
};

// Define StateConfig using a type alias
type StateConfig<
  States extends Record<string, StateConfig<any>> = {},
  Data = any
> = {
  parallel?: boolean;
  on?: {
    [eventName: string]: EventConfig<States, Data>;
  };
  enter?: (data?: Data) => void; // Optional enter function to be executed when the state is entered
  states?: States;
};

// Create a type that maps over the `states` config and recursively creates `StateResult`
type StateResult<
  States extends Record<string, StateConfig<any>> = {},
  Data = any
> = {
  states: {
    [K in keyof States]: StateResult<States[K]['states'], Data>;
  };
  send: (eventName: string, data?: Data) => void;
  parent?: StateResult<any>; // Optional parent reference to handle sibling transitions
};

// Factory function to create state objects, returning states and send function
const createState = <
  States extends Record<string, StateConfig<any>>,
  Data = any
>(
  config: StateConfig<States, Data>,
  parent?: StateResult<any, Data> // Parent reference added
): StateResult<States, Data> => {
  const states = {} as {
    [K in keyof States]: StateResult<States[K]['states'], Data>;
  };

  // Recursively create child states if they exist
  if (config.states) {
    for (const stateName in config.states) {
      states[stateName] = createState(config.states[stateName], {
        states,
      } as StateResult<any, Data>);
    }
  }

  // Helper function to handle entering a state
  const enterState = (state: StateResult<any, Data>, data?: Data) => {
    if (config.enter) {
      config.enter(data); // Pass the data to the enter function if defined
    }
  };

  // Send function to handle events and allow transitions to sibling/parent states
  const send = (eventName: string, data?: Data) => {
    if (config.on && config.on[eventName]) {
      const event = config.on[eventName];
      console.log(`Event "${eventName}" received with data:`, data);

      // Check if there's a guard and if it passes
      if (event.guard && !event.guard(data)) {
        console.log(
          `Guard condition failed for event "${eventName}". Transition aborted.`
        );
        return;
      }

      // Try to transition within the current state's children
      if (states[event.target]) {
        console.log(`Transitioned to state: ${event.target}`);
        enterState(states[event.target], data); // Execute the enter function for the target state
      }
      // If the target state isn't in the current subtree, try the parent
      else if (parent && parent.states[event.target]) {
        console.log(`Transitioned to parent sibling state: ${event.target}`);
        enterState(parent.states[event.target], data); // Execute the enter function for the parent sibling state
      } else {
        console.log(`No valid state found for event: ${eventName}`);
      }
    } else {
      console.log(`Event "${eventName}" not recognized.`);
    }
  };

  return { states, send, parent };
};

// Example usage with autocompletion for the target states in the event configuration
const statechartConfig = {
  parallel: false,
  states: {
    stateA: {
      enter: (data: { count?: number }) =>
        console.log('Entered state A with data:', data),
      on: {
        EVENT_A1: {
          target: 'nestedA1', // Autocompletion for 'nestedA1' and 'nestedA2' will work here
          guard: (data: { count?: number }) => data?.count! > 5, // Only transition if count > 5
        },
        EVENT_A2: {
          target: 'nestedA2', // Autocompletion for 'nestedA2' will work here
        },
      },
      states: {
        nestedA1: {
          enter: (data: { count?: number }) =>
            console.log('Entered nestedA1 with data:', data),
          on: {
            EVENT_A1_NESTED: { target: 'completed' },
          },
        },
        nestedA2: {
          enter: (data: { count?: number }) =>
            console.log('Entered nestedA2 with data:', data),
        },
      },
    },
    stateB: {
      enter: (data: { value?: number }) =>
        console.log('Entered state B with data:', data),
      on: {
        EVENT_B1: {
          target: 'nestedB1', // Autocompletion for 'nestedB1' and 'nestedB2' will work here
          guard: (data: { value?: number }) => data?.value === 42, // Transition only if value is exactly 42
        },
      },
      parallel: true,
      states: {
        nestedB1: {
          enter: (data: { value?: number }) =>
            console.log('Entered nestedB1 with data:', data),
          on: {
            EVENT_B1_NESTED: { target: 'completed' },
          },
        },
        nestedB2: {
          enter: (data: { value?: number }) =>
            console.log('Entered nestedB2 with data:', data),
        },
      },
    },
  },
} as const; // "as const" ensures the type inference is exact and readonly

// Create the root state object with proper typing
const rootState = createState(statechartConfig);

// Example transitions with enter functions and guard conditions
rootState.states.stateA.send('EVENT_A1', { count: 4 }); // Guard should fail, no transition
rootState.states.stateA.send('EVENT_A1', { count: 6 }); // Guard should pass, transition to nestedA1, enter function should run
rootState.states.stateA.send('EVENT_A2'); // Transition to nestedA2, enter function should run
rootState.states.stateB.send('EVENT_B1', { value: 42 }); // Guard should pass, transition to nestedB1, enter function should run

// Print rootState excluding functions and cyclic references using JSON.stringify
const seen = new WeakSet(); // To keep track of seen objects and avoid circular references
const removeFunctionsAndCyclic = (key: string, value: any) => {
  // Skip function values
  if (typeof value === 'function') {
    return undefined;
  }

  // Skip circular references
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return undefined; // Circular reference found, skip it
    }
    seen.add(value);
  }

  return value;
};

// Use JSON.stringify with the custom replacer function
console.log(JSON.stringify(rootState, removeFunctionsAndCyclic, 2));
