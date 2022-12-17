const {post} = require('./wechat')

async function test() {
  await post('this is test')
}

test()