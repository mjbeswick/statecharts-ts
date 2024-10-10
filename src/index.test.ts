import {
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
  expect,
} from 'vitest';
import { createState, type UnifiedState } from './index';

describe('nested and parallel state machine', () => {
  let machine: UnifiedState<typeof context>;
  let context: {
    counter: number;
  };

  let stateA: UnifiedState<typeof context>;
  let stateA1: UnifiedState<typeof context>;
  let stateA2: UnifiedState<typeof context>;
  let stateB: UnifiedState<typeof context>;
  let stateB1: UnifiedState<typeof context>;
  let stateB2: UnifiedState<typeof context>;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    context = {
      counter: 0,
    };

    stateA1 = createState({
      context,
      action: (context) => {
        context.counter += 1;
      },
      on: {
        NEXT: {
          target: () => stateA2,
        },
      },
    });

    stateA2 = createState({
      context,
      action: (context) => {
        context.counter += 2;
      },
      on: {
        NEXT: {
          target: () => stateA1,
        },
      },
    });

    stateA = createState({
      context,
      states: {
        stateA1,
        stateA2,
      },
      value: stateA1,
    });

    stateB1 = createState({
      context,
      action: (context) => {
        context.counter += 3;
      },
      on: {
        NEXT: {
          target: () => stateB2,
        },
      },
    });

    stateB2 = createState({
      context,
      action: (context) => {
        context.counter += 4;
      },
      on: {
        NEXT: {
          target: () => stateB1,
        },
      },
    });

    stateB = createState({
      context,
      states: {
        stateB1,
        stateB2,
      },
      value: stateB1,
    });

    machine = createState({
      context,
      parallel: true,
      states: {
        stateA,
        stateB,
      },
      value: stateA,
    });
  });

  test('starts in stateA1', () => {
    expect(machine.value).toBe(stateA1);
    expect(context.counter).toBe(1);
  });

  test('when in stateA1, transitions to stateA2', () => {
    machine.send('NEXT');
    expect(machine.value).toBe(stateA2);
    expect(context.counter).toBe(3);
  });

  test('when in stateA2, transitions to stateA1', () => {
    machine.setState(stateA2);
    machine.send('NEXT');
    expect(machine.value).toBe(stateA1);
    expect(context.counter).toBe(4);
  });

  test('when in stateB1, transitions to stateB2', () => {
    machine.setState(stateB1);
    machine.send('NEXT');
    expect(machine.value).toBe(stateB2);
    expect(context.counter).toBe(7);
  });

  test('when in stateB2, transitions to stateB1', () => {
    machine.setState(stateB2);
    machine.send('NEXT');
    expect(machine.value).toBe(stateB1);
    expect(context.counter).toBe(8);
  });

  test('when in stateA1 and stateB1, transitions to stateA2 and stateB2', () => {
    machine.setState(stateA1);
    machine.send('NEXT');
    machine.setState(stateB1);
    machine.send('NEXT');
    expect(machine.value).toBe(machine.value);
    expect(context.counter).toBe(8);
  });
});

describe('traffic light state machine', () => {
  // UK traffic light sequence
  // 1. Stop - Traffic light red, pedestrian light green
  // 2. Prepare to go - Traffic light amber, pedestrian light red
  // 3. Go - Traffic light green, pedestrian light red
  // 4. Prepare to stop - Traffic light amber, pedestrian light red

  let trafficLight: UnifiedState<typeof lightContext>;
  let lightContext: {
    prepareToGoPeriod: number;
    prepareToStopPeriod: number;
    stopPeriod: number;
    trafficRed: boolean;
    trafficAmber: boolean;
    trafficGreen: boolean;
    pedestrianRed: boolean;
    pedestrianGreen: boolean;
  };

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    lightContext = {
      prepareToGoPeriod: 3_000,
      prepareToStopPeriod: 10_000,
      stopPeriod: 10_000,
      trafficRed: true,
      trafficAmber: false,
      trafficGreen: false,
      pedestrianRed: false,
      pedestrianGreen: true,
    };

    const stopped = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = true;
        context.trafficAmber = false;
        context.trafficGreen = false;
        context.pedestrianRed = false;
        context.pedestrianGreen = true;
      },
      after: {
        delay: (context) => context.stopPeriod,
        target: () => prepareToGo,
      },
    });

    const prepareToGo = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = false;
        context.trafficAmber = true;
        context.trafficGreen = false;
        context.pedestrianRed = true;
        context.pedestrianGreen = false;
      },
      after: {
        delay: (context) => context.prepareToGoPeriod,
        target: () => go,
      },
    });

    const go = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = false;
        context.trafficAmber = false;
        context.trafficGreen = true;
        context.pedestrianRed = true;
        context.pedestrianGreen = false;
      },
      on: {
        STOP: {
          target: () => prepareToStop,
        },
      },
    });

    const prepareToStop = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = false;
        context.trafficAmber = true;
        context.trafficGreen = false;
        context.pedestrianRed = true;
        context.pedestrianGreen = false;
      },
      after: {
        delay: (context) => context.prepareToStopPeriod,
        target: () => stopped,
      },
    });

    // Create the state machine with states
    trafficLight = createState({
      context: lightContext,
      states: {
        stopped,
        prepareToGo,
        go,
        prepareToStop,
      },
      value: stopped, // Initial state
    });
  });

  test('starts in stopped state', () => {
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(true);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(false);
    expect(lightContext.pedestrianGreen).toBe(true);
  });

  test('when stopped, transitions to prepareToGo', () => {
    trafficLight.setState(trafficLight);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when stopped, transitions to prepareToGo', () => {
    trafficLight.setState(trafficLight);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when prepareToGo, transitions to go', () => {
    trafficLight.setState(trafficLight.states!.prepareToGo);
    vi.advanceTimersByTime(lightContext.prepareToGoPeriod);
    expect(trafficLight.value).toBe(trafficLight.states!.go);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(true);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when go, transitions to prepareToStop', () => {
    trafficLight.setState(trafficLight.states!.go);
    trafficLight.send('STOP');
    expect(trafficLight.value).toBe(trafficLight.states!.prepareToStop);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when prepareToStop, transitions to stopped', () => {
    trafficLight.setState(trafficLight.states!.prepareToStop);
    vi.advanceTimersByTime(lightContext.prepareToStopPeriod);
    expect(trafficLight.value).toBe(trafficLight.states!.stopped);
    expect(lightContext.trafficRed).toBe(true);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(false);
    expect(lightContext.pedestrianGreen).toBe(true);
  });
});
