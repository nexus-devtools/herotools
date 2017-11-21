// Shamelessly ripped from https://github.com/nydus/heroprotocol/blob/master/postinstall.js
// Mostly just rearranged the functions so persistence logic can be hooked into more easily

const fs = require('fs')

const types = {
    tuple: function (str) {
        return str.match(/(-?\w+)/g)
    },
    tuples: function (str) {
        return str.match(/(\(.*?\))/g)
    },
    _int: {
        decode: function (str) {
            const ret = {}
            const res = types.tuple(str)
            ret.bounds = [res[0], res[1]]
            return ret
        },
        encode: function (infos) {
            return `[${infos.bounds[0]}, ${infos.bounds[1]}]`
        }
    },
    _choice: {
        decode: function (str) {
            const ret = {
                bounds: [],
                choices: []
            }
            let res = types.tuples(str)

            Object.assign(ret, types._int.decode(res[0]))
            for (let i = 1; i < res.length; i += 1) {
                const tuple = types.tuple(res[i])
                ret.choices.push({
                    label: tuple[0],
                    typeIndex: tuple[1]
                })
            }
            return ret
        },
        encode: function (infos) {
            return `[${infos.bounds[0]}, ${infos.bounds[1]}], { ${infos.choices.map((choice, index, ar) => {
            return `${index}: ['${choice.label}', ${choice.typeIndex}]${(index === ar.length - 1) ? '' : ', '}`
        }).join('')}}`
        }
    },
    _struct: {
        decode: function (str) {
            const ret = {
                items: []
            }
            const tuples = types.tuples(str)
            if (tuples) {
                tuples.forEach(tuple => {
                    tuple = types.tuple(tuple)
                    ret.items.push({
                        label: tuple[0],
                        typeIndex: tuple[1],
                        tag: tuple[2]
                    })
                })
            }
            return ret
        },
        encode: function (infos) {
            return `[${infos.items.map((item, index, ar) => {
            return `['${item.label}', ${item.typeIndex}, ${item.tag}]${(index === ar.length - 1) ? '' : ', '}`
        }).join('')}]`
        }
    },
    _blob: {
        decode: function (str) {
            return types._int.decode(str)
        },
        encode: function (infos) {
            return types._int.encode(infos)
        }
    },
    _bool: {
        decode: function (str) {
            return {}
        },
        encode: function (infos) {
            return ''
        }
    },
    _array: {
        decode: function (str) {
            return Object.assign({
                    typeIndex: str.match(/\d+$/)[0]
                },
                types._int.decode(str)
            )
        },
        encode: function (infos) {
            return `[${infos.bounds[0]}, ${infos.bounds[1]}], ${infos.typeIndex}`
        }
    },
    _optional: {
        decode: function (str) {
            return {
                typeIndex: Number(str)
            }
        },
        encode: function (infos) {
            return `${infos.typeIndex}`
        }
    },
    _fourcc: {
        decode: function (str) {
            return {}
        },
        encode: function (infos) {
            return ''
        }
    },
    _bitarray: {
        decode: function (str) {
            return types._int.decode(str)
        },
        encode: function (infos) {
            return types._int.encode(infos)
        }
    },
    _null: {
        decode: function (str) {
            return {}
        },
        encode: function (infos) {
            return ''
        }
    }
}

const tokens = {
    newline: '\n',
    indent: '  ',
    typeinfosStart: 'typeinfos = [',
    typeinfosEnd: ']',
    gameeventsStart: 'game_event_types = {',
    gameeventsEnd: '}',
    messageeventsStart: 'message_event_types = {',
    messageeventsEnd: '}',
    trackereventsStart: 'tracker_event_types = {',
    trackereventsEnd: '}',
    gameeventsTypeid: 'game_eventid_typeid =',
    messageeventsTypeid: 'message_eventid_typeid =',
    trackereventsTypeid: 'tracker_eventid_typeid =',
    headerTypeid: 'replay_header_typeid =',
    detailsTypeid: 'game_details_typeid =',
    initdataTypeid: 'replay_initdata_typeid ='
}

function parseEvent(str) {
    const res = str.match(/^(\d+):\s\((\d+),\s\'(.*)\'/)
    return {
        key: res[1],
        typeIndex: res[2],
        name: res[3]
    }
}

function parseTypeinfos(str) {
    const typeRegex = /^\('(.*?)',\[(.*)\]\),\s*#(\d+)$/
    const infos = {
        str: str
    }
    const res = typeRegex.exec(str)

    infos.type = res[1]
    Object.assign(infos, types[infos.type].decode(res[2]))
    infos.index = res[3]

    return infos
}

let version, typeinfos, gameeventsTypes, messageeventsTypes, trackereventstypes, 
    gameeventsTypeid, messageeventsTypeid, trackereventsTypeid, headerTypeid,
    detailsTypeid, initdataTypeid

function tokenize(src) {
    const lines = src.split(tokens.newline)
    
    let line = 0,
        str

    typeinfos = []
    gameeventsTypes = []
    messageeventsTypes = []
    trackereventstypes = []
    
    while (line < lines.length) {
        str = lines[line].trim()

        if (str === tokens.typeinfosStart) {
            line += 1
            str = lines[line].trim()
            do {
                typeinfos.push(parseTypeinfos(str))
                line += 1
                str = lines[line].trim()
            } while (str !== tokens.typeinfosEnd)
        } else if (tokens.gameeventsStart === str) {
            line += 1
            str = lines[line].trim()
            do {
                gameeventsTypes.push(parseEvent(str))
                line += 1
                str = lines[line].trim()
            } while (tokens.gameeventsEnd !== str)
        } else if (tokens.messageeventsStart === str) {
            line += 1
            str = lines[line].trim()
            do {
                messageeventsTypes.push(parseEvent(str))
                line += 1
                str = lines[line].trim()
            } while (tokens.messageeventsEnd !== str)
        } else if (tokens.trackereventsStart === str) {
            line += 1
            str = lines[line].trim()
            do {
                trackereventstypes.push(parseEvent(str))
                line += 1
                str = lines[line].trim()
            } while (tokens.trackereventsEnd !== str)
        } else if (str.startsWith(tokens.gameeventsTypeid)) {
            gameeventsTypeid = str.match(/\d+/)[0]
        } else if (str.startsWith(tokens.messageeventsTypeid)) {
            messageeventsTypeid = str.match(/\d+/)[0]
        } else if (str.startsWith(tokens.trackereventsTypeid)) {
            trackereventsTypeid = str.match(/\d+/)[0]
        } else if (str.startsWith(tokens.headerTypeid)) {
            headerTypeid = str.match(/\d+/)[0]
        } else if (str.startsWith(tokens.detailsTypeid)) {
            detailsTypeid = str.match(/\d+/)[0]
        } else if (str.startsWith(tokens.initdataTypeid)) {
            initdataTypeid = str.match(/\d+/)[0]
        }

        line += 1
    }
}

function template() {
    let out = fs.readFileSync(__dirname + '/protocol.js.template', 'utf8')

    out = out.replace('${date}', new Date().toUTCString())
    out = out.replace('${version}', version)
    out = out.replace('${decodersPath}', __dirname + '/decoders.js')

    const mapEventArray = (event, index, ar) => {
        let str = tokens.indent
        
        str += `${event.key}: [${event.typeIndex}, \'${event.name}\']`
        str += index === ar.length - 1 ? '' : ','

        return str
    }
    out = out.replace('${typeinfos}', typeinfos.map((infos, index, ar) => {
        let str = tokens.indent

        str += `['${infos.type}', [`
        str += types[infos.type].encode(infos)
        str += `]]${index === (ar.length - 1) ? '' : ','}`
        str += `  //${infos.index}`

        return str
    }).join(tokens.newline))


    out = out.replace('${gameeventsTypes}', gameeventsTypes.map(mapEventArray).join(tokens.newline))
    out = out.replace('${messageeventsTypes}', messageeventsTypes.map(mapEventArray).join(tokens.newline))
    out = out.replace('${trackereventstypes}', trackereventstypes.map(mapEventArray).join(tokens.newline))
    out = out.replace('${gameeventsTypeid}', gameeventsTypeid)
    out = out.replace('${messageeventsTypeid}', messageeventsTypeid)
    out = out.replace('${trackereventsTypeid}', trackereventsTypeid)
    out = out.replace('${headerTypeid}', headerTypeid)
    out = out.replace('${detailsTypeid}', detailsTypeid)
    out = out.replace('${initdataTypeid}', initdataTypeid)

    return out
}

module.exports = (src, vers) => {
    version = vers

    tokenize(src)

    return template()
}