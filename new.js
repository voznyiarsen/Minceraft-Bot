
const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true
});

const textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

// Calculate the number of lines in the text content
const numLines = textContent.split('\n').length;

const textBox = blessed.textbox({
  content: textContent,
  height: numLines + 2, // Add extra height for padding
  width: '100%',
  border: {
    type: 'line'
  },
  input: true // Enable typing inside the textbox
});

screen.append(textBox);

screen.render();
