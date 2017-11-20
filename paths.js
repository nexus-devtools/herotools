const os = require('os')
const path = require('path')

let lobby, account, binary

const paths = {
    win32: {
        account: [...os.homedir().split(path.sep),'Documents','Heroes of the Storm','Accounts'],
        lobby: [...os.tmpdir().split(path.sep),'Heroes of the Storm'],
        binary: 'HeroesOfTheStorm_x64.exe'
    },
    darwin: {
        account: [...os.homedir().split(path.sep),'Library','Application Support','Blizzard','Heroes of the Storm','Accounts'],
        lobby: [...os.homedir().split(path.sep),'Library','Caches','TemporaryItems','Blizzard','Heroes of the Storm'],
        binary: 'Heroes'
    }
}

module.exports = {
    get arrays() {
        return paths[os.platform()]
    },

    get account() {
        return path.join(...paths[os.platform()].account)
    },

    get lobby() {
        return path.join(...paths[os.platform()].lobby)
    },

    get binary() {
        return paths[os.platform()].binary
    }
}