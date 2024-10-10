import {
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
  expect,
} from 'vitest';
import { createState, type StateResult } from './index';

describe('traffic light state machine', () => {
  let trafficLight: StateResult<string, typeof lightContext>;
  let stopped: StateResult<string, typeof lightContext>;
  let beforeGo: StateResult<string, typeof lightContext>;
  let go: StateResult<string, typeof lightContext>;
  let beforeStop: StateResult<string, typeof lightContext>;

  let lightContext = {
    beforeGoPeriod: 3_000,
    beforeStopPeriod: 10_000,
    stopPeriod: 10_000,
    trafficRed: true,
    trafficAmber: false,
    trafficGreen: false,
    pedestrianRed: false,
    pedestrianGreen: true,
  };

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    stopped = createState<string, typeof lightContext>({
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

    beforeGo = createState<string, typeof lightContext>({
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

    go = createState<string, typeof lightContext>({
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

    beforeStop = createState<string, typeof lightContext>({
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

    trafficLight = createState<string, typeof lightContext>({
      initial: stopped,
      context: lightContext,
      states: {
        stopped,
        beforeGo,
        go,
        beforeStop,
      },
    });
  });

  test('starts in stopped state', () => {
    expect(trafficLight.value).toBe(stopped);
    expect(lightContext.trafficRed).toBe(true);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(false);
    expect(lightContext.pedestrianGreen).toBe(true);
  });

  test('when stopped, transitions to beforeGo', () => {
    trafficLight.setState?.(stopped);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(beforeGo);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when beforeGo, transitions to go', () => {
    trafficLight.setState?.(beforeGo);
    vi.advanceTimersByTime(lightContext.beforeGoPeriod);
    expect(trafficLight.value).toBe(go);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(true);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when go, transitions to beforeStop', () => {
    trafficLight.setState?.(go);
    go.send('STOP');
    expect(trafficLight.value).toBe(beforeStop);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when beforeStop, transitions to stopped', () => {
    trafficLight.setState?.(beforeStop);
    vi.advanceTimersByTime(lightContext.beforeStopPeriod);
    expect(trafficLight.value).toBe(stopped);
    expect(lightContext.trafficRed).toBe(true);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(false);
    expect(lightContext.pedestrianGreen).toBe(true);
  });

  test('when stopped, transitions to beforeGo', () => {
    trafficLight.setState?.(stopped);
    vi.advanceTimersByTime(lightContext.stopPeriod);
    expect(trafficLight.value).toBe(beforeGo);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(true);
    expect(lightContext.trafficGreen).toBe(false);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });

  test('when beforeGo, transitions to go', () => {
    trafficLight.setState?.(beforeGo);
    vi.advanceTimersByTime(lightContext.beforeGoPeriod);
    expect(trafficLight.value).toBe(go);
    expect(lightContext.trafficRed).toBe(false);
    expect(lightContext.trafficAmber).toBe(false);
    expect(lightContext.trafficGreen).toBe(true);
    expect(lightContext.pedestrianRed).toBe(true);
    expect(lightContext.pedestrianGreen).toBe(false);
  });
});
