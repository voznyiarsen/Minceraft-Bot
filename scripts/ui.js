var blessed = require('blessed')
, contrib = require('blessed-contrib');

var screen = blessed.screen(
    {
        terminal: 'windows-ansi',
        fullUnicode: true,
        dockBorders: true,
        smartCSR: true,
    }
);

var grid = new contrib.grid({rows: 24, cols: 24, screen: screen})

var chatBox = grid.set(0, 0, 22, 20, blessed.log, 
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
var functionBox = grid.set(0, 20, 12, 4, blessed.log,
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
var logBox = grid.set(12, 20, 12, 4, blessed.log,
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
var inputBox = grid.set(22, 0, 2, 20, blessed.textbox, 
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

//inputBox.focus();
//chatBox.focus();
//logBox.focus();

module.exports = {
        screen,
        chatBox,
        functionBox,
        logBox,
        inputBox
    }
