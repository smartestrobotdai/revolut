

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
  

module.exports = {
    sleep, logger, waitUntilNewBase
}