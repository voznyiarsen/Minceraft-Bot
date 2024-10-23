const mineflayer = require('mineflayer');
const PrettyError = require('pretty-error');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow } = require('mineflayer-pathfinder').goals;
const pvp = require('mineflayer-pvp').plugin;
const pvpLibrary = require('mineflayer-pvp');
const bloodhoundPlugin = require('mineflayer-bloodhound')(mineflayer);
const { screen, chatBox, functionBox, logBox, inputBox } = require('./scripts/ui');
const fs = require('fs');
const vec = require('vec3')
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
// COLOR CODING
// LOG WHITE
// WARN YELLOW
// ERROR RED
// CONSUMABLE MAGENTA
// NON-CONSUMABLE BLUE
// INFO CYAN
// SUCCESS GREEN

const status = {
  gapple: '{magenta-bg}{black-fg}GAPPLE{/} ',
  buff: '{magenta-bg}{black-fg}BUFF{/} ',
  pearl: '{magenta-bg}{black-fg}PEARL{/} ',
  //
  armor: '{blue-bg}{white-fg}ARMOR{/} ',
  totem: '{blue-bg}{white-fg}TOTEM{/} ',
  passive: '{white-bg}{black-fg}PASSIVE{/} ',
  //
  good: '{green-fg}',
  mediocre: '{yellow-fg}',
  bad: '{red-fg}',
  //
  debug: '{white-bg}{black-fg}DEBUG{/} ',
  warn: '{yellow-bg}{black-fg}WARN{/} ',
  error: '{red-bg}{white-fg}ERROR{/} ',
  info: '{cyan-bg}{black-fg}INFO{/} ',
  ok: '{green-bg}{black-fg}OKAY{/} ',
  verbose: '{cyan-bg}{black-fg}VERBOSE{/} ',

  pvp: '{red-bg}{white-fg}PVP{/} '
};

let isLogging = true;

let isAutoEquipping = true;
let isWindowLocked = false;

let [isHunting, isHealing] = [false, false];
let [armorStrikes, gappleStrikes, passiveStrikes, totemStrikes, junkStrikes, buffStrikes, pearlStrikes, pvpStrikes] = [0, 0, 0, 0, 0, 0, 0, 0];

let pvpHitAttempts = 0;
let pvpHitSuccess = 0;

let combatMode = 2;

let allies = [master, 'Plotva', 'maksim2008'];

let isJesusing = false;
let isJesusReady = false;

const cylinder1 = {
  center: [2190.5, 0, 1003.5],
  radius: 39.7,
  height: 255
};

const cylinder2 = {
  center: [2190.5, 76, 1003.5],
  radius: 45.9,
  height: 255
};

const bootsNbt =
{ type: 'compound', name: '', value: { display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'BOOTS' ] } } } }, CanDestroy: { type: 'list', value: { type: 'end', value: [] } }, ench: { type: 'list', value: { type: 'compound', value: [ { id: { type: 'short', value: 0 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 1 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 2 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 3 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 4 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 8 }, lvl: { type: 'short', value: 3 } },/*FW{ id: { type: 'short', value: 9 }, lvl: { type: 'short', value: 2 } },*/ { id: { type: 'short', value: 34 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 70 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 71 }, lvl: { type: 'short', value: 1 } } ] } } } }
const leggingsNbt =
{ type: 'compound', name: '', value: { display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'LEGGINGS' ] } } } }, CanDestroy: { type: 'list', value: { type: 'end', value: [] } }, ench: { type: 'list', value: { type: 'compound', value: [ { id: { type: 'short', value: 0 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 1 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 3 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 4 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 34 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 70 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 71 }, lvl: { type: 'short', value: 1 } } ] } } } }
const chestplateNbt =
{ type: 'compound', name: '', value: { display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'CHESTPLATE' ] } } } }, CanDestroy: { type: 'list', value: { type: 'end', value: [] } }, ench: { type: 'list', value: { type: 'compound', value: [ { id: { type: 'short', value: 0 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 1 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 3 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 4 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 34 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 70 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 71 }, lvl: { type: 'short', value: 1 } } ] } } } }
const helmetNbt =
{ type: 'compound', name: '', value: { display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'HELMET' ] } } } }, CanDestroy: { type: 'list', value: { type: 'end', value: [] } }, ench: { type: 'list', value: { type: 'compound', value: [ { id: { type: 'short', value: 0 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 1 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 3 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 4 }, lvl: { type: 'short', value: 4 } }, { id: { type: 'short', value: 5 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 6 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 34 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 70 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 71 }, lvl: { type: 'short', value: 1 } } ] } } } }
const swordNbt =
{ type: 'compound', name: '', value: { CanDestroy: { type: 'list', value: { type: 'end', value: [] } }, HideFlags: { type: 'int', value: 1 }, display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'SWORD' ] } } } }, ench: { type: 'list', value: { type: 'compound', value: [ { id: { type: 'short', value: 16 }, lvl: { type: 'short', value: 5 } }, { id: { type: 'short', value: 17 }, lvl: { type: 'short', value: 5 } }, { id: { type: 'short', value: 18 }, lvl: { type: 'short', value: 5 } }, { id: { type: 'short', value: 20 }, lvl: { type: 'short', value: 2 } }, { id: { type: 'short', value: 21 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 22 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 34 }, lvl: { type: 'short', value: 3 } }, { id: { type: 'short', value: 70 }, lvl: { type: 'short', value: 1 } }, { id: { type: 'short', value: 71 }, lvl: { type: 'short', value: 1 } } ] } } } };
const potionNbt =
{ type: 'compound', name: '', value: { display: { type: 'compound', value: { Lore: { type: 'list', value: { type: 'string', value: [ 'POTION' ] } } } }, Potion: { type: 'string', value: 'minecraft:strong_strength' } } };
const nbtBlock =
{BOOTS: bootsNbt, LEGGINGS: leggingsNbt, CHESTPLATE: chestplateNbt, HELMET: helmetNbt, SWORD: swordNbt, POTION: potionNbt, NONE: null};

const cooldown = {};
const cooldownTypes = ['pvp','gapple','pearl','buff']
for (const type of cooldownTypes) cooldown[type] = {time: 0, lock: false};

const lockValue = {};
const lockValueTypes = ['hand','off-hand','isEquippingHead','isEquippingTorso','isEquippingLegs','isEquippingFeet'];
for (const type of lockValueTypes) lockValue[type] = false;

const strikeValue = {};
const strikeValueTypes = [];
//
// LOAD PLUGINS
//
bot.once('inject_allowed', () => {
  //bot.physicsEnabled = false;
  bot.setMaxListeners(999);

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bloodhoundPlugin(bot);

  bot.physics.yawSpeed = 10*10^5;

  bot.pathfinder.thinkTimeout = 2500;
  bot.pathfinder.tickTimeout = 40;

  bot.bloodhound.yaw_correlation_enabled = true;

  bot.pvp.movements.allowEntityDetection = true;
  //bot.pvp.movements.allowFreeMotion = true;
  bot.pvp.movements.allowParkour = true;
  bot.pvp.movements.maxDropDown = 256;

  bot.pvp.movements.allow1by1towers = false;
  bot.pvp.movements.canOpenDoors = false;
  bot.pvp.movements.canDig = false;

  bot.pvp.movements.scafoldingBlocks = [null];


  bot.pvp.movements.infiniteLiquidDropdownDistance = true;
  bot.pvp.attackRange = 4;
  bot.pvp.followRange = 2;
  //bot.pvp.meleeAttackRate = new pvpLibrary.RandomTicks(10,11);

  bot.pvp.viewDistance = 256;
  bot.pvp.movements.blocksToAvoid = new Set();
  bot.pvp.movements.blocksToAvoid.add(30);
  bot.pvp.movements.emptyBlocks.delete(30);
});
//
// SERVER CHAT COMMANDS (AUTOMATED)
//
bot.on('message', async (data) => {
  const filteredMessages = [
    /^Режим PVP, не выходите из игры \d+ секунд.*\.$/,
    // better regex make
  ];
  if (!filteredMessages.some(regex => regex.test(data))) renderChatBox(`>>>${data.toAnsi()}<<<`);
  switch(true) {
    case /^Вы были телепортированы в Lobby.+$/.test(data):
      isWindowLocked = false;
      renderChatBox(`${status.info}isWindowLocked? ${isWindowLocked}`);
      await bot.waitForTicks(5);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case /^Установлен режим полета включен для .+$/.test(data): 
      bot.chat(`/fly`);
    break;
    case /^\[MineLegacy\] Вы убили игрока .+, и получили за это \$\d+\.\d+\. Нанесённый урон: \d+\.\d\/\d+\.\d$/.test(data): {
      let insults = ["БЫЛ ПОПУЩЕН",
        "БЫЛ ПРИХЛОПНУТ ТАПКОМ",
        "EZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
        "ПОСЫПАЛСЯ EZZZZZZZZZ",
        "ТЫ БЫ ХОТЬ КИЛЛКУ ВКЛЮЧИЛ",
        "СЛОЖИЛСЯ ПОПОЛАМ",
        "ТУДААААААААААААА",
        "ИЗИ БЛЯТЬ ХАХАХААХХАХАХА",
        "УЛЕТЕЛ НА ТОТ СВЕТ",
        "ПОПУЩЕННННННН",
        "БОЖЕ ЕЗЗКА",
        "ИЗИИИИИИИИИИИИ",
        "ЧЕ ТАК ЛЕГКО????",
        "АХАХАХААХАХАХАХХААХАХ",
        "ЛЕГЧАЙШАЯ",
        "GG EZ",
        "НУЛИНА",
        "ЛЕЖАТЬ ПЛЮС СОСАТЬ",
        "ИЗИ БОТЯРА"];
      const randomIndex = Math.floor(Math.random() * insults.length);
      bot.chat(`!${bot.pvp.target.username} ${insults[randomIndex]}`);
    }
    break;
    case /^\[MineLegacy\] Вы были убиты игроком .+, и потеряли \$\d+\.\d+\.$/.test(data):
      //
    break;
    case data == '[❤] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом.':
      isWindowLocked = false;
      renderChatBox(`${status.info}isWindowLocked? ${isWindowLocked}`);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case /^\s{43}$/.test(data):
      isWindowLocked = true;
      renderChatBox(`${status.info}isWindowLocked? ${isWindowLocked}`);
    break;
    case /^Вы сможете использовать золотое яблоко через \d+ секунд.*\.$/.test(data): {
      const regex = /\d+/;
      const match = regex.exec(data.toString());
      const value = match ? match[0] : null;
      handleCooldown(parseInt(value,10)+0.95, 'gapple');
    }
    break;
    case /^Режим PVP, не выходите из игры \d+ секунд.*\.$/.test(data): {
      const regex = /\d+/;
      const match = regex.exec(data.toString());
      const value = match ? match[0] : null;
      handleCooldown(parseInt(value,10), 'pvp');
    }
    break;
    case /^Вы сможете использовать Жемчуг Края через \d+ сек\.$/.test(data): {
      const regex = /\d+/;
      const match = regex.exec(data.toString());
      const value = match ? match[0] : null;
      handleCooldown(parseInt(value,10)+0.95, 'pearl');
    }
    break;
    case data == 'Войдите - /login [пароль]':
      bot.chat(`/l ${password}`);
    break
    case data == 'PVP окончено':
      renderChatBox(`${status.pvp}${status.info}Exited PvP state`);
      cooldown['pvp'].time = 0;
      cooldown['pvp'].lock = false;
    break;
    case data == '[!] Извините, но Вы не можете PvP здесь.':
      pvpStrikes++;
      // REWRITE THIS 
      if (pvpStrikes > 3) {
        resetCombatVariables();
        isHunting = false;
        pvpStrikes = 0;
        renderChatBox(`${status.pvp}${status.info}Cant PvP here, stopping`);
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
    // RESET/CHANGE MODE
    case /^s$/.test(data):
      resetCombatVariables();
    break;
    case /^cm$/.test(data):
      combatMode++;
      if (combatMode > 3) combatMode = 0;
      renderChatBox(`${status.info}Set combatMode to ${combatMode}`);
    break;
    // ENABLE COMBAT
    case /^g$/.test(data):
      isHunting = !isHunting;
      if (!isHunting) resetCombatVariables();
      renderChatBox(`${status.ok}isHunting set to ${isHunting}`);
    break;
    // ALLY ADD/REMOVE
    case /^aa \S+$/.test(data):
      allies.push(command[1]);
      renderChatBox(`${status.ok}Added ally ${command[1]}`);
    break;
    case /^ar \S+$/.test(data):
      allies = allies.filter(item => item !== command[1]);
      renderChatBox(`${status.ok}Removed ally ${command[1]}`);
    break;
    // JSON/NBT DATA DEBUG
    case /^test$/.test(data): {
      const datablock = [
      util.inspect(bot.players['Patr10t'], { depth: null, colors: false }),
      ]
      for (const data of datablock) fs.appendFile('test.txt', data, (err) => {
        if (err) throw err;
        renderChatBox(`${status.ok}${data} was appended to file`);
      });
    }
    break;
    // RESTORE LOADOUT
    case /^rep$/.test(data):
      replenishLoadout();
    break;
    // DEBUG
    case /^sd$/.test(data):
      insultFags();
    break;
    case /^fw$/.test(data):
      walk = !walk;
      renderChatBox(`${status.debug}WALK SET TO ${walk}`);
      bot.setControlState('forward',walk);
    break;

    case /^l$/.test(data):
      renderChatBox(`${status.ok}isLogging set to ${!isLogging}`);
      isLogging = !isLogging;
      renderChatBox(`${status.ok}isLogging set to ${isLogging}`);
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
let walk = false;
//
// FUNCTIONS: CALCULATIONS
//

async function insultFags() {

}
function jesus() {
  const detectedLiquid = bot.blockAt(bot.entity.position.offset(0, -0.5, 0));
  const liquidBlockBoundary = bot.blockAt(bot.entity.position.offset(0, -0.001, 0));
  if (bot.entity.isInWater || bot.entity.isInLava || liquidBlockBoundary.name === 'water' || liquidBlockBoundary.name === 'lava') {
    isJesusing = true;
    isJesusReady = false;
    setTimeout(() => {
      bot.entity.velocity.y = 0.11;
    }, 0);
  } else isJesusing = false;
  if ((detectedLiquid.name === 'water' || detectedLiquid.name === 'lava') && !isJesusing) {
    isJesusReady = true;
  } else isJesusReady = false;
}

function prevent() {
  const cobweb = bot.findBlock({
    point: bot.entity.position,
    matching: bot.registry.blocksByName.web.id,
    maxDistance: 2,
  });

  if (cobweb && cobweb.position.set(cobweb.position.x+0.5,cobweb.position.y,cobweb.position.z+0.5).distanceTo(bot.entity.position) <= 0.95) {
    const cobwebPosition = [cobweb.position.x,cobweb.position.z];
    renderChatBox(`${status.debug}Web found PosCenter xz: ${cobwebPosition}`);
    const [velocityX,velocityZ] = calculateStrafeVectors(cobwebPosition,180,0.05);

    // use .set?
    if (bot.entity.onGround) {
      setTimeout(() => {
        bot.entity.position.x += adjustVelocity(velocityX,0.05);
        bot.entity.position.z += adjustVelocity(velocityZ,0.05);
      }, 0);
    } else {
      setTimeout(() => {
        bot.entity.velocity.x += adjustVelocity(velocityX,0.05);
        bot.entity.velocity.z += adjustVelocity(velocityZ,0.05);
      }, 0);
    }
  }
}
function adjustVelocity (value, boundary){
  if (value >= boundary) {
    return boundary;
  } else if (value <= -boundary) {
    return -boundary;
  }
  return value;
}
function strafe(position,angleDegrees) {
  const [velocityX,velocityZ] = calculateStrafeVectors(position,angleDegrees,0.6);

  if (bot.entity.onGround && !isJesusing && !isJesusReady) {
    //renderChatBox(`${status.verbose}GROUND TRIGGER`);
    setTimeout(() => {
      bot.entity.velocity.x = velocityX;
      bot.entity.velocity.y = 0.42;
      bot.entity.velocity.z = velocityZ;
    }, 0);
    
  }
}
async function handleCooldown(value, type) {
  if (value > 0 && value > cooldown[type].time) {
    if (type != 'pvp') renderChatBox(`${status[type]}${status.info}Cooldown for ${type} started, ${value}s left`);
    cooldown[type].time = value;
  } else if (value <= 0) cooldown[type].time = 0.99; else return;
  cooldown[type].time = parseInt(cooldown[type].time, 10);
  if (!cooldown[type].lock) {
    while (cooldown[type].time > 0) {
      cooldown[type].lock = true;
      cooldown[type].time -= 0.05;
      await bot.waitForTicks(1);
    }
  }
  if (cooldown[type].time <= 0 && cooldown[type].lock === true){
    cooldown[type].time = 0;
    cooldown[type].lock = false;
    renderChatBox(`${status[type]}${status.info}Cooldown for ${type} ended, [TIME: ${cooldown[type].time} LOCK: ${cooldown[type].lock}]`);
  }
}
function isPointInCylinder(point, cylinder) {
  const [px, py, pz] = point;
  const { center, radius, height } = cylinder;
  const [cx, cy, cz] = center;
  const withinHeight = py >= cy && py <= cy + height;
  const dx = px - cx;
  const dz = pz - cz;
  const withinRadius = (dx * dx + dz * dz) <= (radius * radius);
  return withinHeight && withinRadius;
}
function calculateStrafeVectors(position,angleDegrees,speed) {
  const currentX = bot.entity.position.x;
  const currentZ = bot.entity.position.z;
  const [targetX, targetZ] = position;
  const dx = targetX - currentX;
  const dz = targetZ - currentZ;
  let length = Math.sqrt(dx * dx + dz * dz);
  if (length === 0) return [((Math.random() * 0.002) - 0.001),((Math.random() * 0.002) - 0.001)];
  const normX = dx / length;
  const normZ = dz / length;
  const angle = angleDegrees * (Math.PI / 180);
  const rotatedX = normX * Math.cos(angle) - normZ * Math.sin(angle);
  const rotatedZ = normX * Math.sin(angle) + normZ * Math.cos(angle);
  const velocityX = rotatedX * speed;
  const velocityZ = rotatedZ * speed;
  return [velocityX,velocityZ];
}
function calculatePearlTrajectory(distance) {
  const g = 1.6;
  const initialVelocity = 10;
  const sineTheta = (g * distance) / (initialVelocity * initialVelocity);
  if (sineTheta < -1 || sineTheta > 1) throw new Error(`${status.pearl}${status.error}The distance is too far for the given initial velocity.`);
  const angleInRadians = 0.5 * Math.asin(sineTheta);
  const angleInBlocks = distance * Math.sin(angleInRadians);
  return angleInBlocks;
}
function rateStats(max,current) {
  max = parseInt(max, 10);
  current = parseInt(current, 10);
  const percentage = (current / max) * 100;
  return percentage > 66 
  ? `${status.good}${Math.round(current,1)}{/}`
  : percentage > 33 
  ? `${status.mediocre}${Math.round(current,1)}{/}`
  : `${status.bad}${Math.round(current,1)}{/}`;
}
function rateStatBool(current,reverse) {
  if (reverse) {
    return current ? `${status.bad}${current}{/}` : `${status.good}${current}{/}`;
  } else {
    return current ? `${status.good}${current}{/}` : `${status.bad}${current}{/}`;
  }
}
//
// FUNCTIONS: RENDERING UI TEXT
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
  if (!isLogging) return;
  // pushline to log
  chatBox.log(pe.render(err));
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
}
//
// FUNCTIONS: INVENTORY/SLOT MANAGEMENT
//
async function unequipItem(destination) {
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
  const unequipPieces = ['head','torso','legs','feet','off-hand'];

  for (const destination of unequipPieces) {
    if (bot.inventory.slots[bot.getEquipmentDestSlot(destination)] != null) {
      await bot.waitForTicks(2);
      await unequipItem(destination);
    }
  }
}
async function equipItem(itemId, destination) {
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
// FUNCTIONS: INVENTORY COUNTING
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
function sayItemCount(itemId) {
  const slots = [bot.getEquipmentDestSlot('head'),bot.getEquipmentDestSlot('torso'),bot.getEquipmentDestSlot('legs'),bot.getEquipmentDestSlot('feet'),bot.getEquipmentDestSlot('off-hand')];
  let output = bot.inventory.items().map((item) => { if (item.type === bot.registry.itemsByName[itemId].id) return item.count; }).filter(Boolean).reduce((acc, current) => acc + current, 0);
  for (const slot of slots) {
    if (bot.inventory.slots[slot]?.type === bot.registry.itemsByName[itemId].id) output += bot.inventory.slots[slot]?.count;
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
    { destination: 'head', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null), minEnch: 8 },
    { destination: 'torso', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null), minEnch: 6 },
    { destination: 'legs', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null), minEnch: 6 },
    { destination: 'feet', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null), minEnch: 9 }
  ];
  for (const piece of armorPieces) {
    if (piece.item?.nbt && piece.item && nbt.simplify(piece.item.nbt).ench.length >= piece.minEnch) {
      if (bot.inventory.slots[bot.getEquipmentDestSlot(piece.destination)] === null || bot.inventory.slots[bot.getEquipmentDestSlot(piece.destination)].type != piece.item.type) {
        armorStrikes++;
        if (armorStrikes >= 2) {
          renderChatBox(`${status.armor}${status.warn}${piece.destination} timeout at ${armorStrikes}`);
          await bot.waitForTicks(5);
          armorStrikes = 0;
          return;
        }
        lockValue['hand'] = true;
        lockValue['off-hand']  = true;
        renderChatBox(`${status.armor}`);
        await bot.waitForTicks(5);
        await equipItem(piece.item.type, piece.destination);
        renderChatBox(`${status.armor}`);
        lockValue['hand'] = false;
        lockValue['off-hand']  = false;
      }
    }
  }
}
async function equipGapple() {
  if (((bot.health + bot.entity?.metadata[11]) <= 20 && bot.pvp.target || (bot.health + bot.entity?.metadata[11]) <= 19.9) && (((bot.health + bot.entity?.metadata[11]) > 1+deltaHealth && sayItemCount('totem_of_undying') >= 1) || (sayItemCount('totem_of_undying') === 0))) {
    const gapple = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null) || bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')];
    if (gapple && gapple?.type === bot.registry.itemsByName.golden_apple.id) {
      gappleStrikes++;
      if (gappleStrikes >= 2) {
        renderChatBox(`${status.gapple}${status.warn}Golden apple timeout at ${gappleStrikes}`);
        await bot.waitForTicks(45);
        gappleStrikes = 0;
        return;
      }
      isHealing = true;
      lockValue['off-hand'] = true;
      const oldItemCount = sayItemCount('golden_apple');
      renderChatBox(`${status.gapple}${status.info}STARTED Healing function`);

      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != gapple.type) {
        await bot.waitForTicks(5);
        await equipItem(gapple.type, 'off-hand');
      }

      bot.activateItem(true);
      await bot.waitForTicks(35);
      bot.deactivateItem();

      await bot.waitForTicks(1);
      const newItemCount = sayItemCount('golden_apple');
      const cooldown = 14;
      handleCooldown(cooldown, 'gapple');
      if (newItemCount < oldItemCount || bot.entity.effects[5]) {
        renderChatBox(`${status.gapple}${status.ok}Gapple SUCCESS`);
      } else {
        renderChatBox(`${status.gapple}${status.error}Gapple FAILED`);
      }
      isHealing = false;
      lockValue['off-hand'] = false;
    }
  }
}
async function equipBuff() {
  if (!bot.entity.effects['5'] && ((bot.health + bot.entity?.metadata[11]) >= 19 || (bot.health + bot.entity?.metadata[11]) > 10 && cooldown['gapple'].time >= 5)) {
    const buff = bot.inventory.findInventoryItem(bot.registry.itemsByName.potion.id, null);
    if (buff?.nbt && buff && bot.pvp.target && nbt.simplify(buff.nbt).Potion === 'minecraft:strong_strength') {
      buffStrikes++;
      if (buffStrikes >= 2) {
        renderChatBox(`${status.buff}${status.warn}Buff timeout at ${buffStrikes}`);
        await bot.waitForTicks(45);
        buffStrikes = 0;
        return;
      }
      lockValue['off-hand'] = true;
      const oldItemCount = sayItemCount('potion');
      renderChatBox(`${status.buff}${status.info}Buff STARTED`);

      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != buff.type) {
        await bot.waitForTicks(5);
        await equipItem(buff.type, 'off-hand');
      }

      bot.activateItem(true);
      await bot.waitForTicks(35);
      bot.deactivateItem();

      await bot.waitForTicks(1);
      const newItemCount = sayItemCount('potion');
      const cooldown = 14;
      handleCooldown(cooldown, 'buff');
      if (newItemCount < oldItemCount || bot.entity.effects['5']) {
        renderChatBox(`${status.buff}${status.ok}Buff SUCCESS`);
      } else {
        renderChatBox(`${status.buff}${status.error}Buff FAILED`);
      }
      lockValue['off-hand'] = false;
    }
  }
}
async function equipTotem() {
  if (((bot.health + bot.entity?.metadata[11]) <= 1+deltaHealth || sayItemCount('golden_apple') === 0) && bot.inventory.slots[45]?.type != bot.registry.itemsByName.totem_of_undying.id) {
    const totem = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);
    if (totem) {
      totemStrikes++;
      if (totemStrikes >= 2) {
        renderChatBox(`${status.totem}${status.warn}Totem timeout at ${totemStrikes}`);
        await bot.waitForTicks(5);
        totemStrikes = 0;
        return;
      }
      lockValue['off-hand'] = true;
      renderChatBox(`${status.totem}`);
      await bot.waitForTicks(5);
      await equipItem(totem.type, 'off-hand');
      renderChatBox(`${status.totem}`);
      lockValue['off-hand'] = false;
    }
  } 
}
async function tossPearl() {
  const pearl = bot.inventory.findInventoryItem(bot.registry.itemsByName.ender_pearl.id, null);
  const entity = bot.nearestEntity(e => e.type === 'player' && e.username === bot.pvp.target?.username);

  if (entity && (entity?.position.distanceTo(bot.entity.position) >= 10 || bot.player.isInWater || bot.player.isInLava || bot.player.isInWeb) && pearl && cooldown['pearl'].time === 0) {
    const angleInBlocks = calculatePearlTrajectory(entity.position.distanceTo(bot.entity.position));
    pearlStrikes++;
    if (pearlStrikes >= 2) {
      renderChatBox(`${status.pearl}${status.warn}Pearl timeout at ${pearlStrikes}`);
      await bot.waitForTicks(5);
      pearlStrikes = 0;
      return;
    }
    lockValue['off-hand'] = true;
    const oldItemCount = sayItemCount('ender_pearl');
    renderChatBox(`${status.pearl}${status.info}Pearl STARTED`);

    if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != pearl.type) {
      await bot.waitForTicks(5);
      await equipItem(pearl.type, 'off-hand');
    }

    bot.pvp.forceStop();
    await bot.lookAt(entity.position.offset(0,angleInBlocks+entity.height,0), true);
    await bot.waitForTicks(2);
    bot.pvp.forceStop();
    bot.activateItem(true);
    await bot.waitForTicks(1);
    bot.deactivateItem();

    await bot.waitForTicks(1);
    const newItemCount = sayItemCount('ender_pearl');
    const cooldown = 14;
    if (newItemCount < oldItemCount) {
      handleCooldown(cooldown, 'pearl');
      renderChatBox(`${status.pearl}${status.ok}Pearl SUCCESS`);
    } else {
      handleCooldown(cooldown, 'pearl');
      renderChatBox(`${status.pearl}${status.error}PearlFAILED`);
    }
    lockValue['off-hand'] = false;
  }
}
async function equipPassive() {
  const itemPieces = [
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null), slot: 'off-hand', slotCheck: bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')], slotUsed: 'off-hand' },
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null), slot: 'hand', slotCheck: bot.heldItem, slotUsed: 'hand'}
  ]
  for(const piece of itemPieces) {
    if (piece.item && piece.slotCheck?.type != piece.item.type) {
      passiveStrikes++
      if (passiveStrikes >= 2) {
        renderChatBox(`${status.passive}${status.warn}Passive timeout at ${passiveStrikes}`);
        await bot.waitForTicks(5);
        passiveStrikes = 0;
        return;
      }
      if ((piece.slotUsed === 'off-hand' || nbt.simplify(piece.item.nbt).ench.length >= 8) && !lockValue[piece.slotUsed]) {
        lockValue[piece.slotUsed] = true;
        renderChatBox(`${status.passive}${piece.item.displayName}`);
        await bot.waitForTicks(5);
        await equipItem(piece.item.type, piece.slot);
        renderChatBox(`${status.passive}${piece.item.displayName}`);
        lockValue[piece.slotUsed] = false;
      }
    }
  }
}
async function tossJunk() {
  const junkArray = [
    bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null), 
    bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null),
    bot.inventory.findInventoryItem(bot.registry.itemsByName.glass_bottle.id, null)
  ];
  for (const item of junkArray) {
    if (item) {
      junkStrikes++;
      if (junkStrikes >= 2) {
        await bot.waitForTicks(5);
        junkStrikes = 0;
        return;
      }
      lockValue['hand'] = true;
      lockValue['off-hand'] = true;
      await bot.waitForTicks(5);
      await tossItem(item.type, item.count);
      lockValue['hand'] = false;
      lockValue['off-hand'] = false;
    }
  }
}
//
// FUNCTIONS: RESTORE LOADOUT
//
async function replenishLoadout() {
  const data = fs.readFileSync('./inventory-nbt.conf', 'utf8');
  const lines = data.split('\n');

  if (cooldown['pvp'].time > 0) {
    throw new Error(`${status.error}Exit combat before replenishing!`)
  }

  isAutoEquipping = false;
  for (const line of lines) {
    const result = JSON.parse(line);

    for (const slot of result.slots) {
      const itemType = bot.registry.itemsByName[result.type].id;
      const itemNbt = nbtBlock[result.nbt];
      if (bot.player.gamemode != 1) {
        renderChatBox(`${status.info}Gamemode: ${bot.player.gamemode} Setting gamemode to 1`);
        bot.chat('/gm 1');
        await bot.waitForTicks(5);
      }
      if (bot.player.gamemode === 1 && ((bot.inventory.slots[slot]?.type != itemType || bot.inventory.slots[slot]?.count != result.count) || (bot.inventory.slots[slot]?.durabilityUsed >= 2 && (result.usage === "ARMOR" || result.usage === "WEAPON")))) {
        renderChatBox(`${status.info}Gamemode: ${bot.player.gamemode} Setting ${result.type} to ${slot} ${result.count} ${result.metadata}`);
        lockValue['hand'] = true;
        lockValue['off-hand'] = true;
        await bot.waitForTicks(5);
        bot.creative.setInventorySlot(slot, new Item(itemType, result.count, result.metadata, itemNbt));
        lockValue['hand'] = false;
        lockValue['off-hand'] = false;
      }
    }
  }
  if (bot.player.gamemode != 0) {
    renderChatBox(`${status.info}Gamemode: ${bot.player.gamemode} Setting gamemode to 0`)
    await bot.waitForTicks(5);
    bot.chat('/gm 0');
    await bot.waitForTicks(5);
  }
  isAutoEquipping = true;
}
//
// FUNCTIONS: TARGETING
//
function huntPlayer() {
  let filterEntity;
  switch (combatMode) {
    case 0:
      filterEntity = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) <= 64 && e.kind === 'Hostile mobs';
    break;
    case 1:
      filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 256 && bot.players[e.username]?.gamemode === 0 && !allies.includes(e.username);
    break;
    case 2:
      filterEntity = e => e.type === 'player' && (isPointInCylinder([e.position.x,e.position.y,e.position.z],cylinder1) || isPointInCylinder([e.position.x,e.position.y,e.position.z],cylinder2)) && e.position.distanceTo(bot.entity.position) <= 64 && bot.players[e.username]?.gamemode === 0 && !allies.includes(e.username); //&& e.username != master;
    break;
    case 3:
      // testing
      filterEntity = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 256 && e.username === master;
    break;
  }

  const entity = bot.nearestEntity(filterEntity);
  if (entity) { 
    const cobweb = bot.findBlock({
      point: entity.position,
      matching: bot.registry.itemsByName.web.id,
    });
    if (entity.id != bot.pvp.target?.id) bot.pvp.attack(entity);
    if (entity.position.distanceTo(bot.entity.position) <= bot.pvp.attackRange) bot.lookAt(entity.position.offset(0,entity.height,0), true);
    if (cobweb && cobweb?.position.set(cobweb.position.x+0.5,cobweb.position.y,cobweb.position.z+0.5).distanceTo(entity.position) <= 3) {
      bot.pvp.followRange = 2;
    } else {
      bot.pvp.followRange = 7;
    }
    if (bot.pvp.followRange === 7 && entity.position.distanceTo(bot.entity.position) <= bot.pvp.followRange && bot.entity.onGround) {
      strafe([entity.position.x,entity.position.z], 30);
    } else if (isJesusReady || isJesusing) {
      bot.setControlState('forward', true);
    } else bot.clearControlStates();
  } else { 
    bot.pvp.forceStop();
  }
}
// bot.equipment inventory
// adaptive boundaries counted using damage per tick
// 
// FUNCTION LOOP 
//
bot.on('physicsTick', async () => {
  if (!isWindowLocked || !isAutoEquipping) return;
  jesus();
  prevent();
  // HIGHEST PRIORITY
  if (armorStrikes < 2) equipArmor(); // MAIN HAND
  if (cooldown['gapple'].time === 0 && !cooldown['gapple'].lock && gappleStrikes < 2) equipGapple(); // OFFHAND
  if (!isHealing && !lockValue['off-hand'] ) {
    if (totemStrikes < 2) equipTotem(); // OFFHAND
    if (cooldown['buff'].time === 0 && !cooldown['buff'].lock && buffStrikes < 2) equipBuff(); // OFFHAND
    if (cooldown['pearl'].time === 0 && !cooldown['pearl'].lock && pearlStrikes < 2) tossPearl(); // OFFHAND
  }
  // HIGH PRIORITY
  if (!isHealing && !lockValue['hand'] && !lockValue['off-hand'] && (bot.health+bot.entity?.metadata[11]) > 1+deltaHealth) {
    if (passiveStrikes < 2) equipPassive(); // MAIN HAND
    if (!isHunting && junkStrikes < 2) tossJunk(); // MAIN HAND
  }
  // LOW PRIORITY
  if (isHunting) huntPlayer();
});
setInterval(() => {
  if (!isWindowLocked) return;
  const helmetPerc = (((363 - bot.inventory.slots[5]?.durabilityUsed) / 363) * 100);
  const chestplatePerc = (((528 - bot.inventory.slots[6]?.durabilityUsed) / 528) * 100);
  const leggingsPerc = (((495 - bot.inventory.slots[7]?.durabilityUsed) / 495) * 100);
  const bootsPerc = (((429 - bot.inventory.slots[8]?.durabilityUsed) / 429) * 100);
  const targetPos = [bot.pvp.target?.position.x,bot.pvp.target?.position.y,bot.pvp.target?.position.z];
  //const 
  const banner =
  // ENTITY COHESION
  `BOT ${bot.username} ${rateStats(36,(bot.health+bot.entity?.metadata[11]))} ${combatMode} ` +
  `TARGET ${bot.pvp.target?.username} ${rateStats(36,(bot.pvp.target?.metadata[7]+bot.pvp.target?.metadata[11]))} ${isPointInCylinder(targetPos,cylinder1) || isPointInCylinder(targetPos,cylinder2) ? status.good+'true{/}' : status.bad+'false{/}'} ` +
  `DIST ${rateStats(10,bot.pvp.target?.position.distanceTo(bot.entity.position))} ${bot.pvp.followRange}\n` +
  // INVENTORY
  `PEARL ${rateStats(32,sayItemCount('ender_pearl'))} BUFF ${rateStats(5,sayItemCount('potion'))} TOTEM ${rateStats(8,sayItemCount('totem_of_undying'))} GAPPLE ${rateStats(64,sayItemCount('golden_apple'))} ` + 
  `ARMOR ${rateStats(6,sayItemCount('diamond_helmet'))}|${rateStats(6,sayItemCount('diamond_chestplate'))}|${rateStats(6,sayItemCount('diamond_leggings'))}|${rateStats(6,sayItemCount('diamond_boots'))} ` +
  `ARMOR% ${rateStats(100,helmetPerc)}|${rateStats(100,chestplatePerc)}|${rateStats(100,leggingsPerc)}|${rateStats(100,bootsPerc)}\n` +
  // COMBAT INDICATORS
  `PVP ${cooldown['pvp']?.lock ? status.bad+(cooldown['pvp']?.time ?? 0).toFixed(2) : status.good+(cooldown['pvp']?.time ?? 0).toFixed(2)}{/} BUFF ${cooldown['buff']?.lock ? status.bad+(cooldown['buff']?.time ?? 0).toFixed(2) : status.good+(cooldown['buff']?.time ?? 0).toFixed(2)}{/} GAPPLE ${cooldown['gapple']?.lock ? status.bad+(cooldown['gapple']?.time ?? 0).toFixed(2) : status.good+(cooldown['gapple']?.time ?? 0).toFixed(2)}{/} PEARL ${cooldown['pearl']?.lock ? status.bad+(cooldown['pearl']?.time ?? 0).toFixed(2) : status.good+(cooldown['pearl']?.time ?? 0).toFixed(2)}{/} ` +
  `HAND ${rateStatBool(lockValue['hand'],true)} OFF-HAND ${rateStatBool(lockValue['off-hand'],true)}\n` +
  `PING ${bot.player.ping} ` +
  `HSR ${rateStats(100,((pvpHitSuccess/pvpHitAttempts)*100))} ` +
  `JESUS RDY ${rateStatBool(isJesusReady)} STBY ${rateStatBool(isJesusing)} ` + 
  `STRAFE RDY ${rateStatBool(bot.entity.onGround)} ` + 
  `VEL BOT ${bot.entity.velocity.y.toFixed(2)} TARGET ${bot.pvp.target?.velocity}`
  renderFunctionBox(banner);
}, 50);

//
// bot.on() EVENT TRIGGERS
//
bot.on('windowOpen', async (window) => {
  if (isWindowLocked) return;
  await bot.clickWindow(0,0,0); // mlegacy.ru
  await window.close();
});

let oldHealth = 0;
let newHealth = 0;
let deltaHealth = 0;

bot.on('onCorrelateAttack', function (attacker,victim) {
  if (oldHealth === 0) {
    oldHealth = (bot.health+bot.entity?.metadata[11]);
    return;
  } else if (oldHealth) {
    newHealth = (bot.health+bot.entity?.metadata[11]);
    deltaHealth = oldHealth - newHealth;
    if (deltaHealth < 0) deltaHealth = 0.5;
    oldHealth = 0;
    newHealth = 0;
    renderChatBox(`${status.pvp}DELTA Health is ${deltaHealth}`); 
  }
  if (allies.includes(victim.username) && !allies.includes(attacker.username)) {
   // renderChatBox(`${status.pvp}Attacker ${attacker.username} Victim ${victim.username}`);
  }
});
bot.on('path_update', (path) => {
  renderChatBox(`${status.verbose}PATH UPDATED ${path.time}`)
});
bot.on('goal_updated', (goal) => {
  renderChatBox(`${status.verbose}GOAL UPDATED${goal}`)
});
bot.on('path_reset', (path) => {
  renderChatBox(`${status.verbose}PATH RESET ${path}`)
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
bot.on('attackedTarget', () => {
  pvpHitAttempts++;
});
bot.on('entityHurt', (entity) => {
  entity.username === bot.pvp.target?.username && pvpHitSuccess++
});
bot.on('particle', (particle) => {
  if (particle.id === 45 && Math.ceil(particle.position.y) === Math.ceil(bot.entity.position.y)) {
    renderChatBox(`${status.debug}CRITICAL HIT FROM BOT ${particle.offset}`);
  }
})
bot.on('death', async () => {
  renderChatBox(`${status.info}${bot.username} has died, waiting for ${Math.ceil((cooldown['pvp'].time ?? 1) *20)} ticks`);
  resetCombatVariables();
  await bot.waitForTicks(Math.ceil((cooldown['pvp'].time ?? 1)*20 + 20));

  renderChatBox(`${status.info}Done waiting, restoring loadout`);

  await replenishLoadout();

  const zoneArray = ['',2,4]
  const zone = Math.floor(Math.random() * zoneArray.length);

  renderChatBox(`${status.info}Done restoring, teleporting to zone ${zoneArray[zone]}`);
  if (combatMode === 2) bot.chat(`/warp play${zoneArray[zone]}`); else bot.chat(`/home home`);
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
process.on('warning', (err) => {
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