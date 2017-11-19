const os = require('os')
const path = require('path')

let lobby, account, binary

if (os.platform() == 'win32') {
    account = path.join(os.homedir(),'Documents','Heroes of the Storm','Accounts')
    lobby  = path.join(os.tmpdir(),'Heroes of the Storm')
    binary = 'HeroesOfTheStorm_x64.exe'
} else if (os.platform() == 'darwin') {
    account = path.join(os.homedir(),'Library','Application Support','Blizzard','Heroes of the Storm','Accounts')
    lobby = path.join(os.homedir(),'Library','Caches','TemporaryItems','Blizzard','Heroes of the Storm')
    binary = 'Heroes'
} else {
    throw new Error(os.platform() + ' is unsupported')
}

module.exports = {
    account: account,
    lobby: lobby,
    binary: binary
}