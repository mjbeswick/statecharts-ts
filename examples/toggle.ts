import { createMachine } from '../src/createMachine';

const machine = createMachine({
  events: { type: 'TOGGLE' },
  context: {},
  initial: 'a',
  states: {
    a: {
      on: {
        TOGGLE: () => 'b',
      },
    },
    b: {
      on: {
        TOGGLE: () => 'a',
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('Current state:', state);
});

machine.start();

machine.dispatch({ type: 'TOGGLE' });
machine.dispatch({ type: 'TOGGLE' });
