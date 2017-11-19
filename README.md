# Hero Tools

This is a set of utility functions for Heroes of the Storm I've written for node or electron apps. These tools were primarily developed for another project I am working on (HotSTube). 

### Contents
- Replays
- Game Path
- Game state watcher
- Automatically updating protocol decoder

## Replays

### list()

Returns a promise which resolves all replays in the default Heroes of the Storm replay directories sorted by creation date. 

```js
const replays = require('hotstools').replays

replays.list((files) => {
  console.log(files)
})
```

### onNewReplay()

Execute a callback when a new replay is added to one of the default Heroes of the Storm replay directories. This can also be used as an indicator of a recently completed game. 

```js
const replays = require('hotstools').replays
const path = require('path')

replays.onNewReplay = (file) => {
    console.log('Replay for ' + path.basename(file, '.StormReplay') + ' added.')
}
```

## Game Paths

Get relevant default game directories based on operating system. The account path contains battle.net account login folders, replays, saves, etc. The lobby path is the temporary folder Blizzard uses during a game to write replay information. The binary is the executable file name that appears on the operating system process list for Heroes of the Storm. 

```js
const paths = require('hotstools').paths

console.log(paths)
// Windows:  

// Mac:
{ account: '/Users/andybaird/Library/Application Support/Blizzard/Heroes of the Storm/Accounts',
  lobby: '/Users/andybaird/Library/Caches/TemporaryItems/Blizzard/Heroes of the Storm',
  binary: 'Heroes' }
```

## Game state watcher
The game state watcher is a finite state machine that will emit different events indicating the lifecycle of Heroes of the Storm. There are five lifecycle states emitted as events:

* PROGRAM_NOT_RUNNING 
* PROGRAM_RUNNING
* GAME_RUNNING 
* GAME_PAST90SECONDS 
* GAME_FINISHED 

```js
const state = require('hotstools').state

// Start watching for changes in the game lifecycle
let watcher = state.watch()

watcher.on(')

```