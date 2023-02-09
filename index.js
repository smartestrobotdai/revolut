const {Holds} = require('./holds')
const assert = require("assert");
const {buy, sell, FAILED_PERMANENT, FAILED_SHORT_TIME, FAILED_LONG_TIME} = require('./android')
const {sleep, logger} = require('./util')
"use strict"

let isOperationOngoing = false
const WebSocketClient = require('websocket').client;
const exampleSocket = new WebSocketClient()
const holds = new Holds('myholds.json')


function webSocketConnect(url) {
  return new Promise((resolve, reject) => {
    exampleSocket.connect(url, '');
    exampleSocket.onopen = (event) => {
      logger.info('opened!')
    }
    exampleSocket.on('connect', function(connection) {
      resolve(connection)
    })

    // connection.on('error', function(error) {
    //   console.log("Connection error: " + error.toString())
    //   resolve(error)
    // });
  })
}

function waitForMessageForever() {
  return new Promise((resolve) => {})
}

function getCurTImeInSecond() {
  return parseInt(Date.now()/1000)
}

let sleepStartTIme = null
handleBuyMessage = async (message) => {
  if (message.type === 'utf8') {
    // check if we are still under processing
    if (isOperationOngoing === true) {
      logger.warn('operation is ongoing...abort...')
      return
    }
    isOperationOngoing = true

    // logger.info("Received: '" + message.utf8Data + "'")
    const recObj = JSON.parse(message.utf8Data )
    const {id, point, price, operation, stoploss} = recObj
    try {
      if (operation === 'buy') {
        if (sleepStartTIme && getCurTImeInSecond() - sleepStartTIme < 3600) {
          logger.info('sleeping, abort')
          isOperationOngoing = false
          return
        }
        sleepStartTIme = null
        if (!holds.includes(id)) {
          logger.info(`Trying buy ${id} at point ${point}`)
          const buyPrice = await buy(id, 1000, point, false)
          if (buyPrice < 0) {
            if (buyPrice === FAILED_PERMANENT) {
              logger.info('Exiting process...')
              process.exit(-1)
            } else if (buyPrice === FAILED_LONG_TIME) {
              logger.info('Hibernate for 1 hour')
              sleepStartTIme = getCurTImeInSecond()
            }
          }
          else if (buyPrice !== -1) {
            logger.info(`Bought ${id} at price ${buyPrice}`)
            await holds.add(id, buyPrice)
          }
        } else {
          /* NO STOP LOSS!
          const priceBought = holds.getPrice(id)
          if (price < priceBought * stoploss) {
            // the signal is buy but actually stop loss reached
            logger.info(`Stop loss! Trying sell ${id}`)
            await sell(id, false)
            await holds.remove(id)
          }
          */
        }
      } else if (operation === 'sell' && holds.includes(id)) {
        logger.info(`Trying sell ${id} at point ${point}`)
        await sell(id, false)
        await holds.remove(id)
        await sleep(1000)
      }
    } catch(e) {
      logger.error(e)
      isOperationOngoing = false  
    }

    isOperationOngoing = false
  }
}

async function main () {
  await holds.load()
  const myHolds = await holds.getAll()
  logger.info(`Holds: ${JSON.stringify(myHolds)}` )
  const websocketUrl = 'ws://192.168.1.41:8766/'
  const connection = await webSocketConnect(websocketUrl)
  logger.info(`connected to ${websocketUrl}`)
  connection.on('message', handleBuyMessage)
  await waitForMessageForever()
}

main()