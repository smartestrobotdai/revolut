const {buy, sell} = require('./android')
const {sleep, logger} = require('./util')

async function test() {
    //await buy('MSFT', 1000, 229, isTest=true)
    //await sleep(1000)
    await sell('LMT')
}

test()


