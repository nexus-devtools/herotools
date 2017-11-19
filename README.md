# Hero Tools

This is a set of utility functions for Heroes of the Storm I've written for node or electron apps. These tools were primarily developed for another project I am working on (HotSTube). 

### Contents
- Replays
- Game paths
- Game state watcher
- Automatically updating protocol decoder

## Replays

### Methods

#### list(files = [])

Returns a promise which resolves all replays in the default Heroes of the Storm replay directories sorted by creation date. 

```js
const replays = require('hotstools').replays

replays.list((files) => {
  console.log(files)
})
```

#### onNewReplay

Execute a callback when a new replay is added to one of the default Heroes of the Storm replay directories. This can also be used as an indicator of a recently completed game. 

```js
const replays = require('hotstools').replays
const path = require('path')

replays.onNewReplay = (file) => {
    console.log('Replay for ' + path.basename(file, '.StormReplay') + ' added.')
}
```

Setting `replay.onNewReplay = null` will remove the callback and clear out any filesystem watchers.

## Game Paths

Get relevant default game directories based on operating system. The account path contains battle.net account login folders, replays, saves, etc. The lobby path is the temporary folder Blizzard uses during a game to write replay information. The binary is the executable file name that appears on the operating system process list for Heroes of the Storm. 

```js
const paths = require('hotstools').paths

console.log(paths)
// Windows:  
{ account: 'C:\\Users\\Andy\\Documents\\Heroes of the Storm\\Accounts',
  lobby: 'C:\\Users\\Andy\\AppData\\Local\\Temp\\Heroes of the Storm',
  binary: 'HeroesOfTheStorm_x64.exe' }

// Mac:
{ account: '/Users/andybaird/Library/Application Support/Blizzard/Heroes of the Storm/Accounts',
  lobby: '/Users/andybaird/Library/Caches/TemporaryItems/Blizzard/Heroes of the Storm',
  binary: 'Heroes' }
```

## Game state watcher
The game state watcher is a finite state machine that will emit different events indicating the lifecycle of Heroes of the Storm. This object extends node's EventEmitter. 

### Methods

#### watch(pollFrequencyInactive, pollFrequencyActive)

This method begins observing file system and operating system process list changes to determine the game state. After executing this method event listeners should be registered to respond to different game states. 

```js
const state = require('hotstools').state

// Start watching for changes in the game lifecycle
let watcher = state.watch()

watcher.on('PROGRAM_RUNNING', (pid) => {
  console.log('Heroes of the Storm is now running')
})
```

### Events

There are five lifecycle states emitted as events:

#### PROGRAM_NOT_RUNNING 

This indicates the HotS application is not running. The operating system process list is polled at different intervals to determine if Heroes of the Storm is running or not. If it is not, this event will be fired.

Note that the program state is polled for every 5 seconds if the game is not running and every 30 seconds if it is running. Program state is polled for more infrequently if the program is running to reduce CPU usage during a game. 

The polling rate can be changed by passing the two rates into the watch() function or setting the following environment variables:

```
HEROTOOLS_POLL_FREQ_ACTIVE=30000
HEROTOOLS_POLL_FREQ_INACTIVE=5000
```

#### PROGRAM_RUNNING

This indicates the HotS application is running. This event is also fired by polling the operating system process list and all notes in the above event apply to this event. 

#### GAME_STARTED

This indicates that a HotS game has been started. Game starts are detected by the "replay.tracker.events" file that is created in the battle lobby temporary directory. A game is considered to be started as soon as the loading screen begins.

#### GAME_PAST90SECONDS 

This indicates that the in-game clock has reached 90 seconds. At the 90 second mark, a .StormSave file is created in the account saves directory. This event is important because it can be used to reconcile the actual in game time and separate the time spent at the loading screen.

#### GAME_FINISHED 

This indicates that a game is finished. This is detected by the addition of a new replay file in an account replays directory. 