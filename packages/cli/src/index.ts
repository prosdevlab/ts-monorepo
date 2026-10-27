import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

// Read the version from package.json at runtime; resolves the same from src/ and dist/.
const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

export interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
}

const defaultIo: Io = {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
};

export const HELP = `Usage: cli <command> [options]

Commands:
  greet [--name <name>]   Print a greeting

Options:
  -h, --help              Show this help
  -v, --version           Show the version`;

/** Run the CLI with the given arguments. Returns the process exit code instead of exiting, so it can be tested. */
export function run(argv: string[], io: Io = defaultIo): number {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(argv);
  } catch (error) {
    io.err((error as Error).message);
    io.err('Run "cli --help" for usage.');
    return 2;
  }

  const { values, positionals } = parsed;
  if (values.version) {
    io.out(version);
    return 0;
  }
  const [command] = positionals;
  if (values.help || !command) {
    io.out(HELP);
    return command || values.help ? 0 : 1;
  }
  if (command === 'greet') {
    io.out(`Hello, ${values.name ?? 'world'}!`);
    return 0;
  }
  io.err(`Unknown command "${command}".`);
  io.err('Run "cli --help" for usage.');
  return 2;
}

function parse(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      name: { type: 'string' },
    },
  });
}
