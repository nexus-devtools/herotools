const replays = require('./lib/replays')

replays.list().then((files) => {
    let file = files[0]

    let archive = new MPQArchive(file)


    let header = protocol29406.decodeReplayHeader(archive.header.userDataHeader.content)


    console.log(header.m_version.m_baseBuild)
})
