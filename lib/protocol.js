const MPQArchive = require('mpyqjs/mpyq').MPQArchive;
const protocol29406 = require('./protocols/protocol29406')
const port = require('./protocols/port')
const path = require('path')
const fs = require('fs')
const https = require('https')

const HEADER = exports.HEADER = 'header'
const DETAILS = exports.DETAILS = 'replay.details'
const INITDATA = exports.INITDATA = 'replay.initdata'
const GAME_EVENTS = exports.GAME_EVENTS = 'replay.game.events'
const MESSAGE_EVENTS = exports.MESSAGE_EVENTS = 'replay.message.events'
const TRACKER_EVENTS = exports.TRACKER_EVENTS = 'replay.tracker.events'
const ATTRIBUTES_EVENTS = exports.ATTRIBUTES_EVENTS = 'replay.attributes.events'

const decoderMap = {
    [HEADER]: 'decodeReplayHeader',
    [DETAILS]: 'decodeReplayDetails',
    [INITDATA]: 'decodeReplayInitdata',
    [GAME_EVENTS]: 'decodeReplayGameEvents',
    [MESSAGE_EVENTS]: 'decodeReplayMessageEvents',
    [TRACKER_EVENTS]: 'decodeReplayTrackerEvents',
    [ATTRIBUTES_EVENTS]: 'decodeReplayAttributesEvents'
}

exports.generatedPath = path.join(__dirname, '/protocols/generated')

const versions = {}
function loadProtocol(version) {
    if (versions.hasOwnProperty(version)) {
        return versions[version]
    }

    try {
        versions[version] = require(path.join(exports.generatedPath, `/${version}.js`))

        return versions[version]
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return false
        } else {
            throw err
        }
    }
}

function download(version) {
    let url = `https://raw.githubusercontent.com/Blizzard/heroprotocol/master/protocol${version}.py`

    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            if (resp.statusCode === 200) {
                let result = ''
                resp.setEncoding('utf8')

                resp.on('data', (chunk) => {
                    result += chunk;
                })

                resp.on('end', () => {
                    resolve(result)
                })
            } else {
                reject(`Protocol version ${version} not supported`)
            }
        })
    })
}

function getDecoder(replay, version) {
    return new Promise((resolve, reject) => {
        let proto = loadProtocol(version)

        if (proto) {
            return resolve(proto)
        }

        download(version).then((src) => {
            js = port(src, version)

            fs.writeFile(path.join(exports.generatedPath, `/${version}.js`), js, (err) => {
                if (err) {
                    return reject(err)
                }

                resolve(loadProtocol(version))
            })
        })
    })
}

const parseStrings = function parseStrings(data) {
    if (!data) {
        return data
    } else if (data instanceof Buffer) {
        return data.toString()
    } else if (Array.isArray(data)) {
        return data.map(item => parseStrings(item))
    } else if (typeof data === 'object') {
        for (let key in data) {
            data[key] = parseStrings(data[key])
        }
    }
    return data
}

class Protocol {
    constructor(replay) {
        this.replay = replay
        this.archive = new MPQArchive(replay)
        this.version = protocol29406.decodeReplayHeader(this.archive.header.userDataHeader.content).m_version.m_baseBuild
        this.data = {}
    }

    decode(part) {
        let parts = part ? [part] : Object.keys(decoderMap)

        return new Promise((resolve, reject) => {
            let result = {}

            getDecoder(this.replay, this.version).then((decoder) => {
                for (let piece of parts) {
                    if (this.data.hasOwnProperty(piece)) {
                        result[piece] = this.data[piece]
                    } else {
                        this.data[piece] = result[piece] = decoder[decoderMap[piece]](this.archive.readFile(piece))
                    }    
                }
                resolve(this.data[part])
            })
        })
    }

}


exports.Protocol = Protocol