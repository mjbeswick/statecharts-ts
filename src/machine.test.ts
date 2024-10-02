import { Machine } from './Machine';
import type { StateDefinition } from './types';

describe('Machine Class', () => {
  type TestEvent =
    | { type: 'START' }
    | { type: 'STOP' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'FINISH' };

  interface TestContext {
    count: number;
  }

  type TestState = 'idle' | 'running' | 'paused' | 'finished';

  const testStates: Record<
    string,
    StateDefinition<TestState, TestEvent, TestContext>
  > = {
    idle: {
      transitions: {
        START: { target: 'running' },
      },
      enter: (context, send) => {
        context.count = 0;
      },
    },
    running: {
      transitions: {
        PAUSE: { target: 'paused' },
        STOP: { target: 'idle' },
        FINISH: { target: 'finished' },
      },
      enter: (context, send) => {
        context.count += 1;
      },
    },
    paused: {
      transitions: {
        RESUME: { target: 'running' },
        STOP: { target: 'idle' },
      },
    },
    finished: {
      enter: (context, send) => {
        // Final state, no transitions out
      },
    },
  };

  let machine: Machine<TestState, TestEvent, TestContext>;

  beforeEach(() => {
    machine = new Machine<TestState, TestEvent, TestContext>(
      'idle',
      { count: 0 },
      testStates
    );
  });

  test('Initial state should be idle', () => {
    expect(machine.getState()).toEqual(['idle']);
    expect(machine.getContext().count).toBe(0);
  });

  test('Should transition from idle to running on START', () => {
    machine.send({ type: 'START' });
    expect(machine.getState()).toEqual(['running']);
    expect(machine.getContext().count).toBe(1);
  });

  test('Should transition from running to paused on PAUSE', () => {
    machine.send({ type: 'START' });
    machine.send({ type: 'PAUSE' });
    expect(machine.getState()).toEqual(['paused']);
    expect(machine.getContext().count).toBe(1);
  });

  test('Should resume from paused to running on RESUME', () => {
    machine.send({ type: 'START' });
    machine.send({ type: 'PAUSE' });
    machine.send({ type: 'RESUME' });
    expect(machine.getState()).toEqual(['running']);
    expect(machine.getContext().count).toBe(2);
  });

  test('Should stop from running to idle on STOP', () => {
    machine.send({ type: 'START' });
    machine.send({ type: 'STOP' });
    expect(machine.getState()).toEqual(['idle']);
    expect(machine.getContext().count).toBe(1);
  });

  test('Should not transition on invalid event', () => {
    machine.send({ type: 'PAUSE' });
    expect(machine.getState()).toEqual(['idle']);
    machine.send({ type: 'RESUME' });
    expect(machine.getState()).toEqual(['idle']);
  });

  test('Should handle finish event and reach finished state', () => {
    machine.send({ type: 'START' });
    machine.send({ type: 'FINISH' });
    expect(machine.getState()).toEqual(['finished']);
    expect(machine.getContext().count).toBe(1);
  });

  test('Should not transition out of finished state', () => {
    machine.send({ type: 'START' });
    machine.send({ type: 'FINISH' });
    machine.send({ type: 'START' });
    expect(machine.getState()).toEqual(['finished']);
  });

  test('Should execute enter actions', () => {
    const enterActionMock = jest.fn();
    const testStatesWithMock: Record<
      string,
      StateDefinition<TestState, TestEvent, TestContext>
    > = {
      idle: {
        transitions: {
          START: { target: 'running' },
        },
        enter: enterActionMock,
      },
    };

    machine = new Machine<TestState, TestEvent, TestContext>(
      'idle',
      { count: 0 },
      testStatesWithMock
    );

    expect(enterActionMock).toHaveBeenCalledTimes(1);
  });

  test('Should respect guards in transitions', () => {
    const guardedStates: Record<
      string,
      StateDefinition<TestState, TestEvent, TestContext>
    > = {
      idle: {
        transitions: {
          START: {
            target: 'running',
            guard: (context, event) => context.count === 0,
          },
        },
      },
      running: {
        transitions: {},
      },
    };

    machine = new Machine<TestState, TestEvent, TestContext>(
      'idle',
      { count: 1 },
      guardedStates
    );

    machine.send({ type: 'START' });
    expect(machine.getState()).toEqual(['idle']);
  });

  test('Should handle nested states', () => {
    type NestedState = 'off' | 'on';
    type NestedEvent = { type: 'TOGGLE' };

    const nestedStates: Record<
      string,
      StateDefinition<NestedState, NestedEvent, TestContext>
    > = {
      off: {
        transitions: {
          TOGGLE: { target: 'on' },
        },
      },
      on: {
        transitions: {
          TOGGLE: { target: 'off' },
        },
        states: {
          bright: {
            enter: (context, send) => {
              // Do something
            },
          },
          dim: {
            enter: (context, send) => {
              // Do something
            },
          },
        },
      },
    };

    const nestedMachine = new Machine<NestedState, NestedEvent, TestContext>(
      'off',
      {
        count: 0,
      },
      nestedStates
    );

    nestedMachine.send({ type: 'TOGGLE' });
    expect(nestedMachine.getState()).toContain('on');
    nestedMachine.send({ type: 'TOGGLE' });
    expect(nestedMachine.getState()).toContain('off');
  });

  test('Should handle parallel states', () => {
    type ParallelState = 'root';
    type ParallelEvent = { type: 'EVENT1' } | { type: 'EVENT2' };

    const parallelStates: Record<
      string,
      StateDefinition<ParallelState, ParallelEvent, TestContext>
    > = {
      root: {
        parallel: true,
        states: {
          first: {
            states: {
              stateA: {},
              stateB: {},
            },
          },
          second: {
            states: {
              stateX: {},
              stateY: {},
            },
          },
        },
      },
    };

    const parallelMachine = new Machine<
      ParallelState,
      ParallelEvent,
      TestContext
    >(
      'root',
      {
        count: 0,
      },
      parallelStates
    );

    expect(parallelMachine.getState()).toEqual([
      'root.first.stateA',
      'root.second.stateX',
    ]);
  });
});
