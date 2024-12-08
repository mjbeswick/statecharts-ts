// import { Machine } from './Machine';
import {
  EnterAction,
  EventAction,
  ExitAction,
  MachineEvent,
} from './MachineState';

import { Machine } from './Machine';

export type MachineNodeConfig<
  E extends MachineEvent,
  C extends object,
  S extends string,
> = {
  id?: string;
  context: C;
  initial?: string;
  final?: string;
  states: Record<S, Partial<MachineNodeConfig<E, C, S>>>;
  onEnter?: EnterAction<C>;
  onExit?: ExitAction<C>;
  on?: {
    [K in E['type']]?: EventAction<Extract<E, { type: K }>, C>;
  };
  events: E;
};

type CoerceStateNode<
  E extends MachineEvent,
  C extends object,
  T extends MachineNodeConfig<E, C, S>,
  S extends string,
> = {
  id?: string;
  context: C;
  initial?: keyof T['states'];
  final?: keyof T['states'];
  states?: {
    [K in keyof T['states']]: T['states'][K] extends MachineNodeConfig<E, C, S>
      ? CoerceStateNode<E, C, T['states'][K], S>
      : T['states'][K];
  };
  onEnter?: EnterAction<C>;
  onExit?: ExitAction<C>;
  on?: {
    [K in E['type']]?: EventAction<Extract<E, { type: K }>, C>;
  };
  events: E;
};

export type ValidateStateNode<
  E extends MachineEvent,
  C extends object,
  T extends MachineNodeConfig<E, C, S>,
  S extends string,
> = T extends never ? T : CoerceStateNode<E, C, T, S>;

export function createMachine<
  C extends object,
  E extends MachineEvent,
  T extends MachineNodeConfig<E, C, S>,
  S extends string,
>(config: ValidateStateNode<E, C, T, S>) {
  const machine = new Machine(config);

  return machine;
}
