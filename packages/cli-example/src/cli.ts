#!/usr/bin/env node
import { run } from './index.js';

// Set the exit code instead of calling process.exit(), so pending output is flushed first.
process.exitCode = run(process.argv.slice(2));
