const wdio = require("webdriverio")
const {sleep, logger, waitUntilNewBase} = require('./util')
const assert = require("assert");
const { default: $ } = require("webdriverio/build/commands/browser/$");




const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: "Android",
    platformVersion: "12",
    deviceName: "RFCRC0R00XD",
    //app: "https://github.com/appium/appium/raw/1.x/sample-code/apps/ApiDemos-debug.apk",
    //appPackage: "io.appium.android.apis",
    appPackage: "com.tencent.mm",
    appActivity: "com.tencent.mm.ui.LauncherUI",
    automationName: "UiAutomator2",
    noReset: true
  }
}



findElementsWithXPath = async function(xpath) {
  const item = await client.findElements('xpath', xpath)
  return item
}

async function post(text) {
  client = await wdio.remote(opts)
  const waitUntilNew = waitUntilNewBase.bind(this, client)
  await sleep(8000)

  findElementWithXPath = async function(xpath) {
    const item = await client.findElement('xpath', xpath)
    return item
  }
  discover = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.widget.RelativeLayout\' and @resource-id=\'com.tencent.mm:id/lk9\' and @index=\'2\']`)
  await client.elementClick(discover.ELEMENT)
  await sleep(3000)
  moment = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.widget.LinearLayout\' and @resource-id=\'com.tencent.mm:id/k2d\']`)
  await client.elementClick(moment.ELEMENT)
  await sleep(5000)
  toPost = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.widget.ImageView\' and @resource-id=\'com.tencent.mm:id/el\']`)
  rect = await client.getElementRect(toPost.ELEMENT)
  console.log(rect)
  ta = await client.touchAction(
    {
      action: 'longPress',
      element: toPost,
      x: 1004,
      y: 153
    }
  )
  await(1000)
  input = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.widget.EditText\' and @resource-id=\'com.tencent.mm:id/kzn\']`)
  await client.elementSendKeys(input.ELEMENT, 'mytest')

  lastPost = await waitUntilNew(findElementWithXPath, `//*[@class=\'android.widget.EditText\' and @resource-id=\'com.tencent.mm:id/kzn\']`)

  await sleep(5000)
  
  //await client.elementLongClick(toPost.ELEMENT)
}

module.exports = {
  post
}