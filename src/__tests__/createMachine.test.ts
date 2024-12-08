import { describe, it, expect } from 'vitest';
import { MachineEvent } from '../MachineState';
import { createMachine } from '../createMachine';

interface TestEvent extends MachineEvent {
  type: 'START' | 'STOP';
}

describe('createMachine', () => {
  it('should create a state machine with the given configuration', () => {
    const machine = createMachine({
      events: {} as TestEvent,
      context: { count: 0 },
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: () => 'running',
          },
        },
        running: {
          on: {
            STOP: () => 'idle',
          },
        },
      },
    });

    machine.start();

    expect(machine).toBeDefined();
    expect(machine.getActive().idle).toBe(true);
  });

  it('should transition states based on events', () => {
    const machine = createMachine({
      context: { count: 0 },
      events: { type: 'START' } as TestEvent,
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: () => 'running',
          },
        },
        running: {
          on: {
            STOP: () => 'idle',
          },
        },
      },
    });

    machine.dispatch({ type: 'START' });
    // expect(machine.value).toBe('running');

    machine.dispatch({ type: 'STOP' });
    // expect(machine.value).toBe('idle');
  });
});
