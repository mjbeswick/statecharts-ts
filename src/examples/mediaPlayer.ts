import { type StateDefinition, Machine } from "../Machine";

// Define the events, context, and state definition as before
type MediaPlayerEvent =
  | { type: 'PLAY'; data?: { trackId: string; trackName: string } }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'CONNECT'; data?: { connectionType: string } }
  | { type: 'DISCONNECT' };

interface MediaPlayerContext {
  currentTrackId?: string;
  currentTrackName?: string;
  connectionType?: string;
  volume: number;
  delayDuration: number;
}

const mediaPlayerMachineDefinition: StateDefinition<MediaPlayerEvent, MediaPlayerContext> = {
  parallel: true,
  states: {
    playback: {
      initial: 'stopped',
      states: {
        stopped: {
          onEntry: async (context) => {
            console.log('Entering stopped state');
            // Simulate an async operation
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log('Stopped state ready');
          },
          transitions: {
            PLAY: {
              target: 'playback.playing',
              cond: (context) => context.connectionType === 'WiFi',
              action: async (context, event) => {
                if (event.type === 'PLAY' && event.data) {
                  context.currentTrackId = event.data.trackId;
                  context.currentTrackName = event.data.trackName;
                  console.log(`Loading track ${context.currentTrackName}`);
                  // Simulate track loading time
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  console.log('Track loaded');
                }
              },
            },
          },
        },
        playing: {
          after: [
            {
              delay: (context) => context.delayDuration,
              transition: {
                target: 'playback.paused',
                action: (context) => {
                  console.log('Auto-pausing after delay');
                },
              },
            },
          ],
          transitions: {
            PAUSE: { target: 'playback.paused' },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
                console.log('Playback stopped');
              },
            },
          },
        },
        paused: {
          transitions: {
            PLAY: { target: 'playback.playing' },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
                console.log('Playback stopped');
              },
            },
          },
        },
      },
    },
    network: {
      initial: 'disconnected',
      states: {
        disconnected: {
          transitions: {
            CONNECT: {
              target: 'network.connected',
              action: (context, event) => {
                if (event.type === 'CONNECT' && event.data) {
                  context.connectionType = event.data.connectionType;
                  console.log(`Connected via ${context.connectionType}`);
                }
              },
            },
          },
        },
        connected: {
          transitions: {
            DISCONNECT: {
              target: 'network.disconnected',
              action: (context) => {
                context.connectionType = undefined;
                console.log('Disconnected from network');
              },
            },
          },
        },
      },
    },
  },
};

const initialStates: string[] = ['playback', 'network'];
const mediaPlayerContext: MediaPlayerContext = {
  volume: 50,
  delayDuration: 5000, // 5 seconds delay for dynamic after transition
};

// Create the state machine instance
const mediaPlayerMachine = new Machine<MediaPlayerEvent, MediaPlayerContext>(
  mediaPlayerMachineDefinition,
  mediaPlayerContext,
  initialStates
);

// Subscribe to transitions
mediaPlayerMachine.onTransition((states) => {
  console.log('Current States:', states);
  console.log('Context:', mediaPlayerMachine.getContext());
});

// Trigger events
(async () => {
  await mediaPlayerMachine.send({ type: 'CONNECT', data: { connectionType: 'WiFi' } });
  await mediaPlayerMachine.send({ type: 'PLAY', data: { trackId: '123', trackName: 'My Song' } });
  // Wait for the auto-pause after delay
})();
