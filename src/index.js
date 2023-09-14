/* global Helia, BlockstoreCore, DatastoreCore, HeliaUnixfs */


const statusValueEl = document.getElementById('statusValue')
const discoveredPeerCountEl = document.getElementById('discoveredPeerCount')
const connectedPeerCountEl = document.getElementById('connectedPeerCount')
const nodeIdEl = document.getElementById('nodeId')

document.addEventListener('DOMContentLoaded', async () => {
    const helia = window.helia = await instantiateHeliaNode()
    window.heliaFs = await HeliaUnixfs.unixfs(helia)

    helia.libp2p.addEventListener('peer:discovery', (evt) => {
        window.discoveredPeers.set(evt.detail.id.toString(), evt.detail)
    })

    setInterval(() => {
        statusValueEl.innerHTML = helia.libp2p.isStarted() ? 'Online' : 'offline'
        updateConnectedPeers()
        updateDiscoveredPeers()
    }, 500)

    const id = await helia.libp2p.peerId.toString()

    nodeIdEl.innerHTML = id


    addFile().then(async (cid) => {
        await catFile(cid)
    })

    const d = await HeliaDagJson.dagJson(helia)
   // console.log(d)

    const object1 = { hello: 'world' }
    const myImmutableAddress1 = await d.add(object1)

    const object2 = { link: myImmutableAddress1 }
    const myImmutableAddress2 = await d.add(object2)

    const retrievedObject = await d.get(myImmutableAddress2)
    console.log(retrievedObject)
    // { link: CID(baguqeerasor...) }

    console.log(await d.get(retrievedObject.link))
    // { hello: 'world' }

})

let heliaInstance = null

const instantiateHeliaNode = async () => {
    // application-specific data lives in the datastore
    const datastore = new DatastoreCore.MemoryDatastore()
    //const blockstore = new BlockstoreCore.MemoryBlockstore()

    //const datastore = new DatastoreIdb.IDBDatastore()
    const blockstore = new BlockstoreIdb.IDBBlockstore()
    await blockstore.open()

    if (heliaInstance != null) {
        return heliaInstance
    }

    heliaInstance = await Helia.createHelia({
        datastore,
        blockstore
    })

    return heliaInstance
}

const updateConnectedPeers = () => {
    const peers = window.helia.libp2p.getPeers()
    connectedPeerCountEl.innerHTML = peers.length
}

window.discoveredPeers = new Map()

const updateDiscoveredPeers = () => {
    discoveredPeerCountEl.innerHTML = window.discoveredPeers.size
}

async function addFile() {
    const textEncoder = new TextEncoder()
    const cid = await heliaFs.addFile({ content: textEncoder.encode('Do not go gentle into that good night. rage. rage against the dying of the light') })
    console.log('successfully stored', cid.toString())
    return cid.toString()
}

async function catFile(cid) {
    const textDecoder = new TextDecoder()
    for await (const data of heliaFs.cat(cid)) {
        console.log(textDecoder.decode(data))
        console.log("successfully catttted the data stored previously")
    }
}