//com.opt.supremapoker
const Promise = require('bluebird')
const adb = require('adbkit')
const client = adb.createClient()
const fs = require('fs')
const tesseract = require("node-tesseract-ocr")
const sharp = require('sharp')
const Jimp = require("jimp")
const axios = require("axios").default
const mode = "prod"

const util = require('util')
const exec = util.promisify(require('child_process').exec)

const sleep = (ms) => { //ok
    return new Promise(resolve => setTimeout(resolve, ms));
}

const compareImages = async (origin, compare) => { //ok
    const readOrigin = await Jimp.read(origin)
    const readCompare = await Jimp.read(compare)
    const hashOrigin = readOrigin.hash()
    const hashCompare = readCompare.hash()
    const distance = Jimp.distance(readOrigin, readCompare)
    const diff = Jimp.diff(readOrigin, readCompare)
    //if (hashOrigin !== hashCompare || distance > 0.15 || diff > 0.15) {
    if (distance > 0.15 || diff > 0.15) {
        return false
    } else {
        return true
    }
}

async function checkPlayers() {
    return client.listDevices().then(async ([device]) => {
        await client.shell(device.id, `input tap 230 1480`)
        await sleep(30000)
        return await client.screencap(device.id).then(async (screencap) => {
            const stream = await screencap.pipe(fs.createWriteStream(`./tmp.png`))
            return new Promise(async (resolve, reject) => {
                stream.on('finish', async () => {
                    await sharp(`tmp.png`).extract({ width: 600, height: 100, left: 50, top: 1280 }).toFile('tmpHome.png');
                    const result = await compareImages("tmpHome.png", "validHome.png");
                    switch (result) {
                        case true: {
                            await client.shell(device.id, `input tap 230 1480`)
                            await sleep(60000)
                            checkPlayers()
                            resolve(true)
                            break
                        }
                        default: {
                            await client.shell(device.id, `input tap 480 1280`)
                            await sleep(180000)
                            await client.shell(device.id, `input tap 230 1480`)
                            await sleep(60000)
                            checkPlayers()
                            resolve(true)
                        }
                    }
                })
            })
        }).catch((e) => {
            console.log(e)
            return false
        })
    })
}

checkPlayers()