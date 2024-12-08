import {
  ReactNode,
  useContext,
  useEffect,
  useRef,
  createContext,
  useReducer,
} from 'react';
import {
  EnterAction,
  EventAction,
  ExitAction,
  FinalAction,
  MachineEvent,
  MachineState,
} from '../MachineState';

type Props<E extends MachineEvent, C extends object, S extends string> = {
  children: ReactNode;
  id: S;
  events?: E;
  context?: C;
  onEnter?: EnterAction<E, C>;
  onExit?: ExitAction<C>;
  onFinal?: FinalAction<C>;
  on?: {
    [K in E['type']]?: EventAction<Extract<E, { type: K }>, C>;
  };
  initial?: boolean;
  final?: boolean;
};

export const StateContext = createContext<unknown | null>(null);

declare global {
  interface Window {
    states: Record<string, unknown>;
  }
}

window.states = window.states || {};

export function State<
  E extends MachineEvent,
  C extends object,
  S extends string,
>(props: Props<E, C, S>) {
  const parentState = useContext(StateContext) as MachineState<E, C> | null;
  const {
    id,
    events,
    context,
    onEnter,
    onExit,
    onFinal,
    on,
    children,
    initial = false,
    final = false,
  } = props;
  const stateNodeRef = useRef<MachineState<E, C>>();
  const [, forceUpdate] = useReducer((x) => {
    console.log('forceUpdate', x);
    return x + 1;
  }, 0);

  useEffect(() => {
    if (!stateNodeRef.current) {
      const config = {
        id,
        events,
        context,
        onFinal,
        on: {
          ...on,
        },
      };
      const stateNode = new MachineState(config);

      stateNode.onEnter = (...args) => {
        onEnter?.(...args);
        forceUpdate();
      };

      stateNode.onExit = (...args) => {
        onExit?.(...args);
        forceUpdate();
      };

      stateNode.onTransition = () => {
        forceUpdate();
      };

      if (!parentState) {
        stateNode.enter();
      }

      window.states[id] = stateNode;
      stateNodeRef.current = stateNode;
    }

    const stateNode = stateNodeRef.current!;

    if (parentState) {
      parentState.addChildState(stateNode, initial, final);
    }

    return () => {
      console.log('unmounting', id);
      if (parentState) {
        parentState.removeChildState(stateNode);
      }

      console.log('deleting', id);
      delete window.states[id];

      stateNodeRef.current = undefined;
    };
  }, [parentState, events, context, onEnter, onExit, onFinal, initial, final]);

  if (stateNodeRef.current?.isActive) {
    return (
      <StateContext.Provider value={stateNodeRef.current}>
        {children}
      </StateContext.Provider>
    );
  }

  return null;
}
