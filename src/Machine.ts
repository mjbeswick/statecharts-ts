import { ValidateStateNode, StateNode } from './createMachine';
import { MachineEvent, MachineNode } from './MachineNode';
import { Subscription } from './Subscription';

export class Machine<
  E extends MachineEvent,
  C extends object,
  T extends StateNode<E, C>,
> {
  #rootNode: MachineNode<E, C>;
  #subscription: Subscription;

  constructor(config: ValidateStateNode<E, C, T> | MachineNode<E, C>) {
    if (config instanceof MachineNode) {
      this.#rootNode = config;
    } else {
      this.#rootNode = this.buildNodeTree(config as StateNode<E, C>);
    }

    this.#subscription = new Subscription();
  }

  get rootNode(): MachineNode<E, C> {
    return this.#rootNode;
  }

  private buildNodeTree(
    config: StateNode<E, C>,
    id?: string,
  ): MachineNode<E, C> {
    const { states, ...rest } = config;
    const rootNode = new MachineNode<E, C>({ ...rest, id });

    if (states) {
      Object.entries(states).forEach(([childId, childConfig]) => {
        const isInitial = childId === config.initial;
        const childNode = this.buildNodeTree(
          childConfig as StateNode<E, C>,
          childId,
        );
        rootNode.addChildState(childNode, isInitial);
      });
    }

    return rootNode;
  }

  start() {
    this.#rootNode.enter();
  }

  stop() {
    this.#rootNode.exit();
  }

  dispatch(event: E) {
    this.#rootNode.dispatch(event);
  }

  subscribe(handler: (state: string) => void) {
    return this.#subscription.subscribe(handler);
  }

  clone() {
    const machine = new Machine<E, C, T>(this.#rootNode.clone());

    return machine;
  }
}
