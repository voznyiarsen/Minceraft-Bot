const mineflayer = require('mineflayer')
//const mcData = require('minecraft-data')('1.12.2')

const pvp = require('mineflayer-pvp').plugin

const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalFollow } = require('mineflayer-pathfinder').goals

const { create, all } = require('mathjs')
const math = create(all)

const {screen, chatBox, functionBox, logBox, inputBox} = require('./scripts/ui')
const errorHandler = require('./scripts/error-handling')

const host = process.argv[2]     || 'mlegacy.ru'
const username = process.argv[3] 
const password = process.argv[4] 
const master = process.argv[5]   

const bot = mineflayer.createBot(
  {
    host: host,
    port: '25565',
    username: username,
    logErrors: false,
    hideErrors: true,
    version: '1.12.2'
  }
)

const logError = errorHandler(bot)

// LOAD PLUGINS //
bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)

const movements = new Movements(bot, bot.registry)

const logging = true

const targetUsername = null
const targetHealth = null
const allyUsername = null
const lastEquippedId = null

const isHunting = false
const isHealing = false

const isAutoEquipping = true

const isEquippingArmor = false
const isEquippingOffHand = false

const isRetreating = false
const isWindowLocked = false

const isEffectStrenght = false

bot.once('spawn', () => {
  bot.pvp.movements.allowFreeMotion = false
  bot.pvp.movements.canOpenDoors = false
  bot.pvp.movements.maxDropDown = 256

  bot.pvp.movements.scafoldingBlocks = [null]
  bot.pvp.movements.canDig = false
  bot.pvp.attackRange = 20

  bot.pvp.movements.blocksToAvoid.add(bot.registry.blocksByName.water.id)
  bot.pvp.movements.blocksToAvoid.add(bot.registry.blocksByName.lava.id)

  movements.allowFreeMotion = false
  movements.canOpenDoors = false
  movements.maxDropDown = 256

  movements.scafoldingBlocks = [null]
  movements.canDig = false

  movements.blocksToAvoid.add(bot.registry.blocksByName.water.id)
  movements.blocksToAvoid.add(bot.registry.blocksByName.lava.id)
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
});
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
      bot.chat('/bal');
      if (isRetreating) bot.chat('/home');
      renderLogBox('{green-fg}{bold}Exited PvP state')
    break;
    case data == 'Вы начали PVP!':
      isHunting = true
      renderLogBox('{red-fg}{bold}Entered PvP state')
    break;
    case data == '[!] Извините, но Вы не можете PvP здесь.':
      resetconstiables()
      renderLogBox('{red-fg}{bold}Cant PvP here, stopping')
    break;
    case /^Вы приглашены в клан .+ игроком .+\.$/.test(data):
      bot.chat('/c accept')
    break;
    case /^Чат-игра » Решите пример: \d+ \+ \d+ кто первый решит пример, получит: \d+\$$/.test(data):
      bot.chat(`!${math.evaluate(data.toString().match(/\d+ \+ \d+/g))}`)
    break;
    case /^        Добро пожаловать на ＭｉｎｅＬｅｇａｃｙ$/.test(data):
      isWindowLocked = true
      renderLogBox(`isWindowLocked? ${isWindowLocked}`)
    break;
    case /^Баланс: \$.+$/.test(data):
      const value = data.toString().match(/[\d,.]+/);
      if (value <= 0) return;
      renderLogBox(`Sending {red-fg}{bold}{underline}$${value}{/} to ${master}`)
      bot.chat(`/pay ${master} ${value}`);
    break;
  }
});

inputBox.on('submit', async function (data) {
  const command = data.split(' ');
  switch(true) {
    //TOSS
    case /^ts \d+ \d+$/.test(data):
      tossItem(command[2], command[1]);
    break;
    case /^ts \w+$/.test(data):
      tossItem(command[1]);
    break;
    case /^tsall$/.test(data):
      tossAllItems();
    break;
    //EQUIP
    case /^eq [\w-]+ \d+$/.test(data):
      equipItem(command[2], command[1]);
    break;
    case /^sweq$/.test(data):
      isAutoEquipping = !isAutoEquipping
      renderLogBox(`Switched equipping to ${isAutoEquipping}`);
    break;
    //UNEQUIP
    case /^uneq [\w-]+$/.test(data):
      unequipItem(command[1]);
    break;
    case /^uneqall$/.test(data):
      unequipArray = ['head','torso','legs','feet','off-hand']
      for (const destination of unequipArray) await unequipItem(destination);
    break;
    case /^s$/.test(data):
      resetconstiables();
      renderLogBox(`{green-fg}{bold}Resetting constiables`);
    break;
    case /^obj$/.test(data):
      const util = require('util')
      renderChatBox(util.inspect(bot.nearestEntity(), false, null, true))
    break;
    case /^ps$/.test(data):
      renderChatBox(`{green-fg}{bold}Logging set to ${!logging}`)
      logging = !logging
      renderChatBox(`{green-fg}{bold}Logging set to ${logging}`)
    break;
    case /^g$/.test(data):
      resetconstiables();
      isHunting = true
      renderLogBox(`{red-fg}{bold}In combat`);
    break;
    case /^ret$/.test(data):
      isRetreating = !isRetreating
      renderLogBox(`Retreating set to {red-fg}{bold}{underline}${isRetreating}`);
    break;
    case /^f$/.test(data):
      followPlayer();
      renderLogBox(`Following {red-fg}{bold}{underline}${master}`);
    break;
    case /^c$/.test(data):
      bot.chat(`/call ${master}`);
      renderLogBox(`Calling {red-fg}{bold}{underline}${master}`);
    break;
    case /^b$/.test(data):
      bot.chat('/bal');
    break;
    case /^i$/.test(data):
      sayItems();
    break;
    case /^l$/.test(data):
      sayPlayers();
    break;
    case /^r$/.test(data):
      bot.chat('/home');
      renderLogBox(`{bold}{green-fg}Withdrawing`);
    break;
    //case /^walk \w+ \d+$/.test(data):
    //  botWalk(command[1], command[2])
    //break;
    case /^rejoin$/.test(data):
      isWindowLocked = false
    break;
    case /^q$/.test(data):
      bot.end();
      process.exit(0);
    default:
      renderChatBox(`Sending >>>${data}<<<`);
      bot.chat(`${data}`);
      inputBox.setValue('');
    return;
  }
  inputBox.setValue('');
});
function renderChatBox(text) {
  if (!logging) return;
  chatBox.log(` ${text}{|}{gray-fg}${new Date().toLocaleString()}{/} `);
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
}
function renderFunctionBox(text) {
  if (!logging) return;
  functionBox.setContent(`${text}`);
  functionBox.scrollTo(functionBox.getScrollHeight());
  screen.render();
}
function renderLogBox(text) {
  if (!logging) return;
  logBox.log(` ${text}{|}{gray-fg}${new Date().toLocaleString()}{/} `);
  logBox.scrollTo(logBox.getScrollHeight());
  screen.render();
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  });
}
async function unequipItem (destination) {
  try {
    await bot.unequip(destination);
    renderLogBox(`Unequipped ${destination}`);
  } catch (err) {
    logError(err.message);
  }
}
async function equipItem (itemId, destination) {
  itemId = parseInt(itemId, 10)
  if (itemId) {
    try {
      await bot.equip(itemId, destination);
      if (!isHunting) renderLogBox(`Equipped ${itemId} to ${destination}`);
      lastEquippedId = itemId
    } catch (err) {
      logError(err.message);
    }
  } else renderLogBox(`I have nothing to equip`);
}
async function tossItem (itemId, amount) {
  amount = parseInt(amount, 10);
  itemId = parseInt(itemId, 10);
  if (!itemId) {
    renderLogBox(`I have no id of the item to toss`);
  } else {
    try {
      if (amount) {
        await bot.toss(itemId, null, amount);
        renderLogBox(`Tossed ${amount} x ${itemId}`);
      } else {
        await bot.tossStack(itemId);
        renderLogBox(`Tossed ${itemId}`);
      }
    } catch (err) {
        logError(err.message);
    }
  }
}
async function tossAllItems (items = bot.inventory.items()) {
   const output = items.map(itemToType)
   for (const id of output) {
    await sleep(50);
    item = bot.inventory.findInventoryItem(id, null);
    renderLogBox(`{red-fg}{bold}Tossing{blue-fg}\nID:${id}\n{magenta-fg}COUNT:${item.count}`);
    await bot.toss(id, null, item.count);
  }
  renderLogBox(`{green-fg}{bold}Done{/}`);
}
function itemToType (item) {if (item) return item.type; else return;}
function itemToString (item) {if (item) return `{yellow-fg}NAME:{magenta-fg}${item.name}\nID:{blue-fg}${item.type}\nSLOT:{green-fg}${item.slot}\nCOUNT:{yellow-fg}${item.count}`; else return '(nothing)';}
function sayItems (items = bot.inventory.items()) {
  const output = items.map(itemToString).join('\n')
  if (output) {
    renderLogBox(`Items:\n{bold}${output}{/}`);
  } else {
    renderLogBox(`{red-fg}{bold}Empty{/}`);
  }
}
function sayPlayers () {
  const output = Object.keys(bot.players).join('\n')
  if (output) {
    renderLogBox(`Players:\n{red-fg}{bold}${output}{/}`);
  } else {
    renderLogBox(`{red-fg}{bold}Empty{/}`)
  }
}
function followPlayer () {
  const fplayer = bot.players[`${master}`]
  if (!fplayer || !fplayer.entity) return

  const goal = new GoalFollow(fplayer.entity, 1);
  bot.pathfinder.setMovements(movements);
  bot.pathfinder.setGoal(goal, true);
}
function resetconstiables () {
  isHunting = false
  isHealing = false
  bot.stopDigging();
  bot.pvp.forceStop();
  bot.pathfinder.setGoal(null);
}
// EQUIPING //
bot.once('spawn', () => {
  setInterval(async() => {
    if(!isWindowLocked || !isAutoEquipping) return;
    //HELMET
    if (bot.inventory.slots[5] === null) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null);

      if (item && item.customName == '§4§lbot.helmet') {
        isEquippingArmor = true
        await equipItem(item.type, 'head');
      } else isEquippingArmor = false
    } else isEquippingArmor = false
    //CHESTPLATE
    if (bot.inventory.slots[6] === null) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null);

      if (item && item.customName == '§4§lbot.chestplate') {
        isEquippingArmor = true
        await equipItem(item.type, 'torso');
      } else isEquippingArmor = false
    } else isEquippingArmor = false
    //LEGGINGS
    if (bot.inventory.slots[7] === null) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null);

      if (item && item.customName == '§4§lbot.leggings') {
        isEquippingArmor = true
        await equipItem(item.type, 'legs');
      } else isEquippingArmor = false
    } else isEquippingArmor = false
    //BOOTS
    if (bot.inventory.slots[8] === null) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null);

      if (item && item.customName == '§4§lbot.boots') {
        isEquippingArmor = true
        await equipItem(item.type, 'feet');
      } else isEquippingArmor = false
    } else isEquippingArmor = false
    //POWDER
    if (!bot.player.entity.effects[5] && !isHealing) {
      isEffectStrenght = false;
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.gunpowder.id, null)
      if (item) {
        await equipItem(item.type, 'hand');
        bot.activateItem();
      }
    } else isEffectStrenght = true;
    //TOTEM
    if (bot.inventory.slots[45] === null || bot.inventory.slots[45].type !== 449) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);
      if (item) {
        isEquippingOffHand = true
        await equipItem(item.type, 'off-hand');
      } else isEquippingOffHand = false
    } else isEquippingOffHand = false
    //SWORD
    if (isHunting) {
// §eГаусс Дробовик§e ▫ «Inf
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null)
      if (!isHealing && item && item.customName.includes('Дробовик§e')) {
        await equipItem(item.type, 'hand');
      }
    }
  }, 500)
  setInterval(async() => {
    if(!isWindowLocked || !isAutoEquipping) return;
    //GAPPLE
    if ((bot.entity.metadata[7] + bot.entity.metadata[11]) <= 13 || bot.food <= 15) {
      const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null)
      if (item) {
        bot.pvp.stop();
        isHealing = true
        try {
          await equipItem(item.type, 'hand');
          bot.activateItem();
        }
        catch (err) {
          logError(err.message);
        }
      } else isHealing = false;
    } else isHealing = false;
  }, 1761)
  setInterval(async() => {
    if (!isWindowLocked || !isAutoEquipping) return;
    //JUNK ITEMS
    if (!bot.pvp.target && !isEquippingArmor && !isEquippingOffHand) {
      if (bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null)) {
        const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null);
        await tossItem(item.type, item.count);
      }
      if (bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null)) {
        const item = bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null);
        await tossItem(item.type, item.count);
      }
    }
  }, 500)
  setInterval(() => {
    if (bot.entity.position.y <= 1) bot.chat('/home');
  }, 500)
});

bot.once('spawn', () => {
  setInterval(() => {
    renderFunctionBox(
    `IN COMBAT?:{red-fg}{bold}${isHunting}{/}` +
    `\nSTRENGTH?:{red-fg}{bold}${isEffectStrenght}{/}` +
    `\nHEALING?:{red-fg}{bold}${isHealing}{/}` +
    `\nBOT NAME:{red-fg}{bold}${bot.username}{/}` +
    `\nBOT HEALTH:{red-fg}{bold}${bot.entity.metadata[7] + bot.entity.metadata[11]}{/}` +
    `\nALLY USERNAME:{red-fg}{bold}${allyUsername}{/}` +
    `\nTARGET USERNAME:{red-fg}{bold}${targetUsername}{/}` +
    `\nTARGET HEALTH:{red-fg}{bold}${targetHealth}{/}` +
    `\nLAST EQUIP ID:{red-fg}{bold}${lastEquippedId}{/}` +
    `\nCOORDINATES:{red-fg}{bold}${bot.entity.position}{/}` 
    //effects: { '14': { id: 14, amplifier: 15, duration: 32767 } }
    )
  }, 100)
}); // health? 3.063079595565796 metadata 7 11

bot.on('physicTick', () => {
  if (!isHunting || !isWindowLocked) return;

  const filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) < 128
  const entityTarget = bot.nearestEntity(filterEntity);

  if (entityTarget) {
    const strings = [`${master}`];
    const searchQuery = entityTarget.username
    allyUsername = strings.filter( str => str.indexOf(searchQuery) === 0);

    const filterEnemy = e => e.type === 'player'  && e.position.distanceTo(bot.entity.position) < 128 && e.username != `${allyUsername}`
    const enemyTarget = bot.nearestEntity(filterEnemy);

    if (enemyTarget) {
      targetUsername = enemyTarget.username;
      targetHealth = enemyTarget.metadata[7] + enemyTarget.metadata[11];
      bot.pvp.attack(enemyTarget);
    } else {
      targetUsername = null;
      targetHealth = null;
    }
  } else {
    allyUsername = null;
    targetUsername = null;
    targetHealth = null;
  }
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

/*
case /^st$/.test(data):
  const weapon = 'bow'
  const filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) < 128
  const entity = bot.nearestEntity(filterEntity)
  if (entity) {
    const target = bot.hawkEye.getPlayer(entity.username) 
    renderChatBox(target.username)
    if (target) bot.hawkEye.autoAttack(target, weapon);
  }
  //const blockPosition = {
  //  position: new Vec3(700, 223, -700),
  //  isValid: true
  //}
  //bot.hawkEye.oneShot(blockPosition, weapon);
break;

const cmd = message.split(' ')
if (cmd.length === 5) { // goto x y z
  const x = parseInt(cmd[2] + 0, 10)
  const y = parseInt(cmd[3], 10)
  const z = parseInt(cmd[4] + 0, 10)
  console.log(cmd)
  console.log(x, y, z)
  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalBlock(x, y, z))
} else if (cmd.length === 4) { // goto x z
  const x = parseInt(cmd[2] + 0, 10)
  const z = parseInt(cmd[3] + 0, 10)
  console.log(cmd)
  console.log(x, z)

  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalXZ(x, z))
} else if (cmd.length === 3) { // goto y
  const y = parseInt(cmd[1], 10)
  console.log(cmd)
  console.log(y)
  bot.pathfinder.setMovements(defaultMove)
  bot.pathfinder.setGoal(new GoalY(y))
}
*/