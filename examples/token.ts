import { createMachine } from '../src/createMachine';
import { generateId } from '../src/lib/generateId';
import { invariant } from '../src/lib/invariant';

const MOCK_DELAY = 1000; // 1 second
const TOKEN_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type Credentials = {
  username: string;
  password: string;
};

async function mockFetchToken(
  credentials: Credentials,
): Promise<TokenResponse> {
  invariant(credentials.username, 'Invalid username');
  invariant(credentials.password, 'Invalid password');

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

  return {
    accessToken: generateId(),
    refreshToken: generateId(),
    expiresAt: Date.now() + TOKEN_EXPIRY,
  };
}

async function mockRefreshToken(refreshToken: string): Promise<TokenResponse> {
  invariant(refreshToken, 'Invalid refresh token');

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

  return {
    accessToken: generateId(),
    refreshToken: generateId(),
    expiresAt: Date.now() + TOKEN_EXPIRY,
  };
}

type Events =
  | { type: 'AUTHENTICATE'; data: { username: string; password: string } }
  | { type: 'FETCH_RESPONSE' }
  | { type: 'REFRESH_TOKEN' }
  | { type: 'REFRESH_ERROR' };

type Token = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const machine = createMachine({
  events: {} as Events,
  context: {
    token: null as Token | null,
    attempts: 0,
    credentials: null as Credentials | null,
  },
  initial: 'unauthenticated',
  states: {
    unauthenticated: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            AUTHENTICATE: ({ event, setContext }) => {
              setContext('credentials', event.data);
              return 'fetchingToken';
            },
          },
        },
        fetchingToken: {
          onEnter: async ({ context, setContext }) => {
            const { attempts, credentials } = context;

            invariant(credentials, 'Invalid credentials');
            setContext('attempts', attempts + 1);

            try {
              const token = await mockFetchToken(credentials);
              setContext('token', token);

              return 'authenticated';
            } catch {
              return 'fetchingTokenError';
            }
          },
        },
        fetchingTokenError: {},
      },
    },
    authenticated: {
      initial: 'waitForExpiration',
      states: {
        waitForExpiration: {
          onEnter: ({ after, context }) => {
            invariant(context.token, 'Invalid context');

            after(context.token.expiresAt - Date.now(), () => {
              return 'refreshingToken';
            });
          },
        },
        refreshingToken: {
          onEnter: async ({ setContext, context }) => {
            invariant(context.token, 'Invalid context');

            try {
              const { accessToken, refreshToken, expiresAt } =
                await mockRefreshToken(context.token.refreshToken);

              setContext('token', { accessToken, refreshToken, expiresAt });
              setContext('attempts', 0);

              return 'waitForExpiration';
            } catch {
              return 'refreshingTokenError';
            }
          },
        },
        refreshingTokenError: {
          onEnter: ({ after }) => {
            after(1000, () => {
              return 'refreshingToken';
            });
          },
        },
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('Current state:', state);
});

machine.start();

machine.dispatch({
  type: 'AUTHENTICATE',
  data: { username: 'test', password: 'test' },
});
