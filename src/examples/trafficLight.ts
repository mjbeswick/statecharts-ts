import { machineFactory } from '../index';

/*
  Traffic light state machine

  This state machine simulates a traffic light system with four states: stop, readyGo, go, and readyStop.
  Each state represents a different phase of the traffic light cycle, controlling both vehicle and pedestrian signals.

  - stop: 
    - Traffic lights are red, and pedestrian lights are green, allowing pedestrians to cross.
    - The system remains in this state for a specified stopPeriod before transitioning to readyGo.

  - beforeReadyGo:
    - Traffic lights are red, and pedestrian lights are red, stopping pedestrians from crossing.
    - The system remains in this state for a specified beforeReadyGoPeriod before transitioning to readyGo.

  - readyGo:
    - Traffic lights show red and amber, preparing vehicles to move.
    - Pedestrian lights remain green, but pedestrians should not start crossing.
    - After a readyGoPeriod, the system transitions to the go state.

  - go:
    - Traffic lights turn green, allowing vehicles to move.
    - Pedestrian lights are red, stopping pedestrian crossing.
    - The system can transition to the stop state upon receiving a 'stop' event, with pedestrians being warned to wait.

  - readyStop:
    - Traffic lights show amber, preparing vehicles to stop.
    - Pedestrian lights remain red.
    - After a readyStopPeriod, the system transitions back to the stop state.

  - afterReadyStop:
    - Traffic lights are red, and pedestrian lights are red, stopping pedestrians from crossing.
    - After a readyStopPeriod, the system transitions back to the stop state.

 */

const lights = {
  traffic: {
    red: false,
    amber: false,
    green: false,
  },
  pedestrian: {
    red: false,
    green: false,
  },
  wait: false,
};

const timeouts = {
  stop: 3_000,
  beforeReadyGo: 2_000,
  readyGo: 3_000,
  readyStop: 3_000,
  afterReadyStop: 2_000,
};

const machine = machineFactory({
  events: {} as { type: 'STOP' },
  states: {
    stop: {
      onEntry: ({ after }) => {
        lights.traffic = { red: true, amber: false, green: false };
        lights.pedestrian = { red: false, green: true };

        after(timeouts.stop, () => 'readyGo');
      },
    },
    beforeReadyGo: {
      onEntry: ({ after }) => {
        lights.traffic = { red: true, amber: false, green: false };
        lights.pedestrian = { red: false, green: true };

        after(timeouts.beforeReadyGo, () => 'readyGo');
      },
    },
    readyGo: {
      type: 'initial',
      onEntry: ({ after }) => {
        lights.traffic = { red: true, amber: true, green: false };
        lights.pedestrian = {
          red: true,
          green: false,
        };

        after(timeouts.readyGo, () => 'go');
      },
    },
    go: {
      onEntry: () => {
        lights.traffic = { red: false, amber: false, green: true };
        lights.pedestrian = { red: true, green: false };
      },
      on: {
        STOP: () => 'wait',
      },
    },
    wait: {
      onEntry: ({ after }) => {
        after(timeouts.readyStop, () => 'stop');
      },
    },
    readyStop: {
      onEntry: ({ after }) => {
        lights.traffic = { red: false, amber: true, green: false };
        lights.pedestrian = { red: false, green: true };

        after(timeouts.readyStop, () => 'stop');
      },
    },
    afterReadyStop: {
      onEntry: ({ after }) => {
        lights.traffic = { red: false, amber: true, green: false };
        lights.pedestrian = { red: false, green: true };

        after(timeouts.readyStop, () => 'stop');
      },
    },
  },
  on: {
    STOP: () => {
      if (lights.wait) {
        return null;
      }

      lights.wait = true;

      return 'wait';
    },
  },
});

machine.subscribe((state) => {
  const { pedestrian, traffic, wait } = lights;
  const [time] = new Date().toTimeString().split(' ');

  const trafficLights = [
    traffic.red ? '🔴' : '⚫️',
    traffic.amber ? '🟠' : '⚫️',
    traffic.green ? '🟢' : '⚫️',
  ]
    .filter(Boolean)
    .join('');

  const pedestrianLights = [
    pedestrian.red ? '🔴' : '⚫️',
    pedestrian.green ? '🟢' : '⚫️',
  ]
    .filter(Boolean)
    .join('');

  const waitLight = wait ? '🟠' : '⚫️';

  console.log(`[${time}] Transitioned to "${state}"`);
  console.log(`    traffic: ${trafficLights}`);
  console.log(`pedestrians: ${pedestrianLights}`);
  console.log(`       wait: ${waitLight}`);
});

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }

  // space key
  if (key.toString() === ' ') {
    machine.send({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, ctrl+C to exit\n');

machine.start();

console.log(machine.getState());
