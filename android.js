const wdio = require("webdriverio")
const {sleep, logger} = require('./util')
const assert = require("assert");

let client = null

process.on('SIGINT', async function() {
  logger.info('SIGINT Received - trying to delete session');
  try {
    client && client.deleteSession()
  } catch (e) {
    logger.error(e)  
  }
  process.exit()
})

const opts = {
    path: '/wd/hub',
    port: 4723,
    capabilities: {
      platformName: "Android",
      platformVersion: "12",
      deviceName: "RFCRC0R00XD",
      //app: "https://github.com/appium/appium/raw/1.x/sample-code/apps/ApiDemos-debug.apk",
      //appPackage: "io.appium.android.apis",
      appPackage: "com.revolut.revolut",
      appActivity: "com.revolut.ui.login.pin.LoginActivity",
      automationName: "UiAutomator2",
      noReset: true
    }
  }
  
  findElementWithIdAndText = async function(id, text) {
    items = await client.findElements('id', id)
    for (item of items) {
      const myText = await client.getElementText(item.ELEMENT)
      if (myText == text) {
          return item
      }
    }
    return null
  }
  
  findElementWithIdAndIndex = async function(id, index) {
    const items = await client.findElements('id', id)
    if (Array.isArray(items) && items.length > index) {
      return items[index]
    }
    return null
  }
  
  findElementWithClassAndIndex = async function(class_, index) {
    const items = await client.findElements('className', class_)
    if (Array.isArray(items) && items.length > index) {
      return items[index]
    }
    return null
  }
  
  findElementWithId = async function(id) {
    const item = await client.findElement('id', id)
    return item
  }
  
  findElementWithXPath = async function(xpath) {
    const item = await client.findElement('xpath', xpath)
    return item
  }
  
  findElementsWithXPath = async function(xpath) {
    const item = await client.findElements('xpath', xpath)
    return item
  }
  
  waitUntilNew = async function(func, ...args) {
    const result = await client.waitUntil((async () => {
      res = null
      try {
        res = await func(...args)
        return res !== null && !res.error && (!Array.isArray(res) || res.length > 0)
      } catch (error) {
        return false
      }
    }), {
      timeout: 10000,
      timeoutMsg: 'expected text to be different after 5s'
    })
    return res || result
  }
  
  toStock = async function () {
    field = await waitUntilNew(findElementWithId, 'com.revolut.revolut:id/internalViewKeypadView_button0')
    await client.elementClick(field.ELEMENT)
    field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button5')
    await client.elementClick(field.ELEMENT)
    field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button1')
    await client.elementClick(field.ELEMENT)
    field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button1')
    await client.elementClick(field.ELEMENT)
    await sleep(500) // Don't remove
    stockEl = await waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/tabText', 'Stocks')
    await client.elementClick(stockEl.ELEMENT)
  }
  


async function buy(name, amount, price, isTest=true) {
    client = await wdio.remote(opts)
    await sleep(1000)
    await toStock(client)
    await sleep(500)
    investEl = await waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/actionText', 'Invest')
    await client.elementClick(investEl.ELEMENT)
    await sleep(500)
    //searchMenuItems = await client.findElements('id', 'com.revolut.revolut:id/navBarMenuItem_icon')
    searchMenuItems = await waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/navBarMenuItem_icon', 1)
    await client.elementClick(searchMenuItems.ELEMENT)
    await sleep(500)
    searchBar = await waitUntilNew(findElementWithId, 'com.revolut.revolut:id/searchView_search')
    await client.elementSendKeys(searchBar.ELEMENT, name)
    await sleep(500)
    stock = await waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/row_root', 0)
    stockLabel = await client.findElementFromElement(stock.ELEMENT, 'id', 'com.revolut.revolut:id/subtitle')
    //stockLabel = await stock.findElement('id', 'com.revolut.revolut:id/subtitle')
    stockLabelText = await client.getElementText(stockLabel.ELEMENT)
    assert(stockLabelText.includes(name))
    await client.elementClick(stock.ELEMENT)
    await sleep(500)
    buyBar = await waitUntilNew(findElementWithId, 'com.revolut.revolut:id/actionsRecyclerView')
    buy = await client.findElementsFromElement(buyBar.ELEMENT, 'class name', 'android.view.ViewGroup')
  
    // verify the button is buy button
    buyLabel = await client.findElementFromElement(buy[0].ELEMENT, 'id',  'com.revolut.revolut:id/actionText')
    buyLabelText = await client.getElementText(buyLabel.ELEMENT)
    assert(buyLabelText === 'Buy')
    //buy = await findElementWithClassAndIndex('android.view.ViewGroup', 0)
    //buy = await client.findElement('xpath', '//')
    //buy = await client.findElement('#com.revolut.revolut:id/actionsRecyclerView.android.view.ViewGroup')
    
    await client.elementClick(buy[0].ELEMENT)
    //com.revolut.revolut:id/actionsRecyclerView
    //await sleep(500)
    amountInput = await waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/amountEdit_amountInputText', 1)
    //amountInputs = await client.findElements('id', 'com.revolut.revolut:id/amountEdit_amountInputText')
    await client.elementSendKeys(amountInput.ELEMENT, amount.toString())
    buyBtn = await client.findElement('id', 'com.revolut.revolut:id/next_button')
    await client.elementClick(buyBtn.ELEMENT)
    
    await sleep(500)
    priceLabel = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\' and contains(@text, \'${name}\')]`)
    priceText = await client.getElementText(priceLabel.ELEMENT)
    logger.info(priceText)  // 1 AAPL = $147.62
  
    const re = /\$(\d.+)/
    const latestPrice = +re.exec(priceText)[1]
    if (latestPrice > price) {
      logger.info(`missed buy opportunity, required price: ${price}, actual price: ${latestPrice}`)
      return
    }
  
    commisionFreeLabel = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/cellDetailsText_endLabel\' and contains(@text, \'out of\')]')
    commisionFreeText = await client.getElementText(commisionFreeLabel.ELEMENT) // 9 out of 10
    logger.info(commisionFreeText)
  
    const re2 = /(\d) out of/
    const leftCommisionFreeTimes = re2.exec(commisionFreeText)[1]
    if (leftCommisionFreeTimes <= 1) {
      logger.info(`Left commision free times <= 1, aborting...`)
      return
    }
  
    dayTradesLeft = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\' and contains(@text, \'out of\')]')
    dayTradesLeftText = await client.getElementText(dayTradesLeft.ELEMENT) // 3 out of 3
    logger.info(dayTradesLeftText)
  
    const submitBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')
  
    if (!isTest) {
      await client.elementClick(submitBtn.ELEMENT)
  
      // write to temperary file
      
    }
    await client.deleteSession()
  }
  
  async function sell(name, isTest=true) {
    client = await wdio.remote(opts)
    await sleep(1000)
    await toStock(client)
    await sleep(500) // CANNOT REMOVE!
    // get current stock
    //investments = await client.findElements('xpath', '//*[@class=\'android.view.ViewGroup\' and preceding-sibling::*[@resource-id=\'com.revolut.revolut:id/listSubheader_container\']]')
  
    investments = await waitUntilNew(findElementsWithXPath, '//*[@class=\'android.view.ViewGroup\' and @resource-id=\'com.revolut.revolut:id/row_root\' and count(preceding-sibling::*[@resource-id=\'com.revolut.revolut:id/listSubheader_container\'])=1]')
    for (investment of investments) {
      await client.elementClick(investment.ELEMENT)
      stockName = await waitUntilNew(findElementWithXPath, '//*[@class=\'android.widget.TextView\' and @resource-id=\'com.revolut.revolut:id/headerLayout_descriptionText\']')
      stockNameText = await client.getElementText(stockName.ELEMENT)
      logger.info(stockNameText)
      regex = /[A-Z0-9\.]+/
      stockId = stockNameText.match(regex)[0]
      if (stockId === name) {
        const sellBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/actionsRecyclerView\' and @class=\'androidx.recyclerview.widget.RecyclerView\']/*[@class=\'android.view.ViewGroup\' and @index=\'1\']')
        await client.elementClick(sellBtn.ELEMENT)
  
        await sleep(500)
        const ownedLabel = await waitUntilNew(findElementWithXPath, '//*[@resource-id=\'com.revolut.revolut:id/amountEdit_startHintContainer\' and @class=\'android.widget.RelativeLayout\' and @index=\'2\']')
        await client.elementClick(ownedLabel.ELEMENT)
        const sellBtn2 = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')
        await client.elementClick(sellBtn2.ELEMENT)
        await sleep(500)
  
        //check price
        priceLabel = await waitUntilNew(findElementWithXPath, '//*[@class=\'android.view.ViewGroup\' and @index=\'4\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\']')
        priceText = await client.getElementText(priceLabel.ELEMENT)
        logger.info(priceText)  // 1 AAPL = $147.62
  
        const submitBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')
  
        if (!isTest) {
          await client.elementClick(submitBtn.ELEMENT)
          
        }
        break
      }    
    }
    await client.deleteSession()
  }

  module.exports = {
    buy, sell
  }