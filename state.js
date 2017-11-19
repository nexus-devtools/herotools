const dirs = require('./paths')
const chokidar = require('chokidar')
const ps = require('ps-list')
const path = require('path')
const process = require('process')
const EventEmitter = require('events')

// Poll the program application state at different intervals
// If the program is active, we poll less often to reduce CPU usage
// These can be set as an environmental variable
const HEROTOOLS_POLL_FREQ_ACTIVE = process.env.HEROTOOLS_POLL_FREQ_ACTIVE || 30000
const HEROTOOLS_POLL_FREQ_INACTIVE = process.env.HEROTOOLS_POLL_FREQ_INACTIVE || 5000

class State extends EventEmitter {
    constructor() {
        super()
        State.PROGRAM_NOT_RUNNING = 'PROGRAM_NOT_RUNNING'
        State.PROGRAM_RUNNING = 'PROGRAM_RUNNING'
        State.GAME_STARTED = 'GAME_STARTED'
        State.GAME_PAST90SECONDS = 'GAME_PAST90SECONDS'
        State.GAME_FINISHED = 'GAME_FINISHED'

        let _state = State.PROGRAM_NOT_RUNNING

        this.setState = (newState) => {
            _state = newState
        }
        this.current = () => {
            return _state
        }
    }

    transition(to, args) {
        this.setState(to)

        this.emit(to, args)
    }

    programRunning(pid) {
        if (this.current() == State.PROGRAM_NOT_RUNNING) {
            this.transition(State.PROGRAM_RUNNING, {
                pid: pid
            })
        }
    }

    programNotRunning() {
        this.transition(State.PROGRAM_NOT_RUNNING)
    }

    gameStarted() {
        if (this.current() == State.GAME_FINISHED || this.current() == State.PROGRAM_RUNNING || this.current() == State.PROGRAM_NOT_RUNNING) {
            this.transition(State.GAME_STARTED)
        }
    }

    gamePast90Seconds(saveFile) {
        if (this.current() == State.GAME_STARTED) {
            this.transition(State.GAME_PAST90SECONDS, saveFile)
        }
    }

    gameFinished(replayFile) {
        if (this.current() == State.GAME_STARTED || this.current() == State.GAME_PAST90SECONDS) {
            this.transition(State.GAME_FINISHED, replayFile)
        }
    }
}

const state = new State()

let psLoop = null

function scan(pollFrequencyInactive, pollFrequencyActive) {
    ps().then((processes) => {
        let active = false
        for (let p in processes) {
            const process = processes[p]

            if (process.name == dirs.binary) {
                active = true
                state.programRunning(process.pid)
            }
        }

        if (!active && state.current() != State.PROGRAM_NOT_RUNNING) {
            state.programNotRunning()
        }

        psLoop = setTimeout(scan, state.current() === State.PROGRAM_NOT_RUNNING ?
            pollFrequencyInactive : pollFrequencyActive
        )
    })
}

let watcher
function game() {
    watcher = chokidar.watch([dirs.lobby, dirs.account], {
        persistent: true,
        ignorePermissionErrors: true
    })

    console.log(dirs.lobby, dirs.account)

    watcher.on('ready', () => {
        watcher.on('add', (file) => {
            console.log(file)
            const ext = path.extname(file)

            if (ext === '.StormReplay') {
                state.gameFinished(file)
            } else if (ext === '.StormSave') {
                state.gamePast90Seconds(file)
            }
            if (path.win32.basename(file) === 'replay.tracker.events') {
                state.gameStarted()
            }
        })
    })
}

state.watch = (pollFrequencyInactive = HEROTOOLS_POLL_FREQ_INACTIVE, pollFrequencyActive = HEROTOOLS_POLL_FREQ_ACTIVE) => {
    game()
    scan(pollFrequencyInactive, pollFrequencyActive)

    return state
}

state.unwatch = () => {
    if (psLoop) {
        clearTimeout(psLoop)
    }
    watcher.close()
    watcher = null

    return state
}

module.exports = state