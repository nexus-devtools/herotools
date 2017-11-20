const state = require('../state')
const process = require('process')

let startAt, endAt, ninetySecondMarkAt

console.log('Press CTRL+C to end')

state.watch().on('PROGRAM_NOT_RUNNING', () => {
    console.log('Heroes of the Storm is not running')
}).on('PROGRAM_RUNNING', () => {
    console.log('Heroes of the Storm is running')
}).on('GAME_STARTED', () => {
    startAt = new Date()
    console.log('Game has been started')
}).on('GAME_PAST90SECONDS', () => {
    ninetySecondMarkAt = new Date()
    console.log('In game clock has hit the 90 second mark')
}).on('GAME_FINISHED', () => {
    endAt = new Date()
    console.log('Game has finished')

    if (ninetySecondMarkAt) {
        const gameTime = endAt.getTime() - startAt.getTime() - (ninetySecondMarkAt.getTime() - startAt.getTime()) + 90000
        
        console.log('Game lasted ' + gameTime + ' milliseconds')
    }
})

process.stdin.on("keypress", function (ch, key) {
    if (key && key.name === "c" && key.ctrl) {
        process.exit(0)
    }
})