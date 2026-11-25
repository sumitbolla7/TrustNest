import { spawnSync } from 'node:child_process';

const pattern = [
  '(sk|pk|tk)\\.[A-Za-z0-9_-]{15,}\\.[A-Za-z0-9_-]{10,}',
  'AIza[0-9A-Za-z_-]{35}', 'gh[pousr]_[A-Za-z0-9]{20,}',
  'github_pat_[A-Za-z0-9_]{30,}', '(AKIA|ASIA)[A-Z0-9]{16}',
  'BEGIN [A-Z ]*PRIVATE KEY', 'mongodb(\\+srv)?://[^/@[:space:]]+:[^/@[:space:]]+@',
  'cloudinary://[0-9]+:[^@[:space:]]+@',
].join('|');
const { status, error } = spawnSync('git', ['grep', '--cached', '-IilE', '-e', pattern], { stdio: 'inherit' });
if (status !== 1) {
  console.error(error?.message ?? 'Credential-like content or search error.');
  process.exitCode = 1;
} else {
  console.log('No targeted credential patterns found in indexed text.');
}
