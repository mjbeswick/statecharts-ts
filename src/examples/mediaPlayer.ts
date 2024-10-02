import { type StateDefinition, Machine } from '../Machine';

/*
    This example demonstrates the usage of the state machine to model the behavior of a media player.

    The media player has the following modes:
    - Playback Mode: Allows playing, pausing, and stopping a track.
    - Network Mode: Allows connecting and disconnecting from a network.
*/

type MediaPlayerEvent =
  | { type: 'PLAY'; data?: { trackId: string; trackName: string } }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'CONNECT'; data?: { connectionType: string } }
  | { type: 'DISCONNECT' };

type MediaPlayerContext = {
  currentTrackId?: string;
  currentTrackName?: string;
  connectionType?: string;
};

const mediaPlayerMachineDefinition: StateDefinition<
  MediaPlayerEvent,
  MediaPlayerContext
> = {
  parallel: true,
  states: {
    playback: {
      initial: 'stopped',
      states: {
        stopped: {
          transitions: {
            PLAY: {
              target: 'playback.playing',
              action: (context, event) => {
                if (event.type === 'PLAY' && event.data) {
                  context.currentTrackId = event.data.trackId;
                  context.currentTrackName = event.data.trackName;
                }
              },
            },
          },
        },
        playing: {
          transitions: {
            PAUSE: {
              target: 'playback.paused',
            },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
              },
            },
          },
        },
        paused: {
          transitions: {
            PLAY: {
              target: 'playback.playing',
            },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
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
              },
            },
          },
        },
      },
    },
  },
};

const initialStates: string[] = ['playback', 'network'];
const mediaPlayerContext: MediaPlayerContext = {};

const mediaPlayerMachine = new Machine<MediaPlayerEvent, MediaPlayerContext>(
  mediaPlayerMachineDefinition,
  mediaPlayerContext,
  initialStates
);

// Demonstrate usage
mediaPlayerMachine.onTransition((states) => {
  console.log('Transitioned to states:', states);
  console.log('Current context:', mediaPlayerMachine.getContext());
});

mediaPlayerMachine.send({ type: 'CONNECT', data: { connectionType: 'WiFi' } });
mediaPlayerMachine.send({
  type: 'PLAY',
  data: { trackId: '123', trackName: 'My Song' },
});
mediaPlayerMachine.send({ type: 'PAUSE' });
mediaPlayerMachine.send({ type: 'PLAY' });
mediaPlayerMachine.send({ type: 'DISCONNECT' });
mediaPlayerMachine.send({ type: 'STOP' });
