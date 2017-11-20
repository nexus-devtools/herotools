const replays = require('./replays')
const MPQArchive = require('mpyqjs/mpyq').MPQArchive;
const protocol29406 = require('./protocol29406')

replays.list().then((files) => {
    let file = files[0]

    console.log(file)
    let archive = new MPQArchive(file)


    let header = protocol29406.decodeReplayHeader(archive.header.userDataHeader.content)


    console.log(header.m_version.m_baseBuild)
})
