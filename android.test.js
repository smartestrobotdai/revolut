const {buy, sell} = require('./android')
const {sleep, logger} = require('./util')

async function test() {
    const price = await buy('MSFT', 1000, 229, isTest=true)
    console.log(`bought msft with price: ${price}`)
    await sleep(3000)

    const res2 = await buy('MSFT', 100000, 229, isTest=true)
    console.log(`not enough balance ${res2}`)
    await sleep(3000)

    // const price2 = await sell('LMT')
    // console.log(`bsold lmt with price: ${price2}`)

}

test()


