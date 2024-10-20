"use strict";
// src/examples/alarmClock.ts
Object.defineProperty(exports, "__esModule", { value: true });
const stateMachine_1 = require("../stateMachine");
// Define the state machine configuration with parallel states
const alarmClockConfig = {
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
                            DISABLE_ALARM: { target: 'alarmArmed' }
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
const alarmClockStateMachine = (0, stateMachine_1.createStateMachine)({
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
//# sourceMappingURL=alarmClock.js.map