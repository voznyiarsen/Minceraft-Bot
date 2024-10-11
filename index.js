const mineflayer = require('mineflayer');
const PrettyError = require('pretty-error');

const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow } = require('mineflayer-pathfinder').goals;
const pvp = require('mineflayer-pvp').plugin;
const pvpLibrary = require('mineflayer-pvp');

const bloodhoundPlugin = require('mineflayer-bloodhound')(mineflayer);

const { screen, chatBox, functionBox, logBox, inputBox } = require('./scripts/ui');

const fs = require('fs');

const nbt = require('prismarine-nbt');
const Item = require('prismarine-item')('1.12.2')

const util = require('util');

const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('blessed', 'vm');
pe.skipPath(__filename);

const host = process.argv[2];
const username = process.argv[3];
const password = process.argv[4]; 
const master = process.argv[5];

const bot = mineflayer.createBot(
  {
    host: host,
    port: '25565',
    username: username,
    logErrors: false,
    hideErrors: true,
    checkTimeoutInterval: 60*1000,
    version: '1.12.2'
  }
);

const movements = new Movements(bot, bot.registry);

const status = {
  debug: '{white-bg}{black-fg}DEBUG{/} ',
  info: '{cyan-bg}{black-fg}INFO{/} ',
  ok: '{green-bg}{black-fg}OKAY{/} ',
  warn: '{yellow-bg}{black-fg}WARN{/} ',
  error: '{red-bg}{white-fg}ERROR{/} ',
  verbose: '{magenta-bg}{black-fg}VERBOSE{/} ',
  combat: '{red-bg}{white-fg}COMBAT{/} '
};

let isLogging = true;
let isVerbose = false;

let isAutoEquipping = true;
let isWindowLocked = false;

let [isHunting, isHealing, isEquippingOffHand, isEquippingMainHand] = [false, false, false, false];
let [armorStrikes, gappleStrikes, swordStrikes, totemStrikes, junkStrikes, buffStrikes, pearlStrikes, pvpStrikes] = [0, 0, 0, 0, 0, 0, 0, 0];

let pvpHitAttempts = 0;
let pvpHitSuccess = 0;


const bootsNbt = {
  type: 'compound',
  name: '',
  value: {
    CanDestroy: { type: 'list', value: { type: 'end', value: [] } },
    HideFlags: { type: 'int', value: 1 },
    display: {
      type: 'compound',
      value: {
        Lore: { type: 'list', value: { type: 'string', value: [ 'BOOTS' ] } }
      }
    },
    ench: {
      type: 'list',
      value: {
        type: 'compound',
        value: [
          {
            id: { type: 'short', value: 0 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 1 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 2 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 3 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 4 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 8 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 9 },
            lvl: { type: 'short', value: 2 }
          },
          {
            id: { type: 'short', value: 34 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 70 },
            lvl: { type: 'short', value: 1 }
          },
          {
            id: { type: 'short', value: 71 },
            lvl: { type: 'short', value: 1 }
          }
        ]
      }
    }
  }
}
const leggingsNbt = {
    type: 'compound',
    name: '',
    value: {
      CanDestroy: { type: 'list', value: { type: 'end', value: [] } },
      HideFlags: { type: 'int', value: 1 },
      display: {
        type: 'compound',
        value: {
          Lore: {
            type: 'list',
            value: { type: 'string', value: [ 'LEGGINGS' ] }
          }
        }
      },
      ench: {
        type: 'list',
        value: {
          type: 'compound',
          value: [
            {
              id: { type: 'short', value: 0 },
              lvl: { type: 'short', value: 4 }
            },
            {
              id: { type: 'short', value: 1 },
              lvl: { type: 'short', value: 4 }
            },
            {
              id: { type: 'short', value: 3 },
              lvl: { type: 'short', value: 4 }
            },
            {
              id: { type: 'short', value: 4 },
              lvl: { type: 'short', value: 4 }
            },
            {
              id: { type: 'short', value: 34 },
              lvl: { type: 'short', value: 3 }
            },
            {
              id: { type: 'short', value: 70 },
              lvl: { type: 'short', value: 1 }
            },
            {
              id: { type: 'short', value: 71 },
              lvl: { type: 'short', value: 1 }
            }
          ]
        }
      }
    }
  }
const chestplateNbt = {
  type: 'compound',
  name: '',
  value: {
    CanDestroy: { type: 'list', value: { type: 'end', value: [] } },
    HideFlags: { type: 'int', value: 1 },
    display: {
      type: 'compound',
      value: {
        Lore: {
          type: 'list',
          value: { type: 'string', value: [ 'HELMET' ] }
        }
      }
    },
    ench: {
      type: 'list',
      value: {
        type: 'compound',
        value: [
          {
            id: { type: 'short', value: 0 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 1 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 3 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 4 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 5 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 6 },
            lvl: { type: 'short', value: 1 }
          },
          {
            id: { type: 'short', value: 34 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 70 },
            lvl: { type: 'short', value: 1 }
          },
          {
            id: { type: 'short', value: 71 },
            lvl: { type: 'short', value: 1 }
          }
        ]
      }
    }
  }
}
const helmetNbt = {
  type: 'compound',
  name: '',
  value: {
    CanDestroy: { type: 'list', value: { type: 'end', value: [] } },
    HideFlags: { type: 'int', value: 1 },
    display: {
      type: 'compound',
      value: {
        Lore: {
          type: 'list',
          value: { type: 'string', value: [ 'CHESTPLATE' ] }
        }
      }
    },
    ench: {
      type: 'list',
      value: {
        type: 'compound',
        value: [
          {
            id: { type: 'short', value: 0 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 1 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 3 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 4 },
            lvl: { type: 'short', value: 4 }
          },
          {
            id: { type: 'short', value: 34 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 70 },
            lvl: { type: 'short', value: 1 }
          },
          {
            id: { type: 'short', value: 71 },
            lvl: { type: 'short', value: 1 }
          }
        ]
      }
    }
  }
}
const swordNbt = {
  type: 'compound',
  name: '',
  value: {
    CanDestroy: { type: 'list', value: { type: 'end', value: [] } },
    HideFlags: { type: 'int', value: 1 },
    display: {
      type: 'compound',
      value: {
        Lore: { type: 'list', value: { type: 'string', value: [ 'SWORD' ] } }
      }
    },
    ench: {
      type: 'list',
      value: {
        type: 'compound',
        value: [
          {
            id: { type: 'short', value: 16 },
            lvl: { type: 'short', value: 5 }
          },
          {
            id: { type: 'short', value: 17 },
            lvl: { type: 'short', value: 5 }
          },
          {
            id: { type: 'short', value: 18 },
            lvl: { type: 'short', value: 5 }
          },
          {
            id: { type: 'short', value: 20 },
            lvl: { type: 'short', value: 2 }
          },
          {
            id: { type: 'short', value: 21 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 22 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 34 },
            lvl: { type: 'short', value: 3 }
          },
          {
            id: { type: 'short', value: 70 },
            lvl: { type: 'short', value: 1 }
          },
          {
            id: { type: 'short', value: 71 },
            lvl: { type: 'short', value: 1 }
          }
        ]
      }
    }
  }
}

const potionNbt = {
  type: 'compound',
  name: '',
  value: {
    display: {
      type: 'compound',
      value: {
        Lore: {
          type: 'list',
          value: { type: 'string', value: [ 'POTION' ] }
        }
      }
    },
    Potion: { type: 'string', value: 'minecraft:strong_strength' }
  }
}

const nbtBlock = {
  bootsNbt: bootsNbt, leggingsNbt: leggingsNbt, chestplateNbt: chestplateNbt, helmetNbt: helmetNbt, swordNbt: swordNbt, potionNbt: potionNbt
}
// This is a fucked up way to do this, use a separate file for nbt pls

const cooldown = {}
//
// LOAD PLUGINS
//
bot.once('inject_allowed', () => {
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bloodhoundPlugin(bot);

  bot.bloodhound.yaw_correlation_enabled = true;

  bot.pvp.movements.allowEntityDetection = false;
  // 1 
  bot.pvp.movements.allowFreeMotion = true;
  bot.pvp.movements.allowParkour = true;
  bot.pvp.movements.maxDropDown = 255;

  bot.pvp.movements.allow1by1towers = false;
  bot.pvp.movements.canOpenDoors = false;
  bot.pvp.movements.canDig = false;

  bot.pvp.movements.scafoldingBlocks = [null];

  bot.pvp.movements.infiniteLiquidDropdownDistance = false;

  //bot.pvp.attackRange = 6;
  //bot.pvp.followRange = 2;

  //bot.pvp.meleeAttackRate = new pvpLibrary.RandomTicks(10,11);

  bot.pvp.movements.blocksToAvoid.add(bot.registry.blocksByName.web.id);
  bot.pvp.movements.blocksToAvoid.add(bot.registry.blocksByName.water.id);
  bot.pvp.movements.blocksToAvoid.add(bot.registry.blocksByName.lava.id);

  movements.allowEntityDetection = false;
  // 1 
  movements.allowFreeMotion = true;
  movements.allowParkour = true;
  movements.maxDropDown = 255;

  movements.allow1by1towers = false;
  movements.canOpenDoors = false;
  movements.canDig = false;

  movements.scafoldingBlocks = [null];

  movements.infiniteLiquidDropdownDistance = false;

  movements.blocksToAvoid.add(bot.registry.blocksByName.web.id);
  movements.blocksToAvoid.add(bot.registry.blocksByName.water.id);
  movements.blocksToAvoid.add(bot.registry.blocksByName.lava.id);
});
//
// SERVER CHAT COMMANDS (AUTOMATED)
//
const cooldownTypes = ['pvp','gapple','pearl']
for (const type in cooldownTypes) {
  cooldown[cooldownTypes[type]] = {time: 0, lock: false}
}

async function handleCooldown(data, type) {
  const regex = /\d+/;
  const match = regex.exec(data.toString());
  const value = match ? match[0] : null;

  renderChatBox(`${status.info}Cooldown for ${type} started, ${value} seconds left`)
  if (value > 0) cooldown[type].time = value; else return;


  if (!cooldown[type].lock) {
    while (cooldown[type].time > 0) {
      cooldown[type].lock = true;
      cooldown[type].time--;
      await bot.waitForTicks(20);
    }
  }

  if (cooldown[type].time <= 0 && cooldown[type].lock === true){
    //await bot.waitForTicks(10);
    cooldown[type].time = 0;
    cooldown[type].lock = false;
    renderChatBox(`${status.info}Cooldown for ${type} ended ${cooldown[type].lock} ${cooldown[type].time}`)
  }
}


bot.on('message', async (data) => {
  const filteredMessages = [
    /^Режим PVP, не выходите из игры \d+ секунд.*\.$/,
    //
  ]
  if (!filteredMessages.some(regex => regex.test(data))) renderChatBox(`>>>${data.toAnsi()}<<<`);

  switch(true) {
    case data == '[❤] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом.':
      isWindowLocked = false;
      renderChatBox(`${status.debug}isWindowLocked? ${isWindowLocked}`);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case /^\s+Добро пожаловать на ＭｉｎｅＬｅｇａｃｙ$/.test(data):
      isWindowLocked = true;
      renderChatBox(`${status.debug}isWindowLocked? ${isWindowLocked}`);
    break;
    case /^Вы сможете использовать золотое яблоко через \d+ секунд.*\.$/.test(data):
      handleCooldown(data, 'gapple');
    break;
    case /^Режим PVP, не выходите из игры \d+ секунд.*\.$/.test(data):
      handleCooldown(data, 'pvp');
    break;
    case /^Вы сможете использовать данный предмет через \d+ сек\.$/.test(data):
      handleCooldown(data, 'pearl');
    break;
    case data == 'Войдите - /login [пароль]':
      bot.chat(`/l ${password}`)
    break
    case data == 'PVP окончено':
      renderChatBox(`${status.combat}${status.info}Exited PvP state`);
    break;
    case data == '[!] Извините, но Вы не можете PvP здесь.':
      pvpStrikes++;
      if (pvpStrikes > 3) {
        resetCombatVariables();
        isHunting = false;
        pvpStrikes = 0;
        renderChatBox(`${status.combat}${status.info}Cant PvP here, stopping`);
      }
    break;
  }
}); 
//
// CLI COMMANDS
//
inputBox.on('submit', async function (data) {
  const command = data.split(' ');
  switch(true) {
    // TOSS
    case /^ts \d+ \d+$/.test(data):
      tossItem(command[2], command[1]);
    break;
    case /^ts \w+$/.test(data):
      tossItem(command[1]);
    break;
    case /^tsall$/.test(data):
      tossAllItems();
    break;
    // EQUIP
    case /^eq [\w-]+ \d+$/.test(data):
      equipItem(command[2], command[1]);
    break;
    case /^sweq$/.test(data):
      isAutoEquipping = !isAutoEquipping;
      renderChatBox(`${status.ok}isAutoEquipping set to ${isAutoEquipping}`);
    break;
    // UNEQUIP
    case /^uneq [\w-]+$/.test(data):
      unequipItem(command[1]);
    break;
    case /^uneqall$/.test(data): 
      unequipAllItems();
    break;
    // RESET
    case /^s$/.test(data):
      resetCombatVariables();
    break;
    case /^g$/.test(data):
      isHunting = !isHunting;
      if (!isHunting) resetCombatVariables();
      renderChatBox(`${status.ok}isHunting set to ${isHunting}`);
    break;
    case /^f$/.test(data):
      followPlayer();
    break;
    case /^test$/.test(data): {
      const datablock = [
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null)?.nbt,{ depth: null, colors: false }),
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null)?.nbt,{ depth: null, colors: false }),
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null)?.nbt,{ depth: null, colors: false }),
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null)?.nbt,{ depth: null, colors: false }),
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null)?.nbt,{ depth: null, colors: false }),
      util.inspect(bot.inventory.findInventoryItem(bot.registry.itemsByName.potion.id, null)?.nbt,{ depth: null, colors: false })
      ]
      for (const data in datablock)
      fs.appendFile('outpuasasdt.txt', datablock[data], (err) => {
        renderChatBox('File written successfully');
      });
      //
      //renderChatBox(util.inspect(bot.getEquipmentDestSlot('off-hand')))
      }
    break;
    case /^rep$/.test(data):
      replenishItems()
    break;
    case /^l$/.test(data):
      renderChatBox(`${status.ok}isLogging set to ${!isLogging}`);
      isLogging = !isLogging;
      renderChatBox(`${status.ok}isLogging set to ${isLogging}`);
    break;
    case /^v$/.test(data):
      isVerbose = !isVerbose
      renderChatBox(`${status.ok}isVerbose set to ${isVerbose}`)
    break;
    case /^i$/.test(data):
      renderChatBox(sayItems());
    break;
    case /^p$/.test(data):
      renderChatBox(sayPlayers());
    break;
    case /^q$/.test(data):
      bot.end();
      process.exit(0);
    default:
      renderChatBox(`${status.debug}Sending >>>${data}<<<`);
      bot.chat(`${data}`);
      inputBox.setValue('');
    return;
  }
  inputBox.setValue('');
});
//
// RENDERING UI TEXT
// 
function renderChatBox(text) {
  if (!isLogging) return;
  chatBox.log(`${text}{|}{gray-fg}${new Date().toLocaleString()}{/} `);
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
}
function renderFunctionBox(text) {
  if (!isLogging) return;
  functionBox.setContent(`{center}${text}{/}`);
  functionBox.scrollTo(functionBox.getScrollHeight());
  screen.render();
}
function logError(err) {
  chatBox.pushLine(pe.render(err));
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
}
//
// FUNCTIONS: INVENTORY/SLOT MANAGEMENT
//
async function unequipItem (destination) {
  const t0 = performance.now();
  try {
    await bot.unequip(destination);
    const t1 = performance.now();
    renderChatBox(`${status.ok}Unequipped ${destination} in ${(t1 - t0).toFixed(2)}ms`);
  } catch (err) {
    logError(err.message);
  }
}
async function unequipAllItems() {
  const unequipPieces = [
    { type: 'head', slot: 5 },
    { type: 'torso', slot: 6 },
    { type: 'legs', slot: 7 },
    { type: 'feet', slot: 8 },
    { type: 'off-hand', slot: 45 }
  ];
  for (const piece of unequipPieces) {
    if (bot.inventory.slots[piece.slot] != null) {
      await bot.waitForTicks(2);
      await unequipItem(piece.type);
    }
  }
}
async function equipItem (itemId, destination) {
  const t0 = performance.now();
  itemId = parseInt(itemId, 10);
  if (itemId) {
    try {
      await bot.equip(itemId, destination);
      const t1 = performance.now();
      renderChatBox(`${status.ok}Equipped ${itemId} to ${destination} in ${(t1 - t0).toFixed(2)}ms`);
    } catch (err) {
      logError(err.message);
    }
  } else renderChatBox(`${status.warn}I have nothing to equip`);
}
async function tossItem (itemId, amount) {
  const t0 = performance.now();
  amount = parseInt(amount, 10);
  itemId = parseInt(itemId, 10);
  if (!itemId) {
    renderChatBox(`${status.warn}I have no id of the item to toss`);
  } else {
    try {
      if (amount) {
        await bot.toss(itemId, null, amount);
        const t1 = performance.now();
        renderChatBox(`${status.ok}Tossed ${amount} x ${itemId} in ${(t1 - t0).toFixed(2)}ms`);
      } else {
        await bot.tossStack(itemId);
        const t1 = performance.now();
        renderChatBox(`${status.ok}Tossed ${itemId} in ${(t1 - t0).toFixed(2)}ms`);
      }
    } catch (err) {
        logError(err.message);
    }
  }
}
async function tossAllItems() {
  const t0 = performance.now();
  const output = bot.inventory.items().filter(item => item).map(item => item.type);

  for (const id of output) {
    const item = bot.inventory.findInventoryItem(id, null);

    await bot.waitForTicks(2);
    await tossItem(item.type, item.count);
  }
  const t1 = performance.now();
  renderChatBox(`${status.ok}Done in ${(t1 - t0).toFixed(2)}ms`);
}
//
// FUNCTIONS: MAPPING FUNCTIONS
//
function mapItemRarity(item) {
  if (item && item.nbt?.value?.ench?.value?.value?.length >= 1) {
    return `{cyan-fg}${item.name}{/} ${item.type} ${item.slot} ${item.count}`;
  } else if (item) {
    return `${item.name} ${item.type} ${item.slot} ${item.count}`;
  }
}
function sayItems() {
  const output = bot.inventory.items().map(mapItemRarity).join('\n ');
  const outputCount = bot.inventory.items().map((item) => item).filter(Boolean).length;
  if (output) return `${status.info}${outputCount} items in inventory\n ${output}`; else return `${status.info}Empty`;
}

function isPointIn3d(point, minCoords, maxCoords) {
  const [x, y, z] = point;
  const [minX, minY, minZ] = minCoords;
  const [maxX, maxY, maxZ] = maxCoords;

  return (minX <= x && x <= maxX) && (minY <= y && y <= maxY) && (minZ <= z && z <= maxZ);
}

function isPointInCylinder(point, coords, radius, height) {
  const [px, py, pz] = point;
  const [cx, cy, cz] = cylinderCenter;

  if (pz < cz || pz > cz + height) {
      return false;
  }

  const distanceSquared = (px - cx) ** 2 + (py - cy) ** 2;
  return distanceSquared <= radius ** 2;
}

async function replenishItems() {
  const data = fs.readFileSync('./inventory-nbt.conf', 'utf8');
  const lines = data.split('\n');


  for (const line in lines) {
    const result = JSON.parse(lines[line]);

    for (const slot in result.slots) {
      const type = bot.registry.itemsByName[result.type].id

      renderChatBox(`${status.debug}Setting ${result.type} ${type} to ${result.slots[slot]} ${result.count} ${result.metadata} ${nbtBlock[result.nbt]}`)

      bot.creative.setInventorySlot(result.slots[slot],new Item(type, result.count, result.metadata, nbtBlock[result.nbt]))
      await bot.waitForTicks(5);
    }
    //
  
  }

}

async function tossPearl() {
  const filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) > 4 && bot.players[e.username]?.gamemode === 0 && e.username === bot.pvp.target?.username;
  const entity = bot.nearestEntity(filterEntity);
  if (!entity) return;

  const distance = entity.position.distanceTo(bot.entity.position);

  const g = 1.6;
  const initialVelocity = 10; // per second

  const sineTheta = (g * distance) / (initialVelocity * initialVelocity);

  if (sineTheta < -1 || sineTheta > 1) {
      throw new Error(`${status.error}The distance is too far for the given initial velocity.`);
  }

  const angleInRadians = 0.5 * Math.asin(sineTheta);
  const angleInDegrees = angleInRadians * (180 / Math.PI);

  const angleInBlocks = distance * Math.sin(angleInRadians) + 1.6;

  const banner = `${status.info}${angleInRadians.toFixed(2)}rad\n${status.info}${angleInDegrees.toFixed(2)}°\n${status.info}${distance.toFixed(2)} block distance\n${status.info}${angleInBlocks.toFixed(2)} block offset`;
  
  renderChatBox(banner);

  const pearl = bot.inventory.findInventoryItem(bot.registry.itemsByName.ender_pearl.id, null);
  if (pearl) {
    pearlStrikes++;
      if (pearlStrikes >= 2) {
        renderChatBox(`${status.warn}Pearl timeout at ${pearlStrikes}`);
        await bot.waitForTicks(5);
        pearlStrikes = 0;
        return;
      }
    
      if (bot.heldItem?.type != pearl.type) {
      equipItem(pearl.type, 'hand');
      bot.waitForTicks(2);
    }

    await bot.lookAt(entity.position.offset(0,angleInBlocks,0), true);
    await bot.waitForTicks(2);

    renderChatBox(`${status.info}Throwing pearl`);
    bot.activateItem();
  }
}

function sayItemCount(itemId) {
  const slots = [bot.getEquipmentDestSlot('head'),bot.getEquipmentDestSlot('torso'),bot.getEquipmentDestSlot('legs'),bot.getEquipmentDestSlot('feet'),bot.getEquipmentDestSlot('off-hand')]

  let output = bot.inventory.items().map((item) => { if (item.type === bot.registry.itemsByName[itemId].id) return item.count; }).filter(Boolean).reduce((acc, current) => acc + current, 0);;
  for (const slot in slots) {
    if (bot.inventory.slots[slots[slot]]?.type === bot.registry.itemsByName[itemId].id) output += bot.inventory.slots[slots[slot]]?.count;
  }
  return output;
}
//
// FUNCTIONS: PLAYER INTERACTION
//
function followPlayer() {
  const fplayer = bot.players[master];
  if (!fplayer.entity) return;

  const goal = new GoalFollow(fplayer.entity, 1);
  bot.pathfinder.setMovements(movements);
  bot.pathfinder.setGoal(goal, true);
}

function resetCombatVariables() {
  bot.pvp.forceStop();
  bot.pathfinder.setGoal(null);
  renderChatBox(`${status.ok}resetCombatVariables completed`);
}
//
// FUNCTIONS: COMBAT INVENTORY MANAGMENT
//
async function equipArmor() {
  const armorPieces = [
    { destination: 'head', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null), minEnch: 9 },
    { destination: 'torso', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null), minEnch: 7 },
    { destination: 'legs', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null), minEnch: 7 },
    { destination: 'feet', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null), minEnch: 10 }
  ];

  for (const piece of armorPieces) {
    if (bot.inventory.slots[bot.getEquipmentDestSlot(piece.destination)] === null) {
      
      if (piece.item?.nbt && piece.item && nbt.simplify(piece.item.nbt).ench.length >= piece.minEnch) {
        armorStrikes++;
        if (armorStrikes >= 2) {
          renderChatBox(`${status.warn}${piece.destination} timeout at ${armorStrikes}`);
          await bot.waitForTicks(5);
          armorStrikes = 0;
          return;
        }
        isEquippingMainHand = true;
        await bot.waitForTicks(2);
        await equipItem(piece.item.type, piece.destination);
        isEquippingMainHand = false;
      }
    }
  }
}

async function equipGapple() {
  if ((bot.health + bot.entity?.metadata[11]) <= 16.5 && sayItemCount('totem_of_undying') === 0 || (bot.health + bot.entity?.metadata[11]) <= 16.5 && (bot.health + bot.entity?.metadata[11]) > 5 && sayItemCount('totem_of_undying') >= 1 || bot.food <= 14.5) {
    const gapple = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null);
    if (gapple) {
      gappleStrikes++;
      if (gappleStrikes >= 2) {
        renderChatBox(`${status.warn}Gapple timeout at ${gappleStrikes} at ${(bot.health+bot.entity.metadata[11]).toFixed(2)} health`);
        await bot.waitForTicks(45);
        gappleStrikes = 0;
        return;
      }
      const t0 = performance.now();
      isHealing = true;
      isEquippingOffHand = true;
      await bot.waitForTicks(2);

      renderChatBox(`${status.debug}Healing function started at ${(bot.health+bot.entity.metadata[11]).toFixed(2)} health`);
      await equipItem(gapple.type, 'off-hand');

      renderChatBox(`${status.debug}Activating held item at ${(bot.health+bot.entity.metadata[11]).toFixed(2)} health`);
      bot.activateItem(true);
      await bot.waitForTicks(35);

      renderChatBox(`${status.debug}Deactivating held item at ${(bot.health+bot.entity.metadata[11]).toFixed(2)} health`);
      bot.deactivateItem();
      isEquippingOffHand = false;
      isHealing = false;
      const t1 = performance.now()
      renderChatBox(`${status.ok}Healing function finished in ${(t1 - t0).toFixed(2)}ms at ${(bot.health+bot.entity.metadata[11]).toFixed(2)} health`);
    }
  }
}

async function equipTotem() {
  if (bot.inventory.slots[45]?.type != bot.registry.itemsByName.totem_of_undying.id) {
    const totem = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);
    if (totem) {
      totemStrikes++;
      if (totemStrikes >= 2) {
        renderChatBox(`${status.warn}Totem timeout at ${totemStrikes}`);
        await bot.waitForTicks(5);
        totemStrikes = 0;
        return;
      }
      isEquippingOffHand = true;
      await bot.waitForTicks(2);
      await equipItem(totem.type, 'off-hand');
      isEquippingOffHand = false;
    }
  } 
}

async function equipSword() {
  bot.updateHeldItem()
  if (bot.heldItem?.type != bot.registry.itemsByName.diamond_sword.id) {
    const sword = bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null);
    //if (!sword?.nbt) return;
    if (sword?.nbt && sword && nbt.simplify(sword.nbt).ench.length >= 8) {
      swordStrikes++
      if (swordStrikes >= 2) {
        renderChatBox(`${status.warn}Sword timeout at ${swordStrikes}`);
        await bot.waitForTicks(5);
        swordStrikes = 0;
        return;
      }
      isEquippingMainHand = true;
      await bot.waitForTicks(2);
      await equipItem(sword.type, 'hand');
      isEquippingMainHand = false;
    }
  }
}

async function equipBuff() { // potion 
  bot.updateHeldItem()
  if (bot.heldItem?.type != bot.registry.itemsByName.gunpowder.id) {
    const buff = bot.inventory.findInventoryItem(bot.registry.itemsByName.gunpowder.id, null)
    if (buff && !bot.entity.effects['5'] && bot.pvp.target) {
      if (buffStrikes >= 2) {
        renderChatBox(`${status.warn}Buff timeout at ${buffStrikes}`)
        await bot.waitForTicks(5);
        buffStrikes = 0;
        return;
      }
      isEquippingMainHand = true;
      await bot.waitForTicks(2);
      await equipItem(buff.type, 'hand');
      bot.activateItem();
      isEquippingMainHand = false;
    }
  }
}

async function tossJunk() {
  const junkArray = [
    bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null), 
    bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null)
  ];
  
  for (const id in junkArray) {
    const item = junkArray[id]
    if (item) {
      junkStrikes++;
      if (junkStrikes >= 2) {
        await bot.waitForTicks(5);
        junkStrikes = 0;
        return;
      }
      isEquippingMainHand = true;
      await bot.waitForTicks(2);
      await tossItem(item.type, item.count);
      isEquippingMainHand = false;
    }
  }
}
//
// FUNCTIONS: TARGETING
//
function huntPlayer() {
  const filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 64 && bot.players[e.username]?.gamemode === 0 && e.username != master;

  const entity = bot.nearestEntity(filterEntity);
  if (entity) { 
    bot.pvp.attack(entity);
    bot.lookAt(entity.position.offset(0, 1.6, 0), true);
  } else {
    bot.pvp.forceStop();
  }
}
//
// FUNCTION LOOP
//
bot.on('physicsTick', () => {
  if (!isWindowLocked || !isAutoEquipping) return;
  // HIGH PRIORITY
  if (cooldown['gapple'].time === 0 && !cooldown['gapple'].lock && gappleStrikes < 2) equipGapple(); // OFFHAND
  if (isEquippingOffHand) return;
  // MEDIUM PRIORITY
  if (totemStrikes < 2) equipTotem(); // OFFHAND
  if (isEquippingMainHand) return;
  // LOW PRIORITY*/
  if (armorStrikes < 2) equipArmor(); // MAIN HAND
  if (swordStrikes < 2) equipSword(); // MAIN HAND
  // LOWER PRIORITY
  if (isHealing) return;
  //if (buffStrikes < 2) equipBuff(); // MAIN HAND
  // LOWEST PRIORITY
  if (cooldown['pearl'].time === 0 && !cooldown['pearl'].lock && pearlStrikes < 2) tossPearl(); // MAIN HAND
  if (isHunting) huntPlayer();
  if (isHunting) return; 
  if (junkStrikes < 2) tossJunk(); // MAIN HAND
});

bot.on('physicsTick', () => {
    const banner = 
    `BU (${bot.username}) ` +
    `BH (${(bot.health+bot.entity?.metadata[11]).toFixed(1)}) ` +
    `EU (${bot.pvp.target?.username}) ` +
    `EH (${(bot.pvp.target?.metadata[7]+bot.pvp.target?.metadata[11]).toFixed(1)}) ` +
    `TC (${sayItemCount('totem_of_undying')}) ` +
    `GC (${sayItemCount('golden_apple')}) ` + 
    `HCLF (${sayItemCount('diamond_helmet')}/${sayItemCount('diamond_chestplate')}/${sayItemCount('diamond_leggings')}/${sayItemCount('diamond_boots')}) ` +
    `AD (${(((363 - bot.inventory.slots[5]?.durabilityUsed) / 363) * 100).toFixed(1)} ${(((528 - bot.inventory.slots[6]?.durabilityUsed) / 528) * 100).toFixed(1)} ${(((495 - bot.inventory.slots[7]?.durabilityUsed) / 495) * 100).toFixed(1)} ${(((429 - bot.inventory.slots[8]?.durabilityUsed) / 429) * 100).toFixed(1)}) ` +
    `HSR (${((pvpHitSuccess/pvpHitAttempts)*100).toFixed(1)}%)\n`+
    `CD (${cooldown['pvp']?.time} ${cooldown['pvp']?.lock})(${cooldown['gapple']?.time} ${cooldown['gapple']?.lock})(${cooldown['pearl']?.time} ${cooldown['pearl']?.lock})`
    renderFunctionBox(banner);
}); 
//
// bot.on() EVENT TRIGGERS
//
bot.on('windowOpen', async (window) => {
  if (isWindowLocked) return;
  await bot.clickWindow(0,0,0); // mlegacy.ru
  await window.close();
});

bot._client.on('entity_velocity', () => {
  if (isVerbose) renderChatBox(`${status.verbose}${status.debug}Velocity event triggered\n isInWater? ${bot.entity.isInWater} isInLava? ${bot.entity.isInLava} isInWeb ${bot.entity.isInWeb}\n Velocity X${bot.entity.velocity.x} Velocity Y${bot.entity.velocity.y} Velocity Z${bot.entity.velocity.z}`);
  if (bot.entity.isInWater || bot.entity.isInLava || bot.entity.isInWeb) return;
  setTimeout(() => {
    bot.entity.velocity.x = 0;
    //bot.entity.velocity.y = 0;
    bot.entity.velocity.z = 0;
  }, 0);
});

bot.on('scoreRemoved', () => {
  if (cooldown['pvp'].lock || !bot.players[master]) return;
  const dynamicKeyRegex = /^\s*.*Денег:.*\$$/;
  const dynamicKey = Object.keys(bot.scoreboards.JampireBoard.itemsMap).find(key => dynamicKeyRegex.test(key));

  const regex = /\d+/;
  const match = regex.exec(bot.scoreboards.JampireBoard.itemsMap[dynamicKey]?.name.toString());
  const value = match ? match[0] : null;

  if (value > 0) bot.chat(`/pay ${master} ${value}`);
});

/* TSIS WILL BREAK SOON
bot.on('onCorrelateAttack', (attacker,victim) => {
  if (victim.username === bot.username || victim.username === master) {
    renderChatBox(`${status.combat}${status.info}${(victim.username)} attacked by ${(attacker.username)}\n BH ${(bot.health+bot.entity.metadata[11]).toFixed(2)} TC ${sayItemCount('totem_of_undying')} AC ${sayArmor()} GC ${sayItemCount('golden_apple')}`);
    if (attacker.username != master && attacker.username != bot.username) {
      bot.pvp.attack(attacker);
      bot.lookAt(entity.position.offset(0, 1.6, 0), true);
    }
  }
});
*/
bot.on('attackedTarget', () => {
  pvpHitAttempts++;
  bot.setControlState('jump', true);
  bot.setControlState('jump', false);
});

bot.on('entityHurt', entity => entity.username === bot.pvp.target?.username && pvpHitSuccess++);

bot.on('death', async () => {
  renderChatBox(`${status.combat}${status.warn}${bot.username} has died`);
  resetCombatVariables();
  await bot.waitForTicks(241);
  bot.chat('/home');
});

bot.on('error', err => {
  chatBox.pushLine(pe.render(err));
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
});

process.on('uncaughtException', (err) => {
  chatBox.pushLine(pe.render(err));
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
});

screen.key(['C-z'], () => logBox.focus());
screen.key(['C-x'], () => chatBox.focus());

screen.key(['return', 'enter'], () => {
  inputBox.submit();
  inputBox.focus();
});

screen.key(['escape'], function() {
  bot.end();
  process.exit(0);
});
// buffers and shit

