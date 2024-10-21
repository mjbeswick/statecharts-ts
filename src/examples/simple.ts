import { createStateMachine, TransitionMap } from '../index';

// Tetris state machine

type States =
    | 'title'
    | 'menu'
    | 'play'
    | 'gameOver'
    | 'pause'

type Events = { type: 'A' };

const context = {
    score: 0,
    level: 1,
    lines: 0,
    linesToNextLevel: 10,
    linesPerLevel: 10,
}

type Context = typeof context;

const states: TransitionMap<States, Events, Context> = {
    title: {
        on: {
            A: 'menu'
        }
    }
}

const machine = createStateMachine({
    context,
    states
})
