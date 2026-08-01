const { spawnSync } = require('child_process')

const result = spawnSync('graphify', ['hook', 'install'], { stdio: 'inherit', shell: true })

if (result.error || result.status !== 0) {
  console.warn('Graphify CLI was not found. Install graphifyy to enable automatic graph updates.')
}
