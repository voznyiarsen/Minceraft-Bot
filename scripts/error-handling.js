const { chatBox, screen } = require('./ui')
const PrettyError = require('pretty-error')

const pe = new PrettyError()
pe.skipNodeFiles()
pe.skipPackage('blessed', 'vm')
pe.skipPath(__filename)

module.exports = function (bot) {
  // NOTE: Remove listener created by logErrors: true
  //bot.removeAllListeners('error')
  bot.on('error', err => {
    chatBox.pushLine(pe.render(err))
    chatBox.scrollTo(chatBox.getScrollHeight())
    screen.render()
  })

  process.on('uncaughtException', (err) => {
    chatBox.pushLine(pe.render(err))
    chatBox.scrollTo(chatBox.getScrollHeight())
    screen.render()
  })

  return function (err) {
    chatBox.pushLine(pe.render(err))
    chatBox.scrollTo(chatBox.getScrollHeight())
    screen.render()
  }
}
