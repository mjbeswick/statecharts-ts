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
