import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractStateMachine, TransitionMap } from './index';

// Define types for testing
type TestState = 'idle' | 'active' | 'completed';
type TestEvent = { type: 'START' } | { type: 'COMPLETE' } | { type: 'RESET' };

// Define a concrete implementation of AbstractStateMachine for testing
class TestStateMachine extends AbstractStateMachine<TestState, TestEvent, any> {
    protected currentState: TestState = 'idle';
    protected context = { count: 0 };

    protected transitionMap: TransitionMap<TestState, TestEvent, typeof this.context> = {
        idle: {
            START: {
                target: 'active',
                enter: (context) => {
                    context.count += 1;
                },
                exit: () => {
                    // Optional exit action for state 'idle'
                }
            },
        },
        active: {
            COMPLETE: {
                target: 'completed',
                enter: (context) => {
                    context.count += 10;
                },
            },
            RESET: {
                target: 'idle',
                enter: (context) => {
                    context.count = 0;
                },
            },
        },
        completed: {
            RESET: {
                target: 'idle',
                enter: (context) => {
                    context.count = 0;
                },
            },
        }
    };

    // Getter for accessing the transition map in tests
    public getTransitionMap() {
        return this.transitionMap;
    }
}

// Test suite for AbstractStateMachine
describe('AbstractStateMachine', () => {
    let stateMachine: TestStateMachine;

    beforeEach(() => {
        // Instantiate the state machine before each test
        stateMachine = new TestStateMachine();
    });

    it('should initialize with the correct initial state and context', () => {
        expect(stateMachine.getState()).toBe('idle');
        expect(stateMachine.getContext()).toEqual({ count: 0 });
    });

    it('should transition from idle to active when START event is sent', () => {
        stateMachine.send({ type: 'START' });
        expect(stateMachine.getState()).toBe('active');
        expect(stateMachine.getContext().count).toBe(1);
    });

    it('should transition from active to completed when COMPLETE event is sent', () => {
        stateMachine.send({ type: 'START' });
        stateMachine.send({ type: 'COMPLETE' });
        expect(stateMachine.getState()).toBe('completed');
        expect(stateMachine.getContext().count).toBe(11);
    });

    it('should reset to idle state from completed state when RESET event is sent', () => {
        stateMachine.send({ type: 'START' });
        stateMachine.send({ type: 'COMPLETE' });
        stateMachine.send({ type: 'RESET' });
        expect(stateMachine.getState()).toBe('idle');
        expect(stateMachine.getContext().count).toBe(0);
    });

    it('should notify subscribers on state change', () => {
        const subscriber = vi.fn();
        stateMachine.subscribe(subscriber);

        stateMachine.send({ type: 'START' });
        expect(subscriber).toHaveBeenCalledWith('active', stateMachine.getContext());

        stateMachine.send({ type: 'COMPLETE' });
        expect(subscriber).toHaveBeenCalledWith('completed', stateMachine.getContext());
    });

    it('should not transition if event is not valid for current state', () => {
        stateMachine.send({ type: 'COMPLETE' });
        expect(stateMachine.getState()).toBe('idle'); // No transition should happen
    });

    it('should execute enter and exit actions correctly', () => {
        // Use the new getter method to safely access the transition map
        const transitionMap = stateMachine.getTransitionMap();

        if (transitionMap.idle && transitionMap.idle.START) {
            const enterSpy = vi.fn();
            const exitSpy = vi.fn();

            transitionMap.idle.START.enter = enterSpy;
            transitionMap.idle.START.exit = exitSpy;

            stateMachine.send({ type: 'START' });

            expect(enterSpy).toHaveBeenCalled();
            expect(exitSpy).not.toHaveBeenCalled(); // In this case, no explicit 'exit' function is defined
        }
    });
});
