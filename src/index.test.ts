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
  let trafficLight: UnifiedState<typeof lightContext>;
  let lightContext: {
    beforeGoPeriod: number;
    beforeStopPeriod: number;
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
    // Reset lightContext to initial state before each test
    lightContext = {
      beforeGoPeriod: 3_000,
      beforeStopPeriod: 10_000,
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
        target: () => beforeGo,
      },
    });

    const beforeGo = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = false;
        context.trafficAmber = true;
        context.trafficGreen = false;
        context.pedestrianRed = true;
        context.pedestrianGreen = false;
      },
      after: {
        delay: (context) => context.beforeGoPeriod,
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
          target: () => beforeStop,
        },
      },
    });

    const beforeStop = createState({
      context: lightContext,
      action: (context) => {
        context.trafficRed = false;
        context.trafficAmber = true;
        context.trafficGreen = false;
        context.pedestrianRed = true;
        context.pedestrianGreen = false;
      },
      after: {
        delay: (context) => context.beforeStopPeriod,
        target: () => stopped,
      },
    });

    // Create the state machine with states
    trafficLight = createState({
      context: lightContext,
      states: {
        stopped,
        beforeGo,
        go,
        beforeStop,
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

  test('when stopped, transitions to beforeGo', () => {
    trafficLight.setState(trafficLight.value);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when stopped, transitions to beforeGo', () => {
    trafficLight.setState(trafficLight.value);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when beforeGo, transitions to go', () => {
    trafficLight.setState(trafficLight.value);
    vi.advanceTimersByTime(lightContext.beforeGoPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(true);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when go, transitions to beforeStop', () => {
    trafficLight.setState(trafficLight.value);
    trafficLight.send('STOP');
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when beforeStop, transitions to stopped', () => {
    trafficLight.setState(trafficLight.value);
    vi.advanceTimersByTime(lightContext.beforeStopPeriod);
    expect(trafficLight.value).toBe(trafficLight.value);
    expect(lightContext.trafficRed).toBe(true);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(false);
    expect(lightContext.pedestrianGreen).toBe(true);
  });
});
