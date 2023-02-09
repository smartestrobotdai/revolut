const fs = require('fs');
const { syncBuiltinESMExports } = require('module');
const { resolve } = require('path');
const { mainModule } = require('process');
var fsPromises = fs.promises;

class Holds {
  holds = []
  path = ''
  constructor(path) {
    this.path = path
  }
  load() {
    return fsPromises.readFile(this.path).catch((e) => {

      console.log(e)
      if (e.code === 'ENOENT') {
        return ''
      } else {
        throw e
      }
    }).then(content => {
      content = "" + content
      
      if (content) {
        this.holds = JSON.parse(content)
        return Promise.resolve(this.holds)
      }
      return Promise.resolve([])
    })
  }
  
  add(name, buyPrice) {
    const index = this.holds.map(o => o.name).indexOf(name)
    
    if (index !== -1) {
      this.holds[index] = {name, buyPrice}
    } else {
      this.holds.push({name, buyPrice})  
    }

    return fsPromises.writeFile(this.path, JSON.stringify(this.holds))
  }
  
  remove(name) {
    const index = this.holds.map(o => o.name).indexOf(name)
    if (index !== -1) {
      this.holds.splice(index, 1)
      return fsPromises.writeFile(this.path, JSON.stringify(this.holds))
    }
    return Promise.resolve()
  }
  
  getAll = () => {
    return this.holds
  }
  
  get(name) {
    if (this.holds.length) {
      const index = this.holds.map(o => o.name).indexOf(name)
      if (index !== -1) {
        return this.holds[index]
      }
    }
    return null
  }
  
  getPrice(name) {
    const obj = this.get(name)
    return obj && obj['buyPrice']
  }

  includes(name) {
    const obj = this.get(name)
    return obj !== null
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  holds = new Holds('myholds_test.json')
  await holds.load()
  await holds.add('MSFT', 200)
  await holds.add('MSFT', 100)
  await holds.add('AAPL', 150)
  await holds.add('AAPL', 160)

  await holds.remove('MSFT')
  await sleep(100)
  console.log(holds.getAll())
  console.log(holds.getPrice('AAPL'))
}

//main()

module.exports = {
  Holds
}