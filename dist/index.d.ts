type Action<C> = (context: C) => void;
type AfterTransition<E extends string, C> = {
    delay: number | ((context: C) => number);
    target: () => StateResult<E, C>;
};
type OnTransition<E extends string, C> = {
    [K in E]: {
        target: () => StateResult<E, C>;
    };
};
type StateDefinition<E extends string, C> = {
    context: C;
    action?: Action<C>;
    after?: AfterTransition<E, C>;
    on?: OnTransition<E, C>;
    initial?: StateResult<E, C>;
    states?: Record<string, StateResult<E, C>>;
};
export type StateMachine<E extends string, C> = {
    send: (event: E) => void;
    setState: (state: StateResult<E, C>) => void;
    value: StateResult<E, C>;
    context: C;
};
export type StateResult<E extends string, C> = {
    send: (event: E) => void;
    context: C;
} & Partial<{
    setState: (state: StateResult<E, C>) => void;
    action: Action<C>;
    after: AfterTransition<E, C>;
    on: OnTransition<E, C>;
}>;
export declare function createState<E extends string, C>(definition: StateDefinition<E, C>): StateMachine<E, C> | StateResult<E, C>;
export {};
