import nextEnv from '@next/env';
import { invalidEnvironment } from '../config/environment.mjs';

nextEnv.loadEnvConfig(process.cwd(), true);
const invalid = invalidEnvironment(process.env, process.argv.includes('--full'));
if (invalid.length) {
  console.error('Missing or invalid environment settings:', invalid.join(', '));
  process.exitCode = 1;
} else {
  console.log('Environment configuration passed');
}
