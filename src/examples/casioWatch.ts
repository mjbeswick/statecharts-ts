import { type StateDefinition, Machine } from '../Machine';

/*
    This example demonstrates the usage of the state machine to model the behavior of a Casio F-91W watch.
    
    The watch has the following modes:
    - Timekeeping Mode: Displays the current time.
    - Alarm Mode: Allows setting and toggling the alarm and hourly chime.
    - Stopwatch Mode: Allows starting, stopping, and resetting the stopwatch.
    - Time Setting Mode: Allows adjusting the time.
    - Date Setting Mode: Allows adjusting the date.
*/

// Define the events corresponding to button presses
type WatchEvent =
  | { type: 'PRESS_A' }
  | { type: 'PRESS_B' }
  | { type: 'PRESS_C' }
  | { type: 'LONG_PRESS_C' };

// Define the context of the watch, storing its state
interface WatchContext {
  time: Date;
  alarmTime: Date;
  stopwatchTime: number;
  stopwatchRunning: boolean;
  alarmEnabled: boolean;
  chimeEnabled: boolean;
}

// Define the state machine for the Casio F-91W watch
const watchMachineDefinition: StateDefinition<WatchEvent, WatchContext> = {
  initial: 'timekeeping',
  states: {
    timekeeping: {
      enter: (context) => {
        console.log('Entered Timekeeping Mode');
      },
      transitions: {
        PRESS_B: { target: 'alarm' },
        LONG_PRESS_C: { target: 'timeSetting' },
        PRESS_A: {
          target: 'timekeeping',
          action: () => {
            console.log('Light On');
          },
        },
      },
    },
    alarm: {
      enter: (context) => {
        console.log('Entered Alarm Mode');
      },
      transitions: {
        PRESS_B: { target: 'stopwatch' },
        PRESS_C: {
          target: 'alarm',
          action: (context) => {
            context.alarmEnabled = !context.alarmEnabled;
            console.log(`Alarm Enabled: ${context.alarmEnabled}`);
          },
        },
        PRESS_A: {
          target: 'alarm',
          action: (context) => {
            context.chimeEnabled = !context.chimeEnabled;
            console.log(`Hourly Chime Enabled: ${context.chimeEnabled}`);
          },
        },
      },
    },
    stopwatch: {
      enter: (context) => {
        console.log('Entered Stopwatch Mode');
      },
      transitions: {
        PRESS_B: { target: 'timekeeping' },
        PRESS_A: {
          target: 'stopwatch',
          action: (context) => {
            context.stopwatchRunning = !context.stopwatchRunning;
            console.log(
              `Stopwatch ${context.stopwatchRunning ? 'Started' : 'Stopped'}`
            );
          },
        },
        PRESS_C: {
          target: 'stopwatch',
          action: (context) => {
            if (!context.stopwatchRunning) {
              context.stopwatchTime = 0;
              console.log('Stopwatch Reset');
            }
          },
        },
      },
    },
    timeSetting: {
      enter: (context) => {
        console.log('Entered Time Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'timeSetting',
          action: (context) => {
            // Adjust minutes
            context.time.setMinutes(context.time.getMinutes() + 1);
            console.log(`Time Adjusted: ${context.time.toLocaleTimeString()}`);
          },
        },
        PRESS_B: {
          target: 'dateSetting',
        },
        LONG_PRESS_C: { target: 'timekeeping' },
      },
    },
    dateSetting: {
      enter: (context) => {
        console.log('Entered Date Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'dateSetting',
          action: (context) => {
            // Adjust day
            context.time.setDate(context.time.getDate() + 1);
            console.log(`Date Adjusted: ${context.time.toLocaleDateString()}`);
          },
        },
        PRESS_B: {
          target: 'timeSetting',
        },
        LONG_PRESS_C: { target: 'timekeeping' },
      },
    },
  },
};

// Initialize the watch context with default values
const watchContext: WatchContext = {
  time: new Date(),
  alarmTime: new Date(new Date().setHours(6, 0, 0)), // Default alarm at 6:00 AM
  stopwatchTime: 0,
  stopwatchRunning: false,
  alarmEnabled: false,
  chimeEnabled: false,
};

// Create the state machine instance
const watchMachine = new Machine<WatchEvent, WatchContext>(
  watchMachineDefinition,
  watchContext,
  [watchMachineDefinition.initial!]
);

// Function to simulate the stopwatch counting
function simulateStopwatch() {
  if (watchContext.stopwatchRunning) {
    watchContext.stopwatchTime += 1;
    console.log(`Stopwatch Time: ${watchContext.stopwatchTime}s`);
  }
}

// Simulate the passing of time every second
setInterval(() => {
  watchContext.time.setSeconds(watchContext.time.getSeconds() + 1);

  // Check for alarm
  if (
    watchContext.alarmEnabled &&
    watchContext.time.getHours() === watchContext.alarmTime.getHours() &&
    watchContext.time.getMinutes() === watchContext.alarmTime.getMinutes() &&
    watchContext.time.getSeconds() === watchContext.alarmTime.getSeconds()
  ) {
    console.log('Alarm Ringing!');
  }

  // Check for hourly chime
  if (
    watchContext.chimeEnabled &&
    watchContext.time.getMinutes() === 0 &&
    watchContext.time.getSeconds() === 0
  ) {
    console.log('Hourly Chime!');
  }

  // Simulate stopwatch
  simulateStopwatch();
}, 1000);

// Demonstrate usage with button presses
watchMachine.onTransition((states) => {
  console.log('Current State:', states[0]);
});

// Simulate button presses
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 2000); // Switch to Alarm Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 4000); // Toggle Alarm
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 6000); // Toggle Hourly Chime
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 8000); // Switch to Stopwatch Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 10000); // Start Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 15000); // Stop Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 16000); // Reset Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 18000); // Switch to Timekeeping Mode
setTimeout(() => watchMachine.send({ type: 'LONG_PRESS_C' }), 20000); // Enter Time Setting Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 22000); // Adjust Time
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 24000); // Switch to Date Setting Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 26000); // Adjust Date
setTimeout(() => watchMachine.send({ type: 'LONG_PRESS_C' }), 28000); // Exit Time Setting Mode
