const fs = require("fs");
const { parse } = require("csv-parse");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const logger = {
    warn: function(x) {
      now = new Date().toISOString()
      console.warn(`${now}: ${x}`)
    },
  
    info: function(x) {
      now = new Date().toISOString()
      console.info(`${now}: ${x}`)
    },
  
    error: function(x) {
      now = new Date().toISOString()
      console.error(`${now}: ${x}`)
    }
}

waitUntilNewBase = async function(client, func, ...args) {
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


global.stocks = []


getStockNameById = function(Id) {
  return new Promise((resolve, reject) => {
    if (stocks.length === 0) {
      fs.createReadStream("./sp500_stocks.csv")
      .pipe(parse({ delimiter: " ", from_line: 1 }))
      .on("data", function (row) {
        stockId = row[0].replace("'", "")
        stockName = row[1].replace(/[, ]*Inc./, '')
        stocks[stockId] = stockName
      })
      .on("end", function () {
        console.log("finished");
        resolve(stocks[Id])
    
      })
      .on("error", function (error) {
        console.log(error.message);
        reject(error)
      })
    } else {
      resolve(stocks[Id])
    }
  })
}

module.exports = {
    sleep, logger, waitUntilNewBase, getStockNameById
}