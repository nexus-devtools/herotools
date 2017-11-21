const account = require('./paths').account
const glob = require('glob')
const fs = require('fs')

function list() {
    const dir = account + '/**/*.StormReplay'

    return new Promise((resolve, reject) => {
        glob(dir, (err, files) => {
            if (err) {
                reject(err)
            }

            files = files.map((file) => {
                return { 
                    time: fs.statSync(file).mtime.getTime(), 
                    path: file 
                }
            }).sort((a,b) => b.time - a.time)

            resolve(files.map((file) => file.path))
        })
    })
}

let watcher

const replays = {
    list: list,
    set onNewReplay(callback) {
        if (callback === null) {
            if (watcher) {
                watcher.close()
                watcher = null
            }
            
            return
        }
    
        watcher = chokidar.watch(account, {
            persistent: true,
            awaitWriteFinish: true,
            ignorePermissionErrors: true
        }).on('ready', () => {
            this.on('add', (file) => {
                const ext = path.extname(file)
    
                if (ext === '.StormReplay') {
                    callback(file)
                }
            })
        })
    }
}

module.exports = replays