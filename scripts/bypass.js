const mineflayer = require('mineflayer')
const readline = require('readline')

const bot = mineflayer.createBot({
    host: process.argv[2],
    port: '25565',
    username: process.argv[3],
    //password: process.argv[4],
    logErrors: false,
    version: '1.12.2'
})

// Bot filter map bypass //
bot._client.on('map', (map) => {
  const size = Math.sqrt(map.data.length)

  // Make an histogram of the colors //
  const h = {}
  for (const v of map.data) {
    if (!h[v]) h[v] = 0
    h[v]++
  }

  // The most popular color is background, the second is the numbers //
  const colors = Object.entries(h).sort((a, b) => b[1] - a[1]).map(x => parseInt(x[0], 10))
  const fg = colors[1]

  // Display the image as a black/white ascii //
  for (let i=0 ; i<size ; i++) {
    let line = ''
    for (let j=0 ; j<size ; j++) {
      let v = map.data[i*128+j]
      line += (v != fg) ? '.' : 'X'
    }
    console.log(line)
  }

  // Ask the user for the result //
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question("Enter captcha number: ", (n) => {
    bot.chat(n)
    rl.close()
//    bot.quit()
  })
})
// Log errors/Kick reasons //
bot.on('kicked', (reason, loggedIn) => console.log(`=> Kicked ${reason} ${loggedIn}`))
bot.on('error', err => console.error(`=> Error ${err}`))

