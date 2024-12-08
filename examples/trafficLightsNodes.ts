import { MachineNode } from '../src/MachineNode';

const machine = new MachineNode({
  events: { type: 'STOP' } as const,
  id: 'machine',
  context: {
    waiting: false as boolean,
    timeouts: {
      stop: 3_000,
      readyGo: 3_000,
      go: 3_000,
      readyStop: 3_000,
    },
  },
  on: {
    STOP: ({ context, updateContext }) => {
      if (!context.waiting) {
        updateContext((c) => ({ ...c, waiting: true }));
      }
    },
  },
});

machine.appendChild({
  id: 'stop',
  onEntry: ({ after, context }) => {
    after(context.timeouts.stop, () => 'readyGo');
  },
});

machine.appendChild({
  id: 'readyGo',
  initial: true,
  onEntry: ({ after, context }) => {
    after(context.timeouts.readyGo, () => 'go');
  },
});

machine.appendChild({
  id: 'go',
  onEntry: ({ after, context }) => {
    after(context.timeouts.go, () => 'readyStop');
  },
});

machine.appendChild({
  id: 'readyStop',
  onEntry: ({ after, context }) => {
    after(context.timeouts.readyStop, () => 'stop');
  },
});

machine.onTransition = (state) => {
  console.log('State:', state);
};

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.exit();
    process.exit(0);
  }

  // space key
  if (key.toString() === ' ') {
    machine.dispatch({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, ctrl+C to exit\n');

machine.enter();
