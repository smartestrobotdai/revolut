const wdio = require("webdriverio");
const {By} = require('selenium-webdriver');
const assert = require("assert");
"use strict"


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


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

async function main () {
  const client = await wdio.remote(opts)
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

  client.waitUntilNew = async function(func, ...args) {
    const result = await client.waitUntil((async () => {
      res = null
      try {
        res = await func(...args)
        return res !== null && (!Array.isArray(res) || res.length > 0)
      } catch (error) {
        return false
      }
    }), {
      timeout: 10000,
      timeoutMsg: 'expected text to be different after 5s'
    })
    return res || result
  }

  field = await client.waitUntilNew(findElementWithId, 'com.revolut.revolut:id/internalViewKeypadView_button0')
  await client.elementClick(field.ELEMENT)
  field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button5')
  await client.elementClick(field.ELEMENT)
  field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button1')
  await client.elementClick(field.ELEMENT)
  field = await client.findElement('id', 'com.revolut.revolut:id/internalViewKeypadView_button1')
  await client.elementClick(field.ELEMENT)

  stockEl = await client.waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/tabText', 'Stocks')
  await client.elementClick(stockEl.ELEMENT)

  await sleep(500)
  investEl = await client.waitUntilNew(findElementWithIdAndText, 'com.revolut.revolut:id/actionText', 'Invest')
  await client.elementClick(investEl.ELEMENT)
  await sleep(500)
  //searchMenuItems = await client.findElements('id', 'com.revolut.revolut:id/navBarMenuItem_icon')
  searchMenuItems = await client.waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/navBarMenuItem_icon', 1)
  await client.elementClick(searchMenuItems.ELEMENT)

  searchBar = await client.waitUntilNew(findElementWithId, 'com.revolut.revolut:id/search')
  await client.elementSendKeys(searchBar.ELEMENT, 'AAPL')

  stock = await client.waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/row_root', 0)
  stockLabel = await client.findElementFromElement(stock.ELEMENT, 'id', 'com.revolut.revolut:id/subtitle')
  //stockLabel = await stock.findElement('id', 'com.revolut.revolut:id/subtitle')
  stockLabelText = await client.getElementText(stockLabel.ELEMENT)
  assert(stockLabelText.includes('AAPL'))
  await client.elementClick(stock.ELEMENT)
  await sleep(500)
  buyBar = await client.waitUntilNew(findElementWithId, 'com.revolut.revolut:id/actionsRecyclerView')
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
  await sleep(500)
  amountInput = await client.waitUntilNew(findElementWithIdAndIndex, 'com.revolut.revolut:id/amountEdit_amountInputText', 1)
  //amountInputs = await client.findElements('id', 'com.revolut.revolut:id/amountEdit_amountInputText')
  await client.elementSendKeys(amountInput.ELEMENT, '100')
  buyBtn = await client.findElement('id', 'com.revolut.revolut:id/next_button')
  await client.elementClick(buyBtn.ELEMENT)
  
  await sleep(100)
  priceLabel = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\' and @index=\'4\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\']')
  priceText = await client.getElementText(priceLabel.ELEMENT)
  console.log(priceText)  // 1 AAPL = $147.62
  
  commisionFreeLabel = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\' and @index=\'6\']/*[@resource-id=\'com.revolut.revolut:id/cellDetailsText_endLabel\']')
  commisionFreeText = await client.getElementText(commisionFreeLabel.ELEMENT) // 9 out of 10
  console.log(commisionFreeText)

  dayTradesLeft = await client.findElement('xpath', '//*[@class=\'android.view.ViewGroup\' and @index=\'7\']/*[@resource-id=\'com.revolut.revolut:id/endLabel\']')
  dayTradesLeftText = await client.getElementText(dayTradesLeft.ELEMENT) // 3 out of 3
  console.log(dayTradesLeftText)

  await sleep(10000)
  await client.deleteSession();
}

main();