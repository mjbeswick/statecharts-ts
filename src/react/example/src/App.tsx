import { ContextValue } from '../../ContextValue';
import { State } from '../../State';
import { StateButton } from '../../StateButton';
import './App.css';
import { styled } from './stiches.config';

const Container = styled('div', {
  margin: '0 auto',
  height: '100%',
  '@bp3': {
    width: '1024px',
  },
});

const Title = styled('h1', {
  fontSize: '2rem',
  fontWeight: 'bold',
  margin: '2rem 0',
  padding: '0',
});

const Heading = styled('h2', {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  margin: '0.5rem 0',
  padding: '0',
});

const Box = styled('div', {
  padding: '1rem',
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
});

const Button = styled(StateButton, {
  padding: '0.5rem 1rem',
  backgroundColor: '#f2f2f2',
  color: 'black',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#e2e2e2',
  },
  marginRight: '0.5rem',
  marginLeft: '0.5rem',
});

type Events =
  | {
      type: 'RANDOMIZE_COUNT';
    }
  | {
      type: 'GO_BETA';
    }
  | {
      type: 'GO_BETA_1';
    }
  | {
      type: 'GO_BETA_2';
    };

function App() {
  return (
    <Container>
      <Title>State Machine</Title>
      <State id="root">
        <State
          id="alpha"
          initial
          context={{ count: 999 }}
          on={{
            GO_BETA: () => 'beta',
            RANDOMIZE_COUNT: ({ setContext }) => {
              setContext('count', (Math.random() * 1000) ^ 1);
              return 'alpha';
            },
          }}
          onEnter={({ after }) => {
            after(5000, () => {
              return 'beta';
            });
          }}
          events={{} as Events}
        >
          <Box>
            <Heading>Alpha</Heading>
            Value from context: <ContextValue get="count" />
            <Button event={{ type: 'GO_BETA' }}>Goto Beta</Button>
            <Button event={{ type: 'RANDOMIZE_COUNT' }}>Randomize Count</Button>
          </Box>
        </State>
        <State
          id="beta"
          on={{
            GO_ALPHA: () => 'alpha',
          }}
        >
          <Box>
            <Heading>Beta</Heading>
            <Button event={{ type: 'GO_ALPHA' }}>Goto Alpha</Button>
            <State id="beta-1" initial on={{ GO_BETA_2: () => 'beta-2' }}>
              <Box>
                <Heading>Beta 1</Heading>
                <Button event={{ type: 'GO_BETA_2' }}>Goto Beta 2</Button>
              </Box>
            </State>
            <State id="beta-2" on={{ GO_BETA_1: () => 'beta-1' }}>
              <Box>
                <Heading>Beta 2</Heading>
                <Button event={{ type: 'GO_BETA_1' }}>Goto Beta 1</Button>
              </Box>
            </State>
          </Box>
        </State>
      </State>
    </Container>
  );
}

export default App;
