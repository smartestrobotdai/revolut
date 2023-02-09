const {Holds} = require('./holds')
const {sleep, logger} = require('./util')

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

main()