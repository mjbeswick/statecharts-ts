import { StateMachine } from '../createMachine';
import { useState, useEffect } from 'react';

export function useMachine<E extends MachineEvent, C, S extends string>(
  machine: StateMachine<E, C, S>,
) {
  const [state, setState] = useState(machine.getState());
  const [context, setContext] = useState(machine.context);

  useEffect(() => {
    return machine.subscribe((state, context) => {
      setState(state);
      setContext(context);
    });
  }, [machine]);

  return { state, context, send: machine.send };
}
