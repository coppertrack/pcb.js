const url = 'https://kitspace.org/boards/github.com/kasbah/push-on-hold-off/push-on-hold-off-1767c8a-gerbers.zip'
const pcb = require('./index')
pcb(url).then(s => console.log(s))
