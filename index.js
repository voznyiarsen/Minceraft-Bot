const mineflayer = require('mineflayer');
const PrettyError = require('pretty-error');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow } = require('mineflayer-pathfinder').goals;
const pvp = require('mineflayer-pvp').plugin;
const bloodhoundPlugin = require('mineflayer-bloodhound')(mineflayer);

const { screen, chatBox, functionBox, logBox, inputBox } = require('./scripts/ui');

const fs = require('fs');
const nbt = require('prismarine-nbt');
const Item = require('prismarine-item')('1.12.2');
const util = require('util');

const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('blessed', 'vm');
pe.skipPath(__filename);

/* fuck i wish i made it modular */

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

const status = {
  gapple: '{magenta-bg}{black-fg}GAPPLE{/} ',
  buff: '{magenta-bg}{black-fg}BUFF{/} ',
  pearl: '{magenta-bg}{black-fg}PEARL{/} ',
  armor: '{blue-bg}{white-fg}ARMOR{/} ',
  totem: '{blue-bg}{white-fg}TOTEM{/} ',
  passive: '{white-bg}{black-fg}PASSIVE{/} ',
  good: '{green-fg}',
  mediocre: '{yellow-fg}',
  bad: '{red-fg}',
  debug: '{white-bg}{black-fg}DEBUG{/} ',
  warn: '{yellow-bg}{black-fg}WARN{/} ',
  error: '{red-bg}{white-fg}ERROR{/} ',
  info: '{cyan-bg}{black-fg}INFO{/} ',
  ok: '{green-bg}{black-fg}OKAY{/} ',
  verbose: '{cyan-bg}{black-fg}VERBOSE{/} ',
  pvp: '{red-bg}{white-fg}PVP{/} ',
  hit: '{red-bg}{white-fg}HIT{/}'
};

let isLogging = true;

let isAutoEquipping = true;
let isWindowLocked = false;

let [isHunting, isHealing] = [false, false];

let pvpHitAttempts = 0;
let pvpHitSuccess = 0;

let noPvPCountdownLock = false;

let combatMode = 2;

let allies = [master, 'Plotva', 'maksim2008'];

let tabCompleteIndex = 0;
let tabComplete;

let isChatEnabled = true;

let botWebBlock;
let entityWebBlock;

let lockLobby = false;

const cylinder1 = {
  center: [2190.5, 0, 1003.5],
  radius: 39.8,
  height: 255
};
const cylinder2 = {
  center: [2190.5, 76, 1003.5],
  radius: 45.9,
  height: 255
};
/*
  NBT DATA
*/
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
const cooldownTypes = ['pvp','gapple','pearl','buff','hit']
for (const type of cooldownTypes) cooldown[type] = {time: 0, lock: false};

const lockValue = {};
const lockValueTypes = ['hand','off-hand','isEquippingHead','isEquippingTorso','isEquippingLegs','isEquippingFeet'];
for (const type of lockValueTypes) lockValue[type] = false;

const strikeValue = {};
const strikeValueTypes = ['passive','gapple','totem','armor','buff','pearl','junk','pvp'];
for (const type of strikeValueTypes) strikeValue[type] = 0;

let oldHealth = 0;
let newHealth = 0;
let deltaHealth = 0;

let isPreventing = false;
let isJesusing = false;
let isInLiquid = false;
/*
  LOAD PLUGINS
*/

bot.once('inject_allowed', () => {
  bot.setMaxListeners(999);

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bloodhoundPlugin(bot);

  bot.physics.yawSpeed = 10*10^3;
  bot.physics.pitchSpeed = 10*10^3;
  bot.pathfinder.thinkTimeout = 5000;
  bot.pathfinder.tickTimeout = 40;

  bot.bloodhound.yaw_correlation_enabled = true;

  bot.pvp.movements.allowEntityDetection = true;
  bot.pvp.movements.allowFreeMotion = true;
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

  bot.pvp.viewDistance = 128;
  //bot.pvp.movements.blocksToAvoid = new Set();
  //bot.pvp.movements.blocksToAvoid.delete(30);
  //bot.pvp.movements.emptyBlocks.delete(30);
});
/*
  FUNCTIONS: COMMAND HANDLING
*/
async function getTabComplete() {
  const inputWords = inputBox.getValue().trim().split(' ');
  const lastWord = inputWords[inputWords.length - 1];
  const newTabComplete = await bot.tabComplete(lastWord,false,false,1000);

  if (newTabComplete.length > 1) {
    tabComplete = newTabComplete;
    renderChatBox(`${status.info}Tab-complete has ${tabComplete.length} entries\n"${tabComplete}."`);
  }
  if (tabComplete) {
    const entry = tabComplete[tabCompleteIndex % tabComplete.length];
    renderChatBox(`${status.ok}Entry ${entry} chosen, ${tabCompleteIndex+1} out of ${tabComplete.length} total entries.`);

    inputWords[inputWords.length - 1] = entry;
    inputBox.setValue(inputWords.join(' '));
    tabCompleteIndex++;
    if (tabCompleteIndex >= tabComplete.length) tabCompleteIndex = 0;
  } else {
    renderChatBox(`${status.warn}No tab-completions available.`);
  }
}

/*
let trapdoor = bot.registry.blocksByName['oak_trapdoor'].id
let block = bot.findBlock({ trapdoor })
use for equipItem !!!! rewrite!!
*/
async function logAbnormalities(data) {
  const filteredMessages = [
    /^\[❤\] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом\.$/,
    /^\[Внимание\] АКЦИЯ! Неделя супер скидок! Успей купить выгодно:\) Покупать тут - https:\/\/MineLegacy\.ru $/
  ];
  /* Wrote this because the server admin occasionally leaks IPs of players */
  if (lockLobby && !filteredMessages.some(regex => regex.test(data))) {
    renderChatBox(`${status.warn}${status.warn}ABNORMALITY FOUND!, logging to file...`);
    renderChatBox(`AB>>${data}<<AB`);
    fs.appendFile('DO_NOT_DELETE_abnormal.log', data + new Date().toLocaleString() + '\n', (err) => {
      if (err) {
        renderChatBox(`${status.error}${data} failed to append`);
        renderError(err);
      } else {
        renderChatBox(`${status.ok}${data} was appended to file`);
      }
    });
  }
}
async function chatCommands(data) {
  const filteredMessages = [
    /^Режим PVP, не выходите из игры \d+ секунд.*\.$/,
    /^\s*$/,
    /^.+».+$/,
  ];
  if (isChatEnabled && !filteredMessages.some(regex => regex.test(data))) renderChatBox(`>>>${data.toAnsi()}<<<`);
  switch(true) {
    /* CHAT*/
    case /^.+Ⓖ.+MILITECH Patr10t . .+$/.test(data): {
      const regex = /[^➯]+$/;
      const match = regex.exec(data.toString());
      const value = match ? match[0].trim() : null;
      renderChatBox(`${status.info}Sending >>>${value}<<<`);
      //bot.chat(`!${value}`);
    }
    break;
    case /^.+Ⓛ.+MILITECH Patr10t . .+$/.test(data): {
      const regex = /[^➯]+$/;
      const match = regex.exec(data.toString());
      const value = match ? match[0].trim() : null;
      renderChatBox(`${status.info}Sending >>>${value}<<<`);
      bot.chat(value);
    }
    break;
    /* LOGIN */
    case data == '[❤] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом.':
      if (lockLobby) {
        isWindowLocked = true;
        isAutoEquipping = false;
        const redstone = bot.inventory.findInventoryItem(bot.registry.itemsByName.redstone.id, null);
        if (Object.keys(bot.players).length === 1 && redstone) {
          renderChatBox(`${status.warn}Player list length is ${Object.keys(bot.players).length}, viewing players if not enabled, enabling...`);
          await equipItem(redstone.type, 'hand');
          await bot.waitForTicks(5);
          bot.activateItem();
        }
        return;
      } else isAutoEquipping = true;
      isWindowLocked = false;
      renderChatBox(`${status.ok}isWindowLocked? ${isWindowLocked}`);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case /^\s{43}$/.test(data):
      if (lockLobby) {
        isWindowLocked = true;
        isAutoEquipping = false;
        return;
      }else isAutoEquipping = true;
      isWindowLocked = true;
      renderChatBox(`${status.ok}isWindowLocked? ${isWindowLocked}`);
    break;
    case /^Вы были телепортированы в Lobby.+$/.test(data):
      if (lockLobby) {
        isWindowLocked = true;
        isAutoEquipping = false;
        return;
      }
      isWindowLocked = false;
      renderChatBox(`${status.info}isWindowLocked? ${isWindowLocked}`);
      await bot.waitForTicks(5);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    /* MISC */
    case /^Установлен режим полета включен для .+$/.test(data): 
      bot.chat(`/fly`);
    break;
    case data == 'Телепортирование...': {
      await bot.waitForChunksToLoad();
      await bot.waitForTicks(2);
      const entity = bot.nearestEntity(e => e.type === 'player' && e.position.distanceTo(bot.entity.position) < 1);
      if (entity) {
        renderChatBox(`${status.warn}${entity.username} teleported me!`);
        bot.chat(`!${entity.username} телепортировал меня`);
      }
    }
    break;
    /* PvP */
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
        "ЛЕЖАТЬ",
        "ИЗИ БОТЯРА",
        "ЗЕМЛЯ ТЕБЕ СТЕКЛОВАТОЙ"];
      const randomIndex = Math.floor(Math.random() * insults.length);
      renderChatBox(`${status.pvp}Taunting player ${bot.pvp.target.username}`);
      bot.chat(`!${bot.pvp.target.username} ${insults[randomIndex]}`);
    }
    break;
    case /^\[MineLegacy\] Вы были убиты игроком .+, и потеряли \$\d+\.\d+\.$/.test(data):
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
      if (noPvPCountdownLock) return;
      strikeValue['pvp']++;
      while (strikeValue['pvp'] > 0) {
        noPvPCountdownLock = true;
        strikeValue['pvp']--;
        if (strikeValue['pvp'] >= 3) {
          resetCombat();
          isHunting = false;
          strikeValue['pvp'] = 0;
          renderChatBox(`${status.pvp}${status.info}Can't PvP here, stopping`);
          break;
        }
        await bot.waitForTicks(20);
      }
      noPvPCountdownLock = false;
    break;
  }
}
async function cliCommands(data) {
  const command = data.split(' ');
  switch(true) {
    /* TOSS ITEMS */
    case /^ts \d+ \d+$/.test(data):
      tossItem(command[2], command[1]);
    break;
    case /^ts \w+$/.test(data):
      tossItem(command[1]);
    break;
    case /^tsall$/.test(data):
      tossAllItems();
    break;
    /* EQUIP ITEMS */
    case /^eq [\w-]+ \d+$/.test(data):
      equipItem(command[2], command[1]);
    break;
    /* UNEQIUP ITEMS */
    case /^uneq [\w-]+$/.test(data):
      unequipItem(command[1]);
    break;
    case /^uneqall$/.test(data): 
      unequipAllItems();
    break;
    /* CHANGE MODE */
    case /^sweq$/.test(data):
      isAutoEquipping = !isAutoEquipping;
      renderChatBox(`${status.ok}isAutoEquipping set to ${isAutoEquipping}`);
    break;
    case /^cm(\s[0-4])?$/.test(data):
      combatMode = command[1] ? parseInt(command[1], 10) : (combatMode + 1) % 4;
      renderChatBox(`${status.ok}combatMode set to ${combatMode}`);
    break;
    case /^ec$/.test(data):
      isChatEnabled = !isChatEnabled;
      renderChatBox(`${status.ok}isChatEnabled set to ${isChatEnabled}`);
    break;
    case /^l$/.test(data):
      renderChatBox(`${status.ok}isLogging set to ${!isLogging}`);
      isLogging = !isLogging;
      renderChatBox(`${status.ok}isLogging set to ${isLogging}`);
    break;
    case /^ll$/.test(data):
      lockLobby = !lockLobby
      renderChatBox(`${status.ok}lockLobby set to ${lockLobby}`)
    break;
    /* ENABLE/DISABLE COMBAT */
    case /^g$/.test(data):
      isHunting = !isHunting;
      if (!isHunting) resetCombat();
      renderChatBox(`${status.ok}isHunting set to ${isHunting}`);
    break;
    case /^s$/.test(data):
      resetCombat();
    break;
    /* ALLY ADD/REMOVE */
    case /^aa \S+$/.test(data):
      allies.push(command[1]);
      renderChatBox(`${status.ok}Added ally ${command[1]}`);
    break;
    case /^ar \S+$/.test(data):
      allies = allies.filter(item => item !== command[1]);
      renderChatBox(`${status.ok}Removed ally ${command[1]}`);
    break;
    case /^raa$/.test(data):
      allies = [master, bot.username];
      renderChatBox(`${status.ok}Removed all allies`)
    break;
    /* RESTORE LOADOUT */
    case /^rep$/.test(data):
      restoreLoadout();
    break;

    // DEBUG
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
    case /^rg$/.test(data): {
      const cobweb = bot.players[master];
      if (cobweb) {
        renderChatBox(util.inspect(cobweb));
      } else renderChatBox(`${status.warn}No cobwebs found`);
    }
    break;
    /* LIST ELEMENTS */
    case /^i$/.test(data):
      getItems();
    break;
    case /^p$/.test(data):
      getPlayers();
    break;
    /* QUIT */
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
}
/*
  FUNCTIONS: TIMERS
*/
async function handleCooldown(value, type) {
  cooldown[type].time = value > 0 ? value : cooldown[type].time + 0.99;
  if (type != 'pvp') renderChatBox(`${status[type]}${status.info}Cooldown for ${type} started, ${cooldown[type].time}s left`);

  cooldown[type].time = parseInt(cooldown[type].time, 10);
  
  if (!cooldown[type].lock) {
    cooldown[type].lock = true;
    while (cooldown[type].time > 0) {
      cooldown[type].time -= 0.1;
      await bot.waitForTicks(2);
    }
  }
  
  if (cooldown[type].time <= 0 && cooldown[type].lock === true){
    cooldown[type].time = 0;
    cooldown[type].lock = false;
    renderChatBox(`${status[type]}${status.info}Cooldown for ${type} ended, [TIME: ${cooldown[type].time} LOCK: ${cooldown[type].lock}]`);
  }
}
/*
  FUNCTIONS: CALCULATIONS
*/
function isInCylinder([px, py, pz], { center: [cx, cy, cz], radius, height }) {
  const withinHeight = py >= cy && py <= cy + height;
  const withinRadius = (px - cx) ** 2 + (pz - cz) ** 2 <= radius ** 2;
  return withinHeight && withinRadius;
}
function getStrafeVelocity(position, angleDegrees, speed) {
  const [targetX, targetZ] = position;
  const dx = targetX - bot.entity.position.x;
  const dz = targetZ - bot.entity.position.z;
  const length = Math.hypot(dx, dz) || 999;
  const angle = angleDegrees * (Math.PI / 180);
  if (length === 999) return [Math.random() * 20 - 10, Math.random() * 20 - 10];
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const velocityX = ((dx / length) * cosA - (dz / length) * sinA) * speed;
  const velocityZ = ((dx / length) * sinA + (dz / length) * cosA) * speed;
  return [velocityX, velocityZ];
}
function getPearlTrajectory(distance) {
  const g = 1.6, velocity = 10;
  const sineTheta = (g * distance) / (velocity ** 2);
  if (Math.abs(sineTheta) > 1) throw new Error(`${status.error}Distance too far for initial velocity.`);
  return distance * Math.sin(0.5 * Math.asin(sineTheta));
}
//
function rateIntValue(max, current, reverse) {
  const percentage = (parseInt(current, 10) / parseInt(max, 10)) * 100;
  const roundedCurrent = Math.round(current);
  const statusType = reverse ? 
    (percentage > 66 ? "bad" : percentage > 33 ? "mediocre" : "good"):
    (percentage > 66 ? "good" : percentage > 33 ? "mediocre" : "bad");
  return `${status[statusType]}${roundedCurrent}{/}`;
}
function rateBoolValue(current, reverse) {
  const statusType = reverse ? (current ? "bad" : "good") : (current ? "good" : "bad");
  return `${status[statusType]}${current}{/}`;
}
//
const adjustVelocity = (value, boundary) => Math.max(-boundary, Math.min(value, boundary));
//
function floorVec3(vec3) {
  return {
      x: Math.floor(vec3.x),
      y: Math.floor(vec3.y),
      z: Math.floor(vec3.z)
  };
}
function roundVec3(vec3) {
  return {
      x: Math.round(vec3.x),
      y: Math.round(vec3.y),
      z: Math.round(vec3.z)
  };
}
function getMidpoint(point1,point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
    z: (point1.z + point2.z) / 2
  };
}
function updateWebBlocks() {
  botWebBlock = bot.findBlocks({
    point: bot.entity.position,
    matching: bot.registry.blocksByName.web.id,
    maxDistance: 2,
    count: 2,
  });
  entityWebBlock = bot.findBlocks({
    point: bot.pvp.target?.position,
    matching: bot.registry.itemsByName.web.id,
    maxDistance: 3,
    count: 1,
  });
  const botPositionClone = bot.entity.position.clone();
  const deltaPosition = bot.entity.position.y - floorVec3(botPositionClone).y;

  [entityWebBlock, botWebBlock].forEach(blockArray => {
    blockArray.forEach(block => {
      if (blockArray === botWebBlock && block.y) {
        block.set(
          block.x + 0.5,
          block.y + deltaPosition,
          block.z + 0.5
        );
      } else if (block.x && block.y && block.z) {
        block.set(
          block.x + 0.5,
          block.y,
          block.z + 0.5
        );
      }
    });
  });
}
/*
  FUNCTIONS: PHYSICS
*/
function resetVelocity() {
  if ((isInLiquid || isJesusing) && !bot.pathfinder.isMoving()) {
    // retard mode but works?
    renderChatBox(`${status.verbose}RESET vel`)
    bot.entity.velocity.set(0,-0.08,0);
    bot.entity.velocity.set(0,-0.08,0);
  }
}
async function unstuck(path) {
  if (path === 'stuck' && (isInLiquid || isJesusing || bot.entity.isInWeb)) {
    renderChatBox(`${status.warn}Bot stuck! Waiting 10 ticks to unstuck`);
    isHunting = false;
    resetCombat();
    bot.clearControlStates();
    bot.entity.velocity.set(0,0,0);
    await bot.waitForTicks(10);
    isHunting = true;
  }
}
function jesusOnLiquid() {
  const liquidBelow = bot.blockAt(bot.entity.position.offset(0, -0.2, 0));
  isInLiquid = (liquidBelow && (liquidBelow.name === 'water' || liquidBelow.name === 'lava') || (bot.entity.isInWater || bot.entity.isInLava));

  const liquidBoundary = bot.blockAt(bot.entity.position.offset(0, -0.001, 0));
  if (bot.entity.isInWater || bot.entity.isInLava || liquidBoundary.name === 'water' || liquidBoundary.name === 'lava') {
    isJesusing = true;
    //renderChatBox(bot.entity.position)
    bot.entity.velocity.set(bot.entity.velocity.x,0.11,bot.entity.velocity.z);

    bot.setControlState('jump', false);
    //bot.setControlState('sprint', false);
  } else {
    isJesusing = false;
  }
}
function strafeMovement() {
  const entity = bot.pvp.target;
  const entityPos = [entity.position.x,entity.position.z];

  const entityCloseToWebBlock = entityWebBlock[0] && entityWebBlock[0].distanceTo(entity.position) <= 1.5;
  const botCloseToWebBlock = botWebBlock[0] && botWebBlock[0].distanceTo(bot.entity.position) < 1.1;
  bot.pvp.followRange = (entityCloseToWebBlock || botCloseToWebBlock) ? 2 : 5;

  if (!isInLiquid && bot.entity.onGround && bot.entity.position.distanceTo(entity.position) <= bot.pvp.followRange && bot.pvp.followRange === 5) {
    if (!entityWebBlock[0]) {
      strafe(entityPos, 30, 0.6);
    } else {
      const entityDistToWebBlock = entityWebBlock[0].distanceTo(entity.position);
      const strafeSpeed = entityDistToWebBlock >= 3.5 ? 0.6 : entityDistToWebBlock > 1.5 ? 0.4 : null;
      if (strafeSpeed) {
        strafe(entityPos, 30, strafeSpeed);
      }
    }
  }
}
// Вы были телепортированы в Lobby. Причина: Timed out
function strafe(position,angleDegrees,speed) {
  const [velocityX,velocityZ] = getStrafeVelocity(position,angleDegrees,speed);
  if (bot.entity.onGround && !isJesusing && !isInLiquid) {
    bot.entity.velocity.set(velocityX,0.42,velocityZ);
    bot.setControlState('forward', false);
  }
}
/*
  FUNCTIONS: RENDERING UI TEXT
*/
function renderTable(headers, rows, type) {
  const columnWidths = headers.map(header => header.length);
  rows.forEach(row => {
      row.forEach((cell, index) => {
          columnWidths[index] = Math.max(columnWidths[index], cell.length);
      });
  });
  const formatRow = (row, type) => {
      return row.map((cell, index) => {
        return formatCell(cell, index, type, columnWidths);
      }).join(' | ');
  };

  renderChatBox(formatRow(headers,type));
  renderChatBox(columnWidths.map(width => '-'.repeat(width)).join('-|-'));

  rows.forEach(row => {
      renderChatBox(`${formatRow(row,type)}`);
  });
}
function formatCell(cell, index, type, columnWidths) {
  if (type === 'players') {
    switch (true) {
      case allies.includes(cell):
          return `{green-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case bot.players[cell]?.gamemode === 1:
          return `{cyan-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case !isNaN(cell):
          return `{green-fg}${rateIntValue(100,cell.padEnd(columnWidths[index]),true)}{/}`;
      default:
          return cell.padEnd(columnWidths[index]);
    }
  } else if (type === 'items') {
    switch (true) { 
      case bot.inventory.findInventoryItem(bot.registry.itemsByName[cell]?.id)?.enchants.length >= 1:
          return `{cyan-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case cell === 'totem_of_undying':
          return `{yellow-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case cell === 'potion':
          return `{magenta-fg}${cell.padEnd(columnWidths[index])}{/}`;
      default:
          return cell.padEnd(columnWidths[index]);
    }
  }
}
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
function renderError(err) {
  if (!isLogging) return;
  chatBox.log(pe.render(err));
  chatBox.scrollTo(chatBox.getScrollHeight());
  screen.render();
}
/*
  FUNCTIONS: INVENTORY/SLOT MANAGEMENT
*/
async function unequipItem(destination) {
  const t0 = performance.now();
  try {
    await bot.unequip(destination);
    const t1 = performance.now();
    renderChatBox(`${status.ok}Unequipped ${destination} in ${(t1 - t0).toFixed(2)}ms`);
  } catch (err) {
    renderError(err.message);
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
      renderError(err.message);
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
      renderError(err.message);
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
/*
  FUNCTIONS: INVENTORY COUNTING
*/
function getPlayers() {
  const headers = ['Username','Ping'];
  const rows = [];
  Object.values(bot.players).forEach(player => {
    let { username, ping } = player;
    rows.push([username.toString(), ping.toString()]);
  });
  renderChatBox(`${status.info}${rows.length} players online`);
  renderTable(headers, rows, 'players');
}
function getItems() {
  const headers = ['Name','Id','Slot','Count'];
  const rows = [];

  bot.inventory.items().map(item => {
    let { name, type, slot, count } = item;
    rows.push([name.toString(), type.toString(), slot.toString(), count.toString()]);
  });
  const outputCount = bot.inventory.items().map((item) => item).filter(Boolean).length;
  renderChatBox(`${status.info}${outputCount} items in inventory`);
  renderTable(headers, rows, 'items');
}
function getItemCount(itemId) {
  const itemType = bot.registry.itemsByName[itemId].id;
  const allItems = [...bot.inventory.items(), ...Object.values(bot.entity.equipment)];
  return allItems
    .filter(item => item?.type === itemType)
    .reduce((acc, item) => acc + item.count, 0);
}
/*
  FUNCTIONS: RESET
*/
function resetCombat() {
  bot.pvp.forceStop();
  bot.pathfinder.setGoal(null);
  renderChatBox(`${status.ok}resetCombatVariables completed`);
}
/*
  FUNCTIONS: COMBAT INVENTORY MANAGMENT
*/
async function equipArmor() {
  const armorPieces = [
    { destination: 'head', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null), minEnch: 8 },
    { destination: 'torso', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null), minEnch: 6 },
    { destination: 'legs', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null), minEnch: 6 },
    { destination: 'feet', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null), minEnch: 9 }
  ];
  for (const piece of armorPieces) {
    if (piece.item?.nbt && piece.item && piece.item.enchants.length >= piece.minEnch) {
      if (bot.inventory.slots[bot.getEquipmentDestSlot(piece.destination)] === null || bot.inventory.slots[bot.getEquipmentDestSlot(piece.destination)].type != piece.item.type) {
        strikeValue['armor']++;
        if (strikeValue['armor'] >= 2) {
          renderChatBox(`${status.armor}${status.warn}${piece.destination} timeout at ${strikeValue['armor']}`);
          await bot.waitForTicks(5);
          strikeValue['armor'] = 0;
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
  if (((bot.health + bot.entity?.metadata[11]) <= 20 && bot.pvp.target || (bot.health + bot.entity?.metadata[11]) <= 19.9) && (((bot.health + bot.entity?.metadata[11]) > 3+deltaHealth && getItemCount('totem_of_undying') >= 1) || (getItemCount('totem_of_undying') === 0))) {
    const gapple = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null) || bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')];
    if (gapple && gapple?.type === bot.registry.itemsByName.golden_apple.id) {
      strikeValue['gapple']++;
      if (strikeValue['gapple'] >= 2) {
        renderChatBox(`${status.gapple}${status.warn}Golden apple timeout at ${strikeValue['gapple']}`);
        await bot.waitForTicks(45);
        strikeValue['gapple'] = 0;
        return;
      }
      isHealing = true;
      lockValue['off-hand'] = true;
      const oldItemCount = getItemCount('golden_apple');
      renderChatBox(`${status.gapple}${status.info}STARTED Healing function`);

      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != gapple.type) {
        await bot.waitForTicks(3);
        await equipItem(gapple.type, 'off-hand');
      }

      bot.activateItem(true);
      await bot.waitForTicks(35);
      bot.deactivateItem();

      const newItemCount = getItemCount('golden_apple');
      const cooldown = 14;
      handleCooldown(cooldown, 'gapple');
      if (newItemCount < oldItemCount || bot.entity.effects[10]) {
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
      strikeValue['buff']++;
      if (strikeValue['buff'] >= 2) {
        renderChatBox(`${status.buff}${status.warn}Buff timeout at ${strikeValue['buff']}`);
        await bot.waitForTicks(45);
        strikeValue['buff'] = 0;
        return;
      }
      lockValue['off-hand'] = true;
      const oldItemCount = getItemCount('potion');
      renderChatBox(`${status.buff}${status.info}Buff STARTED`);

      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != buff.type) {
        await bot.waitForTicks(3);
        await equipItem(buff.type, 'off-hand');
      }

      bot.activateItem(true);
      await bot.waitForTicks(35);
      bot.deactivateItem();

      const newItemCount = getItemCount('potion');
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
  if (((bot.health + bot.entity?.metadata[11]) <= 3+deltaHealth || getItemCount('golden_apple') === 0) && bot.inventory.slots[45]?.type != bot.registry.itemsByName.totem_of_undying.id) {
    const totem = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);
    if (totem) {
      strikeValue['totem']++;
      if (strikeValue['totem'] >= 2) {
        renderChatBox(`${status.totem}${status.warn}Totem timeout at ${strikeValue['totem']}`);
        await bot.waitForTicks(5);
        strikeValue['totem'] = 0;
        return;
      }
      lockValue['off-hand'] = true;
      renderChatBox(`${status.totem}`);
      await bot.waitForTicks(3);
      await equipItem(totem.type, 'off-hand');
      renderChatBox(`${status.totem}`);
      lockValue['off-hand'] = false;
    }
  } 
}
async function tossPearl() {
  const entity = bot.nearestEntity(e => e.type === 'player' && e.username === bot.pvp.target?.username);
  if (entity && (entity?.position.distanceTo(bot.entity.position) >= 10 || bot.player.isInWater || bot.player.isInLava || bot.player.isInWeb) && cooldown['pearl'].time === 0) {
    const pearl = bot.inventory.findInventoryItem(bot.registry.itemsByName.ender_pearl.id, null);
    if (pearl) {
      strikeValue['pearl']++;
      if (strikeValue['pearl'] >= 2) {
        renderChatBox(`${status.pearl}${status.warn}Pearl timeout at ${strikeValue['pearl']}`);
        await bot.waitForTicks(5);
        strikeValue['pearl'] = 0;
        return;
      }
      lockValue['off-hand'] = true;
      isHunting = false;
      resetCombat();
      const angleInBlocks = getPearlTrajectory(entity.position.distanceTo(bot.entity.position));
      const oldItemCount = getItemCount('ender_pearl');
      renderChatBox(`${status.pearl}${status.info}Pearl STARTED`);

      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != pearl.type) {
        await bot.waitForTicks(3);
        await equipItem(pearl.type, 'off-hand');
      }

      bot.pathfinder.setGoal(null);
      bot.pvp.forceStop();

      await bot.lookAt(entity.position.offset(0,angleInBlocks+0.8,0), true);
      await bot.waitForTicks(5);
      bot.activateItem(true);
      await bot.waitForTicks(2);
      bot.deactivateItem();

      const newItemCount = getItemCount('ender_pearl');
      const cooldown = 14;
      if (newItemCount < oldItemCount) {
        handleCooldown(cooldown, 'pearl');
        renderChatBox(`${status.pearl}${status.ok}Pearl SUCCESS`);
      } else {
        handleCooldown(cooldown, 'pearl');
        renderChatBox(`${status.pearl}${status.error}Pearl FAILED`);
      }
      isHunting = true;
      lockValue['off-hand'] = false;
    }
  }
}
async function equipPassive() {
  const itemPieces = [
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null), slot: 'off-hand', slotCheck: bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')], slotUsed: 'off-hand' },
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null), slot: 'hand', slotCheck: bot.heldItem, slotUsed: 'hand' }
  ]
  for(const piece of itemPieces) {
    if (piece.item && piece.slotCheck?.type != piece.item.type) {
      strikeValue['passive']++;
      if (strikeValue['passive'] >= 2) {
        renderChatBox(`${status.passive}${status.warn}Passive timeout at ${strikeValue['passive']}`);
        await bot.waitForTicks(5);
        strikeValue['passive'] = 0;
        return;
      }
      if ((piece.slotUsed === 'off-hand' || piece.item.enchants.length >= 8) && !lockValue[piece.slotUsed]) {
        lockValue[piece.slotUsed] = true;
        renderChatBox(`${status.passive}${piece.item.displayName}`);
        await bot.waitForTicks(3);
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
      strikeValue['junk']++;
      if (strikeValue['junk'] >= 2) {
        await bot.waitForTicks(5);
        strikeValue['junk'] = 0;
        return;
      }
      lockValue['hand'] = true;
      lockValue['off-hand'] = true;
      await bot.waitForTicks(3);
      await tossItem(item.type, item.count);
      lockValue['hand'] = false;
      lockValue['off-hand'] = false;
    }
  }
}
/*
  FUNCTIONS: RESTORE LOADOUT
*/
async function restoreLoadout() {
  const data = fs.readFileSync('./inventory-nbt.conf', 'utf8');
  const lines = data.split('\n');

  if (cooldown['pvp'].time > 0) throw new Error(`${status.error}Exit combat before replenishing!`);

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
        await bot.waitForTicks(3);
        bot.creative.setInventorySlot(slot, new Item(itemType, result.count, result.metadata, itemNbt));
        lockValue['hand'] = false;
        lockValue['off-hand'] = false;
      }
    }
  }
  if (bot.player.gamemode != 0) {
    renderChatBox(`${status.info}Gamemode: ${bot.player.gamemode} Setting gamemode to 0`);
    await bot.waitForTicks(5);
    bot.chat('/gm 0');
  }
  isAutoEquipping = true;
}
/*
  FUNCTIONS: TARGETING
*/
function huntPlayer() {
  const filterEntity = (() => {
    switch (combatMode) {
      case 0:
        return e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) <= 64 && e.kind === 'Hostile mobs';
      case 1:
        return e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 64 && bot.players[e.username]?.gamemode === 0 && !allies.includes(e.username);
      case 2:
        return e => e.type === 'player' &&
                    (isInCylinder([e.position.x, e.position.y, e.position.z], cylinder1) || 
                     isInCylinder([e.position.x, e.position.y, e.position.z], cylinder2)) &&
                    e.position.distanceTo(bot.entity.position) <= 64 &&
                    bot.players[e.username]?.gamemode === 0 && 
                    !allies.includes(e.username);
      case 3:
        return e => e.type === 'player' && 
                    e.position.distanceTo(bot.entity.position) <= 64 &&
                    e.username === master;
    }
  })();
  const entity = bot.nearestEntity(filterEntity);
  if (entity) { 
    if ((isInLiquid || isJesusing) && !bot.pathfinder.isMoving()) {
      renderChatBox(`${status.debug} ${isInLiquid || isJesusing} ${bot.pathfinder.isMoving()}`);
      bot.setControlState('forward', true);
    }
    if (entity.position.distanceTo(bot.entity.position) <= bot.pvp.attackRange) {
      if (entity.elytraFlying) {
        bot.lookAt(entity.position.offset(0,0,0), true);
      } else {
        bot.lookAt(entity.position.offset(0,0.8,0), true);
      }
    }
    bot.pvp.attack(entity);
    // if in  x seconds delta position less than 1-2 blocks: reset velocity
  } else { 
    bot.pvp.forceStop();
  }
}
/*
  FUNCTION LOOP 
*/
bot.on('physicsTick', async () => {
  if (!isWindowLocked || !isAutoEquipping) return;
  jesusOnLiquid();
  if (bot.entity.isInWeb) bot.setControlState('jump', false);
  // HIGHEST PRIORITY
  if (strikeValue['armor'] < 2) equipArmor(); // MAIN HAND
  if (cooldown['gapple'].time === 0 && !cooldown['gapple'].lock && strikeValue['gapple'] < 2) equipGapple(); // OFFHAND
  if (!isHealing && !lockValue['off-hand']) {
    if (strikeValue['totem'] < 2) equipTotem(); // OFFHAND
    if (cooldown['buff'].time === 0 && !cooldown['buff'].lock && strikeValue['buff'] < 2) equipBuff(); // OFFHAND
    if (cooldown['pearl'].time === 0 && !cooldown['pearl'].lock && strikeValue['pearl'] < 2) tossPearl(); // OFFHAND
  }
  // HIGH PRIORITY
  if (!isHealing && !lockValue['hand'] && !lockValue['off-hand'] && (bot.health+bot.entity?.metadata[11]) > 3+deltaHealth) {
    if (strikeValue['passive'] < 2) equipPassive(); // MAIN HAND
    if (cooldown['pvp'].time === 0 && strikeValue['junk'] < 2) tossJunk(); // MAIN HAND
  }
  // LOW PRIORITY
  if (bot.pvp.target) strafeMovement();
  if (isHunting) huntPlayer();
});
setInterval(() => {
  if (!isWindowLocked || !isAutoEquipping) return;
  updateWebBlocks();
}, 500);
setInterval(() => {
  if (!isWindowLocked || !isAutoEquipping) return;
  resetVelocity();
}, 1500);
setInterval(() => {
  if (!isWindowLocked) return;
  const helmetPerc = (((363 - bot.inventory.slots[5]?.durabilityUsed) / 363) * 100);
  const chestplatePerc = (((528 - bot.inventory.slots[6]?.durabilityUsed) / 528) * 100);
  const leggingsPerc = (((495 - bot.inventory.slots[7]?.durabilityUsed) / 495) * 100);
  const bootsPerc = (((429 - bot.inventory.slots[8]?.durabilityUsed) / 429) * 100);
  const targetPos = [bot.pvp.target?.position.x,bot.pvp.target?.position.y,bot.pvp.target?.position.z];

  const banner =
  `BOT ${bot.username} ${rateIntValue(36,(bot.health+bot.entity?.metadata[11]))} ${combatMode} ` +
  `TARGET ${bot.pvp.target?.username} ${rateIntValue(36,(bot.pvp.target?.metadata[7]+bot.pvp.target?.metadata[11]))} ${isInCylinder(targetPos,cylinder1) || isInCylinder(targetPos,cylinder2) ? status.good+'true{/}' : status.bad+'false{/}'} ` +
  `DIST ${rateIntValue(10,bot.pvp.target?.position.distanceTo(bot.entity.position))} ${bot.pvp.followRange}\n` +
  `DHEALTH ${rateIntValue(5,deltaHealth)} ` +
  // INVENTORY
  `PEARL ${rateIntValue(32,getItemCount('ender_pearl'))} BUFF ${rateIntValue(5,getItemCount('potion'))} TOTEM ${rateIntValue(8,getItemCount('totem_of_undying'))} GAPPLE ${rateIntValue(64,getItemCount('golden_apple'))} ` + 
  `ARMOR ${rateIntValue(6,getItemCount('diamond_helmet'))}|${rateIntValue(6,getItemCount('diamond_chestplate'))}|${rateIntValue(6,getItemCount('diamond_leggings'))}|${rateIntValue(6,getItemCount('diamond_boots'))} ` +
  `ARMOR% ${rateIntValue(100,helmetPerc)}|${rateIntValue(100,chestplatePerc)}|${rateIntValue(100,leggingsPerc)}|${rateIntValue(100,bootsPerc)}\n` +
  // COMBAT INDICATORS
  `HIT ${cooldown['hit']?.lock ? status.bad+(cooldown['hit']?.time ?? 0).toFixed(2) : status.good+(cooldown['hit']?.time ?? 0).toFixed(2)}{/} PVP ${cooldown['pvp']?.lock ? status.bad+(cooldown['pvp']?.time ?? 0).toFixed(2) : status.good+(cooldown['pvp']?.time ?? 0).toFixed(2)}{/} BUFF ${cooldown['buff']?.lock ? status.bad+(cooldown['buff']?.time ?? 0).toFixed(2) : status.good+(cooldown['buff']?.time ?? 0).toFixed(2)}{/} GAPPLE ${cooldown['gapple']?.lock ? status.bad+(cooldown['gapple']?.time ?? 0).toFixed(2) : status.good+(cooldown['gapple']?.time ?? 0).toFixed(2)}{/} PEARL ${cooldown['pearl']?.lock ? status.bad+(cooldown['pearl']?.time ?? 0).toFixed(2) : status.good+(cooldown['pearl']?.time ?? 0).toFixed(2)}{/} ` +
  `HAND ${rateBoolValue(lockValue['hand'],true)} OFF-HAND ${rateBoolValue(lockValue['off-hand'],true)}\n` +
  `HSR ${rateIntValue(100,((pvpHitSuccess/pvpHitAttempts)*100))} ` +
  `JESUS RDY ${rateBoolValue(isInLiquid)} STBY ${rateBoolValue(isJesusing)} ` + 
  `STRAFE RDY ${rateBoolValue(bot.entity.onGround)} ` + 
  `PREVENT ${rateBoolValue(isPreventing)} ` +
  `CONTROL ${rateBoolValue(bot.getControlState('forward'))} ${rateBoolValue(bot.getControlState('sprint'))} ${rateBoolValue(bot.getControlState('jump'))} `
  renderFunctionBox(banner);
}, 50);
/*
  bot.on() EVENT TRIGGERS
*/ // Sheikh ??????? IP selfharm ('37.214.23.240') ?? 'osn na nacionalnoi po4ve'.
inputBox.on('submit', async (data) => cliCommands(data));
bot.on('messagestr', (data) => logAbnormalities(data));
bot.on('message', async (data) => chatCommands(data)); 
bot.on('windowOpen', async (window) => {
  if (isWindowLocked) return;
  await bot.clickWindow(0,0,0);
  await window.close();
});
bot.on('path_reset', (path) => unstuck(path));
bot.on('scoreRemoved', () => {
  if (cooldown['pvp'].lock || !bot.players[master]) return;
  const dynamicKeyRegex = /^\s*.*Денег:.*\$$/;
  const dynamicKey = Object.keys(bot.scoreboards.JampireBoard.itemsMap).find(key => dynamicKeyRegex.test(key));
  const match = /\d+/.exec(bot.scoreboards.JampireBoard.itemsMap[dynamicKey]?.name.toString());
  const value = match ? match[0] : null;
  if (value > 0) bot.chat(`/pay ${master} ${value}`);
});
bot.on('attackedTarget', () => { pvpHitAttempts++; });
bot.on('entityHurt', (entity) => {
  entity.username === bot.pvp.target?.username && pvpHitSuccess++
  if (entity.username === bot.username) {
    if (oldHealth === 0) {
      oldHealth = (bot.health+bot.entity?.metadata[11]);
    } else if (oldHealth != 0) {
      newHealth = (bot.health+bot.entity?.metadata[11]);
      if ((oldHealth-newHealth) > 1) deltaHealth = oldHealth-newHealth;
      oldHealth = 0;
      newHealth = 0;
    }
  }
});
bot.on('particle', (particle) => {
  const floorParticle = floorVec3(particle.position);
  const floorBot = floorVec3(bot.entity.position);
  if (particle.id === 45 && floorParticle.x === floorBot.x && floorParticle.y === floorBot.y && floorParticle.z === floorBot.z) {
    renderChatBox(`${status.debug}CRITICAL HIT FROM BOT ${util.inspect(particle)}\n${status.debug}${bot.entity.position}`);
  }
})
bot.on('death', async() => {
  renderChatBox(`${status.info}${bot.username} has died, waiting for ${Math.ceil((cooldown['pvp'].time ?? 1) *20)} ticks`);
  resetCombat();
  await bot.waitForTicks(Math.ceil((cooldown['pvp'].time ?? 1)*20 + 5));
  await restoreLoadout();
  const zoneArray = ['',2,4];
  const zone = Math.floor(Math.random() * zoneArray.length);
  if (combatMode === 2) bot.chat(`/warp play${zoneArray[zone]}`); else bot.chat(`/home home`);
});

screen.key(['C-z'], () => logBox.focus());
screen.key(['C-x'], () => chatBox.focus());
screen.key(['return', 'enter'], () => {
  inputBox.submit();
  inputBox.focus();
});
screen.key(['escape'], () => {
  bot.end();
  process.exit(0);
});
inputBox.key(['tab'], () => getTabComplete());
bot.on('error', (err) => renderError(err));
process.on('uncaughtException', (err) => renderError(err));
process.on('warning', (err) => renderError(err));