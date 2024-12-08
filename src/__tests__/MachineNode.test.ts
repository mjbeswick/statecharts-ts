import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MachineState, type MachineEvent } from '../MachineState';

interface TestContext {
  count: number;
}

type TestEvent = MachineEvent<{ value?: number }>;

describe('MachineNode', () => {
  let rootState: MachineState<TestEvent, TestContext>;

  beforeEach(() => {
    rootState = new MachineState({
      id: 'root',
      context: { count: 0 },
    });
  });

  describe('initialization', () => {
    it('creates a state node with correct initial values', () => {
      expect(rootState.id).toBe('root');
      expect(rootState.context).toEqual({ count: 0 });
      expect(rootState.isActive).toBe(false);
    });
  });

  describe('lifecycle hooks', () => {
    it('accepts and stores onEnter and onExit hooks', () => {
      const onEnter = vi.fn();
      const onExit = vi.fn();
      const onFinal = vi.fn();

      const rootState = new MachineState({
        id: 'root',
        onEnter,
        onExit,
        onFinal,
      });

      expect(rootState.onEnter).toBe(onEnter);
      expect(rootState.onExit).toBe(onExit);
      expect(rootState.onFinal).toBe(onFinal);
    });
  });

  describe('child state management', () => {
    it('adds child states to parent', () => {
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });
      const result = rootState.addChildState(childState);

      expect(result).toBe(rootState);
      expect(rootState.children).toContain(childState);
    });

    it('marks child state as initial state', () => {
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });
      const result = rootState.addChildState(childState, true);

      expect(result).toBe(rootState);
      expect(rootState.initialChildId).toBe(childState.id);
    });

    it('when the parent state is active, a child state is added, it is marked as active', async () => {
      const rootState = new MachineState<TestEvent, TestContext>({
        id: 'root',
      });
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });

      await rootState.enter();
      expect(rootState.isActive).toBe(true);

      rootState.addChildState(childState);
      expect(childState.isActive).toBe(true);
    });
  });

  describe('child state removal', () => {
    it('removes child state from parent', () => {
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });
      rootState.addChildState(childState);
      rootState.removeChildState(childState);

      expect(rootState.children).not.toContain(childState);
    });

    it('clears initial state when removed', () => {
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });
      rootState.addChildState(childState, true);
      rootState.removeChildState(childState);

      expect(rootState.initialChildId).toBeUndefined();
    });

    it('when a child state is removed, it is marked as inactive', async () => {
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
      });
      rootState.addChildState(childState, true);
      await rootState.enter();

      const exitSpy = vi.spyOn(childState, 'exit');

      rootState.removeChildState(childState);

      expect(exitSpy).toHaveBeenCalled();
    });
  });

  describe('child state creation', () => {
    it('creates and appends new child state', () => {
      const result = rootState.appendChild({ id: 'child' });

      expect(rootState.children).toContain(result);
    });

    it('marks newly created child as initial state', () => {
      const result = rootState.appendChild({ id: 'child', initial: true });

      expect(rootState.initialChildId).toBe(result.id);
    });
  });

  describe('context management', () => {
    describe('setting context', () => {
      it('sets context value directly', () => {
        rootState.setContext('count', 1);

        expect(rootState.context).toEqual({ count: 1 });
      });

      it('updates existing context value', () => {
        rootState.setContext('count', 1);
        rootState.setContext('count', 2);

        expect(rootState.context).toEqual({ count: 2 });
      });

      it('propagates context changes to child states', () => {
        const childState = new MachineState<TestEvent, TestContext>({
          id: 'child',
        });
        rootState.addChildState(childState);
        rootState.setContext('count', 1);

        expect(childState.context).toEqual({ count: 1 });
      });

      it('throws when context is not found', () => {
        const orphanState = new MachineState<TestEvent, TestContext>({
          id: 'orphan',
        });

        expect(() => orphanState.setContext('count', 1)).toThrow();
      });
    });

    describe('updating context', () => {
      beforeEach(() => {
        rootState.setContext('count', 0);
      });

      it('updates context through transformation function', () => {
        rootState.updateContext((ctx) => ({ count: ctx.count + 1 }));

        expect(rootState.context).toEqual({ count: 1 });
      });

      it('can chain multiple updates', () => {
        rootState.updateContext((ctx) => ({ count: ctx.count + 1 }));
        rootState.updateContext((ctx) => ({ count: ctx.count * 2 }));

        expect(rootState.context).toEqual({ count: 2 });
      });

      it('propagates context changes to child states', () => {
        const childState = new MachineState<TestEvent, TestContext>({
          id: 'child',
        });
        rootState.addChildState(childState);
        rootState.updateContext((ctx) => ({ count: ctx.count + 1 }));

        expect(childState.context).toEqual({ count: 1 });
      });

      it('throws when context is not found', () => {
        const orphanState = new MachineState<TestEvent, TestContext>({
          id: 'orphan',
        });

        expect(() =>
          orphanState.updateContext((ctx) => ({ count: ctx.count + 1 })),
        ).toThrow('Context not found');
      });

      it('updates partial context while preserving other values', () => {
        const rootState = new MachineState({
          id: 'root',
          context: { count: 0, value: 1 },
        });

        // Update only count, leaving value unchanged
        rootState.updateContext((ctx) => ({ count: ctx.count + 1 }));

        expect(rootState.context).toEqual({ count: 1, value: 1 });

        // Verify value can still be updated separately
        rootState.updateContext((ctx) => ({ value: ctx.value + 1 }));

        expect(rootState.context).toEqual({ count: 1, value: 2 });
      });

      it('throws when transformation returns invalid context', () => {
        expect(() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rootState.updateContext((ctx) => ctx.count as any),
        ).toThrow();
      });
    });
  });

  describe('event handling', () => {
    it('dispatches events to handlers when active', () => {
      const handler = vi.fn();
      const rootState = new MachineState({
        events: {} as TestEvent,
        id: 'root',
        on: {
          TEST: handler,
        },
      });
      rootState.enter();
      rootState.dispatch({ type: 'TEST', data: { value: 42 } });

      expect(handler).toHaveBeenCalled();
    });

    it('does not dispatch events to handlers when inactive', () => {
      const handler = vi.fn();
      const rootState = new MachineState<TestEvent, TestContext>({
        id: 'root',
        on: {
          TEST: handler,
        },
      });
      rootState.dispatch({ type: 'TEST', data: { value: 42 } });

      expect(handler).not.toHaveBeenCalled();
    });

    it('propagates events to child states', () => {
      const eventHandler = vi.fn();
      const childState = new MachineState<TestEvent, TestContext>({
        id: 'child',
        on: {
          TEST: eventHandler,
        },
      });
      rootState.addChildState(childState);
      rootState.enter();
      rootState.dispatch({ type: 'TEST', data: { value: 42 } });

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    describe('transitions initial child state on parent enter', () => {
      let rootState: MachineState<TestEvent, TestContext>;
      let childState1: MachineState<TestEvent, TestContext>;
      let childState2: MachineState<TestEvent, TestContext>;

      beforeEach(() => {
        rootState = new MachineState<TestEvent, TestContext>({
          id: 'root',
        });

        childState1 = new MachineState<TestEvent, TestContext>({
          id: 'child1',
          onEnter: vi.fn(),
          onExit: vi.fn(),
        });

        childState2 = new MachineState<TestEvent, TestContext>({
          id: 'child2',
          onEnter: vi.fn(),
          onExit: vi.fn(),
        });
      });

      it('when initial state is not set', () => {
        rootState.addChildState(childState1);
        rootState.addChildState(childState2);
        rootState.enter();

        expect(childState1.isActive).toBe(true);
        expect(childState2.isActive).toBe(true);
      });

      it('when initial state is set', () => {
        rootState.addChildState(childState1);
        rootState.addChildState(childState2, true);
        rootState.enter();

        expect(childState1.isActive).toBe(false);
        expect(childState2.isActive).toBe(true);
      });

      it('transition to stateId', async () => {
        rootState.addChildState(childState1);
        rootState.addChildState(childState2);
        await rootState.enter();
        await childState1.transition('child2');

        expect(rootState.isActive).toBe(true);
        expect(childState1.isActive).toBe(false);
        expect(childState2.isActive).toBe(true);
      });

      it('when transitioning to self', async () => {
        rootState.addChildState(childState1);
        await rootState.enter();
        await childState1.transition('child1');

        expect(rootState.isActive).toBe(true);
        expect(childState1.isActive).toBe(true);
      });
    });

    it('processes events and triggers transitions', () => {
      const handler = vi.fn().mockReturnValue('target');
      const transition = vi.spyOn(rootState, 'transition');

      rootState.setTransitionAction('TEST', handler);
      rootState.enter();

      rootState.dispatch({ type: 'TEST', data: { value: 42 } });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: { type: 'TEST', data: { value: 42 } },
          context: { count: 0 },
        }),
      );
      expect(transition).toHaveBeenCalledWith('target');
    });

    it('calls onFinal when state is final', () => {
      const onFinal = vi.fn();

      const rootState = new MachineState<TestEvent, TestContext>({
        id: 'root',
        onFinal,
      });

      rootState.appendChild({
        id: 'child1',
        initial: true,
        final: true,
      });

      rootState.enter();

      expect(onFinal).toHaveBeenCalled();
    });

    describe('parallel states', () => {
      let rootState: MachineState<TestEvent, TestContext>;
      let child1: MachineState<TestEvent, TestContext>;
      let child2: MachineState<TestEvent, TestContext>;

      beforeEach(() => {
        rootState = new MachineState({
          id: 'root',
        });

        child1 = new MachineState({
          id: 'child1',
          onEnter: vi.fn(),
          onExit: vi.fn(),
        });

        child2 = new MachineState({
          id: 'child2',
          onEnter: vi.fn(),
          onExit: vi.fn(),
        });

        rootState.addChildState(child1);
        rootState.addChildState(child2);
      });

      it('activates all child states on enter', async () => {
        await rootState.enter();

        expect(child1.isActive).toBe(true);
        expect(child2.isActive).toBe(true);
      });

      it('deactivates all child states on exit', async () => {
        await rootState.enter();
        await rootState.exit();

        expect(child1.isActive).toBe(false);
        expect(child2.isActive).toBe(false);
      });
    });
  });

  describe('delayed transitions', () => {
    it('executes transitions after specified delay', async () => {
      vi.useFakeTimers();

      const callback = vi.fn().mockReturnValue('next');
      const transition = vi.spyOn(rootState, 'transition');

      rootState.after(1000, callback);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalled();
      expect(transition).toHaveBeenCalledWith('next');

      vi.useRealTimers();
    });

    it('transitions to sibling after delay', async () => {
      vi.useFakeTimers();

      const child1 = rootState.appendChild({
        id: 'child1',
        onEnter: ({ after }) => {
          after(1000, () => 'child2');
        },
      });
      const child2 = rootState.appendChild({ id: 'child2' });

      vi.advanceTimersByTime(1000);
      rootState.enter();

      await vi.runAllTimersAsync();

      expect(child1.isActive).toBe(false);
      expect(child2.isActive).toBe(true);
    });
  });

  describe('cleanup operations', () => {
    it('removes timers and event handlers', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      rootState.after(1000, vi.fn());

      rootState.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('throws when adding duplicate child state IDs', () => {
      const child1 = new MachineState<TestEvent, TestContext>({
        id: 'duplicate',
      });
      const child2 = new MachineState<TestEvent, TestContext>({
        id: 'duplicate',
      });

      rootState.addChildState(child1);

      expect(() => rootState.addChildState(child2)).toThrow();
    });

    it('throws when transitioning to non-existent state', () => {
      const child2 = rootState
        .appendChild({ id: 'child' })
        .appendChild({ id: 'child2' });

      expect(async () => child2.transition('nonexistent')).rejects.toThrow();
    });
  });
});
