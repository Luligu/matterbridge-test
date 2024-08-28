import { execSync } from 'child_process';

let tag = execSync('git describe --tags --abbrev=0').toString().trim();
if (tag.startsWith('v')) {
  tag = tag.substring(1);
}

const title = `Release ${tag}`;
const notes = `Release notes for version ${tag}`;

execSync(`gh release create ${tag} -t "${title}" -n "${notes}"`, { stdio: 'inherit' });
