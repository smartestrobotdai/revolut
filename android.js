const wdio = require("webdriverio")
const {sleep, logger, getStockNameById} = require('./util')
const assert = require("assert");
const { exec } = require("child_process");

let client = null

// no retry
const FAILED_PERMANENT=-1

// try again
const FAILED_SHORT_TIME=-2

// sleep 1 hour
const FAILED_LONG_TIME=-3

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
    platformVersion: "11",
    deviceName: "D0AA002185J91230382",
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
  field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button0')
  await client.elementClick(field.ELEMENT)
  await sleep(500) // Don't remove
  stockEl = await waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/tabText', 'Stocks')
  await client.elementClick(stockEl.ELEMENT)
}

getPriceFromLabelText = function(text) {
  const re = /\$(\d.+)/
  const latestPrice = +re.exec(text)[1]
  return latestPrice
}

checkBalance = async function(client) {
      //investments = await client.findElements('xpath', '//*[@class=\'android.view.ViewGroup\' and preceding-sibling::*[@resource-id=\'com.revolut.revolut:id/listSubheader_container\']]')
  // 
  const usdBalancePath = '//*[@class=\'android.widget.TextView\' and @resource-id=\'com.revolut.revolut:id/valuePrimary\' and count(preceding-sibling::*[@resource-id=\'com.revolut.revolut:id/title\' and contains(@text, \'USD\')])=1]'
  let eleBalance = await client.findElement('xpath', usdBalancePath)
  if (!eleBalance || eleBalance.error) {
    // scroll down
    await client.touchAction([
      { action: 'press', x: 200, y: 1200 },
      { action: 'moveTo', x: 200, y: 800 },
      'release'
    ])
    eleBalance = await waitUntilNew(findElementWithXPath, usdBalancePath)
  }

  balanceText = await client.getElementText(eleBalance.ELEMENT)
  balanceText = balanceText.replace(',','').replace('$','')
  console.log(balanceText)

  // move back.
  await client.touchAction([
    { action: 'press', x: 200, y: 800 },
    { action: 'moveTo', x: 200, y: 1200 },
    'release'
  ])

  return parseInt(balanceText)
}

async function searchAndGet(name) {
  searchBar = await waitUntilNew(findElementWithId, 'com.revolut.revolut:id/searchButton_searchText')
  await client.elementClick(searchBar.ELEMENT)
  await sleep(500)
  searchBar2 = await client.findElement('xpath', 
    '//*[@resource-id=\'com.revolut.revolut:id/searchView_search\' and @class=\'android.widget.EditText\']')
  await client.elementSendKeys(searchBar2.ELEMENT, name)
  await sleep(500)
  stock = await waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/row_root', 0)
  stockLabel = await client.findElementFromElement(stock.ELEMENT, 'id', 'com.revolut.revolut:id/title')
  //stockLabel = await stock.findElement('id', 'com.revolut.revolut:id/subtitle')
  stockLabelText = await client.getElementText(stockLabel.ELEMENT)
  // make sure the finding label is correct one.
  assert(stockLabelText === name)
  return stock
}

async function executeCommand(func, id, ...args) {
  const name = await getStockNameById(id)
  console.log(`Buying stock name: ${name}, Id: ${id}`)
  if (!name) {
    logger.warn(`Cannot find name with ID: ${id}`)
    return FAILED_SHORT_TIME
  }

  client = await wdio.remote(opts)
  await sleep(1000)
  await toStock(client)
  await sleep(2000)

  res = await func(id, name, ...args)
  await client.deleteSession()
  return res
}

async function buy(id, amount, price, isTest=true) {
  return executeCommand(_buy, id, amount, price, isTest)
}

async function sell(id, isTest=true) {
  return executeCommand(_sell, id, isTest)
}

async function _buy(id, name, amount, price, isTest=true) {
  console.log(`amount: ${amount}, price=${price}`)
  balance = await checkBalance(client)
  if (balance < amount) {
    logger.warn(`Balance: ${balance} < amount ${amount}`)
    return FAILED_LONG_TIME
  }

  // investEl = await waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/actionText', 'Invest')
  // await client.elementClick(investEl.ELEMENT)
  // await sleep(500)
  //searchMenuItems = await client.findElements('id', 'com.revolut.revolut:id/navBarMenuItem_icon')

  
  // searchMenuItems = await waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/navBarMenuItem_icon', 1)
  // await client.elementClick(searchMenuItems.ELEMENT)
  // await sleep(500)
  stock = await searchAndGet(name)
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
  priceLabel = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\' and contains(@text, \'${id}\')]`)
  priceText = await client.getElementText(priceLabel.ELEMENT)
  logger.info(priceText)  // 1 AAPL = $147.62

  const latestPrice = getPriceFromLabelText(priceText)
  if (latestPrice > price) {
    logger.info(`missed buy opportunity, required price: ${price}, actual price: ${latestPrice}`)
    return FAILED_SHORT_TIME
  }

  commisionFreeLabel = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/cellDetailsText_endLabel\' and contains(@text, \'out of\')]')
  commisionFreeText = await client.getElementText(commisionFreeLabel.ELEMENT) // 9 out of 10
  logger.info(commisionFreeText)

  const re2 = /(\d+) out of/
  const leftCommisionFreeTimes = re2.exec(commisionFreeText)[1]
  
  if (parseInt(leftCommisionFreeTimes) <= 4) {
    logger.info(`Left commision free times <= 4, aborting...`)
    return FAILED_PERMANENT
  }

  dayTradesLeft = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\' and contains(@text, \'out of\')]')
  dayTradesLeftText = await client.getElementText(dayTradesLeft.ELEMENT) // 3 out of 3
  logger.info(dayTradesLeftText)

  const submitBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')

  if (!isTest) {
    await client.elementClick(submitBtn.ELEMENT)
  }
  await sleep(3000)
  return latestPrice
}
  
async function _sell(id, name, isTest=true) {
  // get current stock
  //investments = await client.findElements('xpath', '//*[@class=\'android.view.ViewGroup\' and preceding-sibling::*[@resource-id=\'com.revolut.revolut:id/listSubheader_container\']]')
  const stock = await searchAndGet(name)
  await client.elementClick(stock.ELEMENT)
  await sleep(500)

  // click sell button
  const sellBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/actionsRecyclerView\' and @class=\'androidx.recyclerview.widget.RecyclerView\']/*[@class=\'android.view.ViewGroup\' and @index=\'1\']')
  await client.elementClick(sellBtn.ELEMENT)
  await sleep(1000)

  // click the 'owned', which means sell all.
  const ownedLabel = await waitUntilNew(findElementWithXPath, '//*[@resource-id=\'com.revolut.revolut:id/amountEdit_startHintContainer\' and @class=\'android.widget.RelativeLayout\' and @index=\'2\']')
  await client.elementClick(ownedLabel.ELEMENT)
  
  // click sell button again.
  const sellBtn2 = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')
  await client.elementClick(sellBtn2.ELEMENT)
  await sleep(500)

  //check final price
  priceLabel = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.view.ViewGroup\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\' and contains(@text, \'${id}\')]`)
  priceText = await client.getElementText(priceLabel.ELEMENT)
  logger.info(priceText)  // 1 AAPL = $147.62
  const latestPrice = getPriceFromLabelText(priceText)
  const submitBtn = await client.findElement('xpath', '//*[@resource-id=\'com.revolut.revolut:id/next_button\' and @class=\'android.widget.FrameLayout\']')
  if (!isTest) {
    await client.elementClick(submitBtn.ELEMENT)
    await sleep(1000)
  }
  
  return latestPrice
}

module.exports = {
  buy, sell, FAILED_LONG_TIME, FAILED_PERMANENT, FAILED_SHORT_TIME
}