// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

const tag = execSync('git describe --tags --abbrev=0').toString().trim();
const title = `Release ${tag}`;
const notes = `Release notes for version ${tag}`;

execSync(`gh release create ${tag} -t "${title}" -n "${notes}"`, { stdio: 'inherit' });
