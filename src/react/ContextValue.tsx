import { useContext } from 'react';
import { invariant } from '../lib/invariant';
import { MachineEvent, MachineState } from '../MachineState';
import { StateContext } from './State';

type Props =
  | {
      selector: (context: any) => unknown; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  | {
      get: string;
    };

export function ContextValue(props: Props) {
  const state = useContext(StateContext) as MachineState<
    MachineEvent,
    any // eslint-disable-line @typescript-eslint/no-explicit-any
  > | null;

  invariant(state, 'State context not found');

  if ('selector' in props) {
    return <>{props.selector(state.context)}</>;
  }

  return <>{String(state.context[props.get])}</>;
}
