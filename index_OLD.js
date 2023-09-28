var mineflayer = require('mineflayer')
var mcData = require('minecraft-data')('1.12.2')

var pvp = require('mineflayer-pvp').plugin

var { pathfinder, Movements } = require('mineflayer-pathfinder')
var { GoalFollow } = require('mineflayer-pathfinder').goals

var { create, all } = require('mathjs')
var math = create(all)

var {screen, chatBox, functionBox, logBox, inputBox} = require('./scripts/ui')
var errorHandler = require('./scripts/error-handling')

var host = process.argv[2]     //
var username = process.argv[3] 
var password = process.argv[4] 
var master = process.argv[5]   

var bot = mineflayer.createBot(
  {
    host: host,
    port: '25565',
    username: username,
    logErrors: false,
    hideErrors: true,
    version: '1.12.2'
  }
)

var logging = true

const logError = errorHandler(bot)

// LOAD PLUGINS //
bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)

var movements = new Movements(bot, mcData)

var targetUsername = null
var targetHealth = null

var isHunting = false
var isHealing = false
var isBuffed = false

var isEquipping = true

var isEquippingArmor = false
var isEquippingOffHand = false

var isRetreating = false
var isWindowLocked = false

var chatMutedFor = 0
var buffedFor = 0

bot.once('login', () => {
  setInterval(() => {
    if (buffedFor > 0) {
      isBuffed = true
      buffedFor -= 1
    } else isBuffed = false
    if (chatMutedFor > 0) {
      chatMutedFor -= 1
    }
  }, 1000);
});

bot.once('spawn', () => {
  bot.pvp.movements.allowFreeMotion = false
  bot.pvp.movements.canOpenDoors = false
  bot.pvp.movements.maxDropDown = Infinity

  //bot.pvp.movements.blocksCantBreak.add(mcData.blocksByName.obsidian.id)
  //movements.blocksCantBreak.add(mcData.blocksByName.obsidian.id)

  bot.pvp.movements.scafoldingBlocks = [null]
  bot.pvp.movements.canDig = false
  bot.pvp.attackRange = 20

  bot.pvp.movements.blocksToAvoid.add(mcData.blocksByName.water.id)
  bot.pvp.movements.blocksToAvoid.add(mcData.blocksByName.lava.id)

  movements.allowFreeMotion = false
  movements.canOpenDoors = false
  movements.maxDropDown = Infinity

  movements.scafoldingBlocks = [null]
  movements.canDig = false

  movements.blocksToAvoid.add(mcData.blocksByName.water.id)
  movements.blocksToAvoid.add(mcData.blocksByName.lava.id)
});
bot._client.on('entity_velocity', v => {
  if (bot.entity.id !== v.entityId) return;
  setTimeout(() => {
    bot.entity.velocity.x = 0
    bot.entity.velocity.y = 0
    bot.entity.velocity.z = 0
  }, 0)
});
bot.once('spawn', () => {
  bot.chat(`/register ${password} ${password}`);
  bot.chat(`/l ${password}`);
});
bot.on('windowOpen', async (window) => {
  if (isWindowLocked) return;
  await bot.clickWindow(2,0,0); // mlegacy.ru
  await window.close(); 
})
bot.on('message', async (data) => {
  renderChatBox(`>>>${data.toAnsi()}<<<`)
  switch(true) {
    //EVENTS// Осталось ждать 811 секунд. На вас наложен мут донатером mosqka. До окончания мута: 900 секунд // Вы получили мут от донатера. До окончания мута: 871 секунд<
    case data == '[❤] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом.':
      isWindowLocked = false
      renderLogBox(`isWindowLocked? ${isWindowLocked}`)
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case data == 'PVP окончено':
      bot.chat(`/bal`);
      if (isRetreating) bot.chat('/home');
      renderLogBox('{green-fg}{bold}Exited PvP state')
    break;
    case data == 'Вы начали PVP!':
      isHunting = true
      renderLogBox('{red-fg}{bold}Entered PvP state')
    break
    case data == '[!] Извините, но Вы не можете PvP здесь.':
      resetVariables()
      renderLogBox('{red-fg}{bold}Cant PvP here, stopping')
    break;
    case /^Чат-игра » Решите пример: \d+ \+ \d+ кто первый решит пример, получит: \d+\$$/.test(data):
      bot.chat(`!${math.evaluate(data.toString().match(/\d+ \+ \d+/g))}`)
    break;
    case data == '[Нарко] Вы упороты!' || data == '[Нарко] Вас ща перекроет!!':
      buffedFor = 70
    break;
    case /^На вас наложен мут донатером .+\. До окончания мута: \d+ секунд$/.test(data) || /^Вы получили мут от донатера. До окончания мута: \d+ секунд$/.test(data):
      chatMutedFor = data.toString().match(/[\^\w]\d+/)
    break;
    case /^\[!\] Подождите немного! Эта команда будет доступна через \d+ секунд.$/.test(data):
      renderLogBox(`{red-fg}{bold}On cooldown, can use this command in ${data.toString().match(/\d+/)}`)
    break;
    case /^Ошибка: .+$/.test(data):
      renderLogBox(`{red-fg}{bold}${data}`)
    break;
    case /^Осталось ждать \d+ секунд.$/.test(data):
      chatMutedFor = data.toString().match(/\d+/)
    break;
    case /        Добро пожаловать на ＭｉｎｅＬｅｇａｃｙ/.test(data):
      isWindowLocked = true
      renderLogBox(`isWindowLocked? ${isWindowLocked}`)
    break;
    case /^Баланс: \$.+$/.test(data):
      var value = data.toString().match(/[\d,.]+/)
      if (value <= 0) return;
      renderLogBox(`Sending {red-fg}{bold}{underline}$${value}{/} to ${master}`)
      bot.chat(`/pay ${master} ${value}`)
    break;
  }
});

inputBox.on('submit', async function (data) {
  const command = data.split(' ')
  switch(true) {
    //TOSS
    case /^ts \d+ \d+$/.test(data):
      tossItem(command[2], command[1]);
    break;
    case /^ts \w+$/.test(data):
      tossItem(command[1]);
    break;
    case /^tsall$/.test(data):
      tossAllItems()
    break;
    //EQUIP
    case /^eq [\w-]+ \d+$/.test(data):
      equipItem(command[2], command[1]);
    break;
    case /^sweq$/.test(data):
      isEquipping = !isEquipping
      renderLogBox(`Switched equipping to ${isEquipping}`)
    break;
    //UNEQUIP
    case /^uneq \w+$/.test(data):
      unequipItem(command[1]);
    break;
    case /^uneqall$/.test(data):
      unequipArray = ['head','torso','legs','feet','off-hand']
      for (const destination of unequipArray) {
        await unequipItem(destination);
      }
    break;
    case /^s$/.test(data):
      resetVariables();
      renderLogBox(`{green-fg}{bold}Resetting variables`);
    break;
    case /^g$/.test(data):
      resetVariables();
      isHunting = true
      renderLogBox(`{red-fg}{bold}In combat`);
    break;
    case /^ret$/.test(data):
      isRetreating = !isRetreating
      renderLogBox(`{bold}Retreating set to {red-fg}{underline}${isRetreating}`);
    break;
    case /^f$/.test(data):
      followPlayer();
      renderLogBox(`{bold}Following {red-fg}{underline}${master}`);
    break;
    case /^c$/.test(data):
      bot.chat(`/call ${master}`);
      renderLogBox(`{bold}Calling {red-fg}{underline}${master}`)
    break;
    case /^b$/.test(data):
      bot.chat('/bal');
    break;
    case /^i$/.test(data):
      sayItems();
    break;
    case /^r$/.test(data):
      bot.chat('/home');
      renderLogBox(`{bold}{green-fg}Withdrawing`);
    break;  
    case /^rejoin$/.test(data):
      isWindowLocked = false
    break;
    case /^q$/.test(data):
      bot.end(); 
      process.exit(0);
    default:
      bot.chat(`${data}`);
      inputBox.setValue('');
    return;
  }
  inputBox.setValue('');
});
function renderChatBox(text) {
  if (!logging) return;
  chatBox.log(` ${text}{|}{gray-fg}${new Date().toLocaleString()}{/} `);
  chatBox.scrollTo(chatBox.getScrollHeight())
  screen.render();
}
function renderFunctionBox(text) {
  if (!logging) return;
  functionBox.setContent(`${text}`);
  functionBox.scrollTo(functionBox.getScrollHeight())
  screen.render();
}
function renderLogBox(text) {
  if (!logging) return;
  logBox.log(` ${text}{|}{gray-fg}${new Date().toLocaleString()}{/} `);
  logBox.scrollTo(logBox.getScrollHeight())
  screen.render();
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function unequipItem (destination) {
  try {
    await bot.unequip(destination)
    //renderLogBox('unequipped')
  } catch (err) {
    logError(err.message)
  }
}
async function equipItem (itemId, destination) {
  itemId = parseInt(itemId, 10)
  if (itemId) {
    try {
      await bot.equip(itemId, destination)
      //renderLogBox(`equipped ${itemId}`)
    } catch (err) {
      logError(err.message)
    }
  } else {
    renderLogBox(`I have nothing to equip`)
  }
}
async function tossItem (itemId, amount) {
  amount = parseInt(amount, 10)
  itemId = parseInt(itemId, 10)
  if (!itemId) {
    renderLogBox(`I have no id of the item to toss`)
  } else {
    try {
      if (amount) {
        await bot.toss(itemId, null, amount)
        renderLogBox(`tossed ${amount} x ${itemId}`)
      } else {
        await bot.tossStack(itemId)
        renderLogBox(`tossed ${itemId}`)
      }
    } catch (err) {
      logError(err.message)
    }
  }
}
async function tossAllItems () {
   items = bot.inventory.items()
   const outputId = items.map(itemToType)
   for (const id of outputId) {
    await sleep(50)
    item = bot.inventory.findInventoryItem(id, null);
    await bot.toss(id, null, item.count)
  }
}
function itemToType (item) {if (item) return item.type; else return;}
function itemToString (item) {if (item) return `${item.name} ID:${item.type} SLOT:${item.slot} COUNT:${item.count}`; else return '(nothing)';}
function sayItems (items = bot.inventory.items()) {
  const output = items.map(itemToString).join('\n')
  if (output) {
    renderLogBox(`Items:\n{red-fg}{bold}${output}{/}`)
  } else {
    renderLogBox(`{red-fg}{bold}Empty{/}`)
  }
}
/*
function uniEquip(idNum) {
  var inventory = bot.inventory.items()
  var filtered = inventory.filter(Item => Item.type == idNum)

  filtered = JSON.parse(JSON.stringify(filtered));
  filtered.forEach(function(element) {
    var Slot = null
    if (!Slot) {
      Slot = element['slot']
    }
    if (Slot >= 36 && Slot <= 44) {
      bot.equip(bot.inventory.slots[Slot], 'hand') 
    } else Slot = null  
  });  
}

//if (process.argv.length < 6 || process.argv.length > 6) {console.log(`Usage: node index.js <host> [<username>] [<password>] [<master>]`); process.exit(1);}

*/
function followPlayer() {
  const fplayer = bot.players[`${master}`]
  if (!fplayer || !fplayer.entity) return

  const goal = new GoalFollow(fplayer.entity, 1)
  bot.pathfinder.setMovements(movements)
  bot.pathfinder.setGoal(goal, true)
}
function resetVariables() {
  isHunting = false
  bot.stopDigging()
  bot.pvp.forceStop()
  bot.pathfinder.setGoal(null)
}
// EQUIPING //
bot.once('login', () => {
  setInterval( async () => {
    if(!isWindowLocked || !isEquipping) return;

    //ARMOR//
    if (bot.inventory.slots[5] === null) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null);

      if (item && item.customName == '§4§lbot.helmet') {
        isEquippingArmor = true;
        await equipItem(item.type, 'head');
      } else isEquippingArmor = false 
    } else isEquippingArmor = false

    if (bot.inventory.slots[6] === null) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null);

      if (item && item.customName == '§4§lbot.chestplate') {
        isEquippingArmor = true;
        await equipItem(item.type, 'torso');
      } else isEquippingArmor = false 
    } else isEquippingArmor = false

    if (bot.inventory.slots[7] === null) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null);

      if (item && item.customName == '§4§lbot.leggings') {
        isEquippingArmor = true;
        await equipItem(item.type, 'legs');
      } else isEquippingArmor = false 
    } else isEquippingArmor = false

    if (bot.inventory.slots[8] === null) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null);

      if (item && item.customName == '§4§lbot.boots') {
        isEquippingArmor = true; 
        await equipItem(item.type, 'feet');
      } else isEquippingArmor = false 
    } else isEquippingArmor = false

    //TOTEM//
    if (bot.inventory.slots[45] === null) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);
      
      if (item) {
        isEquippingOffHand = true
        await equipItem(item.type, 'off-hand');
      } else isEquippingOffHand = false
    } else isEquippingOffHand = false

    //JUNK ITEMS//
    if (!bot.pvp.target && !isEquippingArmor && !isEquippingOffHand) {
      if (bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null)) {
        item = bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null);
        await bot.toss(item.type, null, item.count);
      } 
      if (bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null)) {
        item = bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null);
        await bot.toss(item.type, null, item.count);
      }
    }

    //POWDER//
    if (!isBuffed && !isHealing && bot.pvp.target) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.gunpowder.id, null)
      if (item) {
        await equipItem(item.type, 'hand');
        bot.activateItem();
      }
    }

    //GAPPLE//
    if (bot.health <= 13 || bot.food <= 15) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null)
      if (item) {
        await equipItem(item.type, 'hand')
        bot.pvp.stop()
        bot.activateItem();
        isHealing = true;
      } else isHealing = false; 
    } else isHealing = false;

    //SWORD//
    if (!isHealing && isHunting) {
      item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null)
      if (item && item.customName == '§eГаусс Дробовик§e ▪ «Inf') await equipItem(item.type, 'hand');
    }
  }, 250)
});

bot.once('spawn', () => {
  setInterval(() => {
    renderFunctionBox(
    `IN COMBAT?:{red-fg}{bold}${isHunting}{/}` +
    `\nHEALING?:{red-fg}{bold}${isHealing}{/}` +
    `\nBOT NAME:{red-fg}{bold}${bot.username}{/}` +
    `\nBOT HEALTH:{red-fg}{bold}${bot.health}{/}` +
    `\nBOT FOOD:{red-fg}{bold}${bot.food}{/}` +
    `\nTARGET USERNAME:{red-fg}{bold}${targetUsername}{/}` +
    `\nTARGET HEALTH:{red-fg}{bold}${targetHealth}{/}` +
    `\nBUFF DURATION:{red-fg}{bold}${buffedFor}{/}` +
    `\nMUTE DURATION:{red-fg}{bold}${chatMutedFor}{/}`)
  }, 250)
});// health? 3.063079595565796 metadata 7

bot.on('physicTick', () => {
  if (!isHunting || !isWindowLocked) return;

  const filterTarget = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) < 128 && e.username !== `${master}` && e.username !== `Xx_God_Yato_xX` && e.username !== `FrankDraggly`
  const entityTarget = bot.nearestEntity(filterTarget);
  if (entityTarget) {
    targetUsername = entityTarget.username;
    targetHealth = entityTarget.metadata[7];
  } else {
    targetUsername = null;
    targetHealth = null;
  }
  if (entityTarget) bot.pvp.attack(entityTarget);
});

screen.key(['C-z'], () => logBox.focus());
screen.key(['C-x'], () => chatBox.focus());

screen.key(['return', 'enter'], () => {
  inputBox.submit(); 
  inputBox.focus();
});

screen.key(['escape'], function(ch, key) {
  bot.end(); 
  process.exit(0);
});

bot.on('kicked', reason => logError(reason));
bot.on('error', err =>  logError(err));

setInterval(() => {
  if (!logging) return;
  screen.render();
}, 10000)