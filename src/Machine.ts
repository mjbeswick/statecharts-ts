import { ValidateStateNode, MachineNodeConfig } from './createMachine';
import { MachineEvent, MachineState } from './MachineState';
import { Subscription } from './Subscription';

type ActiveState<S extends string> = {
  [key in S]: ActiveState<S> | boolean;
};

export class Machine<
  E extends MachineEvent,
  C extends object,
  T extends MachineNodeConfig<E, C, S>,
  S extends string,
> {
  #rootNode: MachineState<E, C>;
  #subscription: Subscription;

  constructor(config: ValidateStateNode<E, C, T, S> | MachineState<E, C>) {
    if (config instanceof MachineState) {
      this.#rootNode = config;
    } else {
      this.#rootNode = this.buildNodeTree(config as MachineNodeConfig<E, C, S>);
    }

    this.#subscription = new Subscription();
  }

  get rootNode(): MachineState<E, C> {
    return this.#rootNode;
  }

  private buildNodeTree(
    config: MachineNodeConfig<E, C, S>,
    id?: string,
  ): MachineState<E, C> {
    const { states, ...rest } = config;
    const rootNode = new MachineState<E, C>({ ...rest, id });

    if (states) {
      Object.entries(states).forEach(([childId, childConfig]) => {
        const isInitial = childId === config.initial;
        const isFinial = childId == config.final;
        const childNode = this.buildNodeTree(
          childConfig as MachineNodeConfig<E, C, S>,
          childId,
        );

        rootNode.addChildState(childNode, isInitial, isFinial);
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
    const machine = new Machine<E, C, T, S>(this.#rootNode.clone());

    return machine;
  }

  getActive(current = this.#rootNode): ActiveState<S> {
    return Object.fromEntries(
      current.children.map((child) => {
        if (child.children.length === 0) {
          return [child.id, child.isActive];
        }

        const active = this.getActive(child);

        return [child.id, active];
      }),
    );
  }
}
