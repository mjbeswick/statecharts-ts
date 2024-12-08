import { ButtonHTMLAttributes, useContext } from 'react';
import { StateContext } from './State';
import { invariant } from '../lib/invariant';
import { MachineEvent, MachineState } from '../MachineState';

type Props = {
  event: MachineEvent;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function StateButton(props: Props) {
  const { event, ...rest } = props;
  const state = useContext(StateContext) as MachineState<
    MachineEvent,
    object
  > | null;

  invariant(state, 'State context not found');

  const handleClick = () => {
    state.dispatch(event);
  };

  return (
    <button onClick={handleClick} {...rest}>
      {props.children}
    </button>
  );
}
