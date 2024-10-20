// src/examples/alarmClock.ts

import { createStateMachine, TransitionMap } from '../stateMachine';

// Define the states and events for the Alarm Clock
type AlarmClockState = 'normal' | 'setting' | 'timeDisplay' | 'alarmSystem' | 'showingTime' | 'alarmRinging' | 'alarmSnoozed' | 'alarmOff';
type AlarmClockEvent =
    | { type: 'SET_BUTTON_PRESSED' }
    | { type: 'ALARM_TIME_REACHED' }
    | { type: 'DISABLE_ALARM' }
    | { type: 'EXIT_SETTING' }
    | { type: 'SAVE_TIME_SETTINGS' }
    | { type: 'SAVE_ALARM_SETTINGS' }
    | { type: 'SNOOZE_BUTTON_PRESSED' }
    | { type: 'SNOOZE_EXPIRED' }
    | { type: 'TURN_OFF_ALARM' };

// Define the context for the state machine
interface AlarmClockContext {
    currentTime: Date;
    alarmTime: Date;
    isAlarmArmed: boolean;
}

// Define the state machine configuration with parallel states
const alarmClockConfig: TransitionMap<AlarmClockState, AlarmClockEvent, AlarmClockContext> = {
    normal: {
        isInitial: true,
        isParallel: true, // Use isParallel for parallel states
        states: {
            timeDisplay: {
                states: {
                    showingTime: {
                        isInitial: true,
                        transitions: {
                            SET_BUTTON_PRESSED: { target: 'setting' }
                        }
                    },
                    settingTime: {
                        transitions: {
                            SAVE_TIME_SETTINGS: { target: 'showingTime' }
                        }
                    }
                }
            },
            alarmSystem: {
                states: {
                    alarmArmed: {
                        isInitial: true,
                        transitions: {
                            ALARM_TIME_REACHED: { target: 'alarmRinging' }
                        }
                    },
                    alarmRinging: {
                        transitions: {
                            SNOOZE_BUTTON_PRESSED: { target: 'alarmSnoozed' },
                            TURN_OFF_ALARM: { target: 'alarmOff' }
                        }
                    },
                    alarmSnoozed: {
                        transitions: {
                            SNOOZE_EXPIRED: { target: 'alarmRinging' }
                        }
                    },
                    alarmOff: {
                        transitions: {
                            DISABLE_ALARM: { target: 'alarmArmed' as AlarmClockState }
                        }
                    }
                }
            }
        }
    },
    setting: {
        transitions: {
            EXIT_SETTING: { target: 'normal' },
            SAVE_ALARM_SETTINGS: { target: 'normal', action: ({ context }) => { context.isAlarmArmed = true; } }
        }
    }
};

// Create the state machine
const alarmClockStateMachine = createStateMachine({
    context: {
        currentTime: new Date(),
        alarmTime: new Date(),
        isAlarmArmed: false
    },
    states: alarmClockConfig
});

// Start the state machine
alarmClockStateMachine.start();

// Example usage
alarmClockStateMachine.send({ type: 'SET_BUTTON_PRESSED' });
console.log(alarmClockStateMachine.getState()); // Should log the current states of both regions

