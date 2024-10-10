type Action<C> = (context: C) => void;
type AfterTransition<C> = {
    delay: number | ((context: C) => number);
    target: () => UnifiedState<C>;
};
type OnTransition<C> = {
    [K: string]: {
        target: () => UnifiedState<C>;
    };
};
export type UnifiedState<C> = {
    send: (event: keyof OnTransition<C>) => void;
    setState: (state: UnifiedState<C>) => void;
    context?: C;
    action?: Action<C>;
    after?: AfterTransition<C>;
    on?: OnTransition<C>;
    states?: Record<string, UnifiedState<C>>;
    value?: UnifiedState<C>;
};
export declare function createState<C>(definition: Omit<UnifiedState<C>, 'send' | 'setState'>): UnifiedState<C>;
export {};
