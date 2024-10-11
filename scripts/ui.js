var blessed = require('blessed')
, contrib = require('blessed-contrib');

var screen = blessed.screen(
    {
        terminal: 'xterm-256color',
        fullUnicode: true,
        dockBorders: true,
        smartCSR: true,
    }
);

var grid = new contrib.grid({rows: 24, cols: 24, screen: screen})

var chatBox = grid.set(0, 0, 21, 24, blessed.log, 
    {
        parent: screen,
        tags: true,
        keys: true,
        vi: true,
        scrollback: 100,
        scrollbar: {
          ch: ' ',
          track: {
            bg: 'blue',
          },
          style: {
            inverse: true,
          },
        },
        style: {
            fg: 'white',
            bg: 'black',
            border: {
                fg: 'white',
            },
            focus: {
                border: {
                    fg: 'green',
                },
            },
            scrollbar: {
                bg: 'white'
            }
        }
    }
)
var functionBox = grid.set(21, 0, 2, 24, blessed.log,
    {
        parent: screen,
        tags: true,
        style: {
            fg: 'white',
            bg: 'black',
            border: {
                fg: 'white'
            },
            focus: {
                border: {
                    fg: 'green',
                },
            },
        }
    }
)
var inputBox = grid.set(23, 0, 1, 24, blessed.textbox,
    {
        parent: screen,
        keys: true,
        inputOnFocus: true,
        style: {
            fg: 'white',
            bg: 'black',
            border: {
                fg: 'white',
            },
            focus: {
                border: {
                    fg: 'green',
                },
            },
        }
    }
)

module.exports = {
        screen,
        chatBox,
        functionBox,
        inputBox
    }
