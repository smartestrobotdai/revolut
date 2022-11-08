

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
  

module.exports = {
    sleep, logger
}