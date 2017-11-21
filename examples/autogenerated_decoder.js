// Decodes a random replay file in your replay directory 
// This will automatically download and autogenerate the relevant protocol decoder version

const replays = require('../lib/replays')
const proto = require('../lib/protocol')

replays.list().then((files) => {
    let file = files[Math.floor(Math.random()*files.length)]

    let decoder = new proto.Protocol(file)

    decoder.decode('replay.game.events').then((result) => {
        console.log(result)
    })
    

})
