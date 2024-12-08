import { createMachine } from '../src/createMachine';

const machine = createMachine({
  events: { type: 'STOP' } as const,
  id: 'machine',
  context: {
    waiting: false as boolean,
    timeouts: {
      stop: 3_000,
      go: 3_000,
    },
  },
  on: {
    STOP: ({ setContext }) => {
      setContext('waiting', true);
    },
  },
  initial: 'go',
  states: {
    stop: {
      onEnter: ({ after, context }) => {
        after(context.timeouts.stop, () => 'go');
      },
    },
    go: {
      onEnter: ({ after, context }) => {
        after(context.timeouts.go, () => 'stop');
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('State:', state);
});

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }

  // space key
  if (key.toString() === ' ') {
    machine.dispatch({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, ctrl+C to exit\n');

machine.start();
