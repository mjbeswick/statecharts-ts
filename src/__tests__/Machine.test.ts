import { describe, it, expect } from 'vitest';
import { Machine } from '../Machine';

describe('Machine', () => {
  it('create a machine', () => {
    const machine = new Machine({
      events: {} as { type: 'START' },
      context: { count: 0 },
      initial: 'a',
      states: {
        a: {},
      },
    });

    expect(machine).toBeDefined();
  });

  it('initialize root node', () => {
    const machine = new Machine({
      events: {} as { type: 'START' },
      context: { count: 0 },
      initial: 'a',
      states: { a: {} },
    });

    expect(machine.rootNode.id).toBeDefined();
  });

  it('start machine', () => {
    const machine = new Machine({
      events: {} as { type: 'START' },
      context: { count: 0 },
      initial: 'a',
      states: { a: {} },
    });

    expect(machine.rootNode.children[0].isActive).toBe(false);

    machine.start();

    expect(machine.rootNode.children[0].isActive).toBe(true);
  });

  it('initialize child nodes', () => {
    const machine = new Machine({
      events: {} as { type: 'START' },
      context: { count: 0 },
      initial: 'a',
      states: {
        a: {},
      },
    });

    expect(machine.rootNode.children.length).toBe(1);
    expect(machine.rootNode.children[0].id).toBe('a');
  });

  it('set initial state', () => {
    const machine = new Machine({
      events: {} as { type: 'START' },
      context: { count: 0 },
      initial: 'b',
      states: { a: {}, b: {}, c: {} },
    });

    machine.start();

    expect(machine.rootNode.children[0].id).toBe('a');
    expect(machine.rootNode.children[0].isActive).toBe(false);
    expect(machine.rootNode.children[1].id).toBe('b');
    expect(machine.rootNode.children[1].isActive).toBe(true);
    expect(machine.rootNode.children[2].id).toBe('c');
    expect(machine.rootNode.children[2].isActive).toBe(false);
  });
});
