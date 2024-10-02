import repl from 'node:repl';

const local = repl.start();

local.on('exit', () => {
  console.log('done');
  process.exit();
});
