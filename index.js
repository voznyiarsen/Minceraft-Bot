const mineflayer = require('mineflayer');
const PrettyError = require('pretty-error');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow, GoalXZ, GoalNear} = require('mineflayer-pathfinder').goals;
const pvp = require('mineflayer-pvp').plugin;
const bloodhoundPlugin = require('mineflayer-bloodhound')(mineflayer);

const { screen, chatBox, functionBox, logBox, inputBox } = require('./scripts/ui');

const fs = require('fs');
const nbt = require('prismarine-nbt');
const Item = require('prismarine-item')('1.12.2');
const util = require('util');

const { Vec3 } = require('vec3');

const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('blessed', 'vm');
pe.skipPath(__filename);

const host = process.argv[2];
const username = process.argv[3];
const password = process.argv[4]; 
const master = process.argv[5];

if (process.argv.length < 6) {
  console.log('Usage index.js [host] [username] [password] [master]');
  process.exit(1);
}

const config = {
  host: host,
  port: '25565',
  username: username,
  logErrors: false,
  hideErrors: true,
  //checkTimeoutInterval: 15*1000,
  version: '1.12.2'
}
const options = {
  itemCooldown: 14,
  healthOffset: 3
}

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
  hurt: '{red-bg}{white-fg}HURT{/} '
};

let bot = mineflayer.createBot(config);

let isLogging = true;
let isAutoEquipping = true;
let isWindowLocked = false;
let isWindowClickLocked = false;
let isSilent = true;
let isHunting = false;
let isHealing = false;
let isChatEnabled = true;
let isLobbyLocked = false;

let pvpHitAttempts = 0;
let pvpHitSuccess = 0;
let noPvPCountdownLock = false;

let combatMode = 2;
let allies = [master, 'Plotva', 'maksim2008'];

let tabCompleteIndex = 0;
let tabComplete;

let targetPlayer;

let botWebBlock;
let entityWebBlock;
/* ARENA COORDINATES FOR combatMode 2 */
const cylinder1 = {
  center: [2190.5, 0, 1003.5],
  radius: 39.85,
  height: 255
};
const cylinder2 = {
  center: [2190.5, 76, 1003.5],
  radius: 45.9,
  height: 255
};
/* LOADOUT NBT DATA */
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

/* COOLDOWNS & THROTTLES */
const cooldown = {};
const cooldownTypes = ['pvp','gapple','pearl','buff','hurt']
for (const type of cooldownTypes) cooldown[type] = {time: 0, lock: false};

const lockValue = {};
const lockValueTypes = ['hand','off-hand','passive','gapple','totem','armor','buff','pearl','junk'];
for (const type of lockValueTypes) lockValue[type] = false;

const strikeValue = {};
const strikeValueTypes = ['passive','gapple','totem','armor','buff','pearl','junk','pvp'];
for (const type of strikeValueTypes) strikeValue[type] = 0;

let reconnectDelay = 10000;

/* DYNAMIC VALUES */
let oldHealth = 0;
let newHealth = 0;
let deltaHealth = 0;

let isTouchingLiquid = false;
let isOverLiquid = false;
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
async function logAbnormalities(data) {
  const filteredMessages = [
    /^\[❤\] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом\.$/,
    /^\[Внимание\] АКЦИЯ! Неделя супер скидок! Успей купить выгодно:\) Покупать тут - https:\/\/MineLegacy\.ru $/
  ];
  /* Wrote this because the server admin occasionally leaks IPs of players, just in case ;)*/
  if (isLobbyLocked && !filteredMessages.some(regex => regex.test(data))) {
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
    /* LOGIN */
    case data == '[❤] Иди к порталам, и выбери сервер для игры, либо воспользуйся компасом.':
      if (isLobbyLocked) {
        isWindowLocked = true;
        isAutoEquipping = false;
        const redstone = bot.inventory.findInventoryItem(bot.registry.itemsByName.redstone.id, null);
        if (Object.keys(bot.players).length === 1 && redstone) {
          renderChatBox(`${status.info}There is only ${Object.keys(bot.players).length} player`);
          await equipItem(redstone.type, 'hand');
          await bot.waitForTicks(5);
          bot.activateItem();
        }
        return;
      }
      isAutoEquipping = true;
      isWindowLocked = false;
      renderChatBox(`${status.ok}isAutoEquipping? ${rateBoolValue(isAutoEquipping)}`);
      renderChatBox(`${status.ok}isWindowLocked? ${rateBoolValue(isWindowLocked)}`);
      bot.setQuickBarSlot(0);
      bot.activateItem();
    break;
    case /^\s{43}$/.test(data):
      if (isLobbyLocked) {
        isWindowLocked = true;
        isAutoEquipping = false;
        return;
      }
      isAutoEquipping = true;
      isWindowLocked = true;
      renderChatBox(`${status.ok}isAutoEquipping? ${rateBoolValue(isAutoEquipping)}`);
      renderChatBox(`${status.ok}isWindowLocked? ${rateBoolValue(isWindowLocked)}`);
    break;
    case /^Вы были телепортированы в Lobby.+$/.test(data):
      if (isLobbyLocked) {
        isWindowLocked = true;
        isAutoEquipping = false;
        return;
      }
      isWindowLocked = false;
      renderChatBox(`${status.ok}isAutoEquipping? ${rateBoolValue(isAutoEquipping)}`);
      renderChatBox(`${status.ok}isWindowLocked? ${rateBoolValue(isWindowLocked)}`);
      await bot.waitForChunksToLoad();
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
      const entity = bot.nearestEntity(e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 0.1);
      if (entity) {
        renderChatBox(`${status.warn}${entity.username} teleported me!`);
        if (isSilent) {
          renderChatBox(`${status.warn}isSilent is set to ${rateBoolValue(isSilent)}, not running the bot.chat() command`);
        } else {
          bot.chat(`/cc ${entity.username} телепортировал меня`);
        }
      }
    }
    break;
    /* PvP */
    case /^\[MineLegacy\] Вы убили игрока .+, и получили за это \$\d+\.\d+\. Нанесённый урон: \d+\.\d\/\d+\.\d$/.test(data): {
      if (isSilent) {
        renderChatBox(`${status.warn}isSilent is set to ${rateBoolValue(isSilent)}, not taunting player`);
        return;
      }
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
      bot.chat(`!${bot.pvp.target.username} ${insults[randomIndex]}`);
    }
    break;
    case /^\[MineLegacy\] Вы были убиты игроком .+, и потеряли \$\d+\.\d+\.$/.test(data):
      if (isSilent) {
        renderChatBox(`${status.warn}isSilent is set to ${rateBoolValue(isSilent)}, not excusing`);
        return;
      }
    break;
    case /^Вы сможете использовать золотое яблоко через \d+ секунд.*\.$/.test(data): {
      const regex = /\d+/;
      const match = regex.exec(data.toString());
      const value = match ? match[0] : null;
      handleCooldown(parseInt(value,10), 'gapple');
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
      handleCooldown(parseInt(value,10), 'pearl');
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
        await bot.waitForTicks(40);
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
    case /^pray$/.test(data):
      pray();
    break;
    /* PATHFIND */
    case /^goto -?\d*\s?-?\d*\s?-?\d*$/.test(data): 
      if (command.length === 4) {
        let [x, y, z] = [command[1], command[2], command[3]];
        x = parseInt(x, 10);
        y = parseInt(y, 10);
        z = parseInt(z, 10);
        renderChatBox(`${status.ok}Set goal to X: ${x} Y: ${y} Z: ${z}`);

        const goal = new GoalNear(x, y, z, 1);
        bot.pathfinder.setGoal(goal);
      } else if (command.length === 3) {
        let [x, z] = [command[1], command[2]];
        x = parseInt(x, 10);
        z = parseInt(z, 10);
        renderChatBox(`${status.ok}Set goal to X: ${x} Z: ${z}`);

        const goal = new GoalXZ(x, z);
        bot.pathfinder.setGoal(goal);
      }
    break;
    /* CHANGE MODE */
    case /^ieq$/.test(data):
      isAutoEquipping = !isAutoEquipping;
      renderChatBox(`${status.ok}isAutoEquipping set to ${rateBoolValue(isAutoEquipping)}`);
    break;
    case /^cm(\s[0-4])?$/.test(data):
      combatMode = command[1] ? parseInt(command[1], 10) : (combatMode + 1) % 4;
      renderChatBox(`${status.ok}combatMode set to ${combatMode}`);
    break;
    case /^ice$/.test(data):
      isChatEnabled = !isChatEnabled;
      renderChatBox(`${status.ok}isChatEnabled set to ${rateBoolValue(isChatEnabled)}`);
    break;
    case /^il$/.test(data):
      renderChatBox(`${status.ok}isLogging set to ${rateBoolValue(!isLogging)}`);
      isLogging = !isLogging;
      renderChatBox(`${status.ok}isLogging set to ${rateBoolValue(isLogging)}`);
    break;
    case /^ill$/.test(data):
      isLobbyLocked = !isLobbyLocked
      renderChatBox(`${status.ok}isLobbyLocked set to ${rateBoolValue(isLobbyLocked)}`);
    break;
    case /^is$/.test(data):
      isSilent = !isSilent;
      renderChatBox(`${status.ok}isSilent set to ${rateBoolValue(isSilent)}`);
    break;
    /* ENABLE/DISABLE COMBAT */
    case /^g$/.test(data):
      isHunting = !isHunting;
      if (!isHunting) resetCombat();
      renderChatBox(`${status.ok}isHunting set to ${rateBoolValue(isHunting)}`);
    break;
    case /^fe$/.test(data): {
      const player = bot.nearestEntity(e => e.type === 'player' && 
        e.position.distanceTo(bot.entity.position) <= 128 &&
        e.username === master);
        renderChatBox(player.position)
        renderChatBox(util.inspect(isInBlock(player, 'web')))
        renderChatBox(isInBlock(player, 'web'))

    }
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
      renderChatBox(`${status.ok}Removed all allies`);
    break;
    /* RESTORE LOADOUT */
    case /^rep$/.test(data):
      restoreLoadout();
    break;
    /* TARGET PLAYER */
    case /^trg \S+$/.test(data): 
      targetPlayer = bot.players[command[1]];
      combatMode = 4;
      renderChatBox(`${status.ok}Targeting: ${targetPlayer.username}`);
    break;
    /* CHECK PLAYER */
    case /^pdb \S+$/.test(data): {
      const player = bot.players[command[1]];
      if (player) {
        renderChatBox(`${status.ok}Player found`);
        renderChatBox(util.inspect(player, true, null, true));
      } else {
        renderChatBox(`${status.warn}No entry of player found`);
      }
    }
    break;
    /* CHECK ITEM IN SLOT */
    case /^sdb \d+$/.test(data): {
      const item = bot.inventory.slots[command[1]];
      if (item) {
        renderChatBox(`${status.ok}Item found`);
        renderChatBox(util.inspect(item, true, null, true));
      } else {
        renderChatBox(`${status.warn}No entry of item in slot ${command[1]} found`);
      }
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
function waitForPlugin(bot) {
  return new Promise((resolve, reject) => {
    const checkInit = () => {
      if (bot.pvp && bot.pathfinder) {
        renderChatBox(`${status.ok}PvP and Pathfinder modules loaded`);
        resolve();
      } else {
        setTimeout(checkInit, 100);
      }
    };
    checkInit();
  });
}
async function handleCooldown(value, type) {
  if (typeof value !== 'number' || !Number.isInteger(value) || typeof type !== 'string') {
    throw new Error(`Invalid arguments: 'value' must be an integer and 'type' must be a string. Received value: ${typeof value}, type: ${typeof type}.`);
  }

  cooldown[type].time = value > 0 ? value : cooldown[type].time + 1;
  if (type != 'pvp' && type != 'hurt') renderChatBox(`${status[type]}${status.info}Cooldown for ${type} started, ${cooldown[type].time}s left`);
  cooldown[type].time = parseInt(cooldown[type].time, 10);
  if (!cooldown[type].lock) {
    cooldown[type].lock = true;
    while (cooldown[type].time > 0) {
      cooldown[type].time -= 0.25;
      await bot.waitForTicks(5);
    }
  }
  if (cooldown[type].time <= 0 && cooldown[type].lock === true){
    cooldown[type].time = 0;
    cooldown[type].lock = false;
    if (type != 'hurt') renderChatBox(`${status[type]}${status.info}Cooldown for ${type} ended, [TIME: ${cooldown[type].time} LOCK: ${cooldown[type].lock}]`);
  }
}
function getScoreBoardInfo(regex) {
  const dynamicKey = Object.keys(bot.scoreboards.JampireBoard.itemsMap).find(key => regex.test(key));
  const match = /[\d,]+/.exec(bot.scoreboards.JampireBoard.itemsMap[dynamicKey]?.name.toString());
  const value = match ? match[0].replace(/,/g, '') : null;
  return value;
}
/*
  FUNCTIONS: CALCULATIONS
*/
function isInCylinder([px, py, pz], { center: [cx, cy, cz], radius, height }) {
  const withinHeight = py >= cy && py <= cy + height;
  const withinRadius = (px - cx) ** 2 + (pz - cz) ** 2 <= radius ** 2;
  return withinHeight && withinRadius;
}
function getDeltaHealth() {
  if (oldHealth === 0) {
    oldHealth = (bot.health+bot.entity?.metadata[11]);
  } else if (oldHealth != 0) {
    newHealth = (bot.health+bot.entity?.metadata[11]);
    if ((oldHealth-newHealth) > 1) deltaHealth = oldHealth - newHealth;
    oldHealth = 0;
    newHealth = 0;
  }
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
  const g = 1.6, velocity = 10; // m/s
  const sineTheta = (g * distance) / (velocity ** 2);
  if (Math.abs(sineTheta) > 1) throw new Error(`${status.error}Distance too far for initial velocity.`);
  return distance * Math.sin(0.5 * Math.asin(sineTheta));
}
function getFeatherTrajectory(distance) {
  const g = 1.6, velocity = 35; // m/s
  const sineTheta = (g * distance) / (velocity ** 2);
  if (Math.abs(sineTheta) > 1) throw new Error(`${status.error}Distance too far for initial velocity.`);
  return distance * Math.sin(0.5 * Math.asin(sineTheta));
}
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
function getMidpointVec3(point1,point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
    z: (point1.z + point2.z) / 2
  };
}
function isInBlock(entity, block, hitboxHeight = 1.8, hitboxWidth = 0.3) {
  // Convert block to an array if it's not already
  const blocksToCheck = Array.isArray(block) ? block : [block];

  // Define the offsets for the corners of the entity's hitbox
  const cornerOffsets = [
    new Vec3(-hitboxWidth, 0, -hitboxWidth), // Bottom-left-front corner
    new Vec3(-hitboxWidth, 0, hitboxWidth),  // Bottom-left-back corner
    new Vec3(hitboxWidth, 0, -hitboxWidth),  // Bottom-right-front corner
    new Vec3(hitboxWidth, 0, hitboxWidth),   // Bottom-right-back corner
    new Vec3(-hitboxWidth, hitboxHeight, -hitboxWidth), // Top-left-front corner
    new Vec3(-hitboxWidth, hitboxHeight, hitboxWidth),  // Top-left-back corner
    new Vec3(hitboxWidth, hitboxHeight, -hitboxWidth),  // Top-right-front corner
    new Vec3(hitboxWidth, hitboxHeight, hitboxWidth)    // Top-right-back corner
  ];

  // Check the vertical faces (front, back, left, right) and corners
  for (let dy = 0; dy <= hitboxHeight; dy += 0.6) { // Check vertically
    // Front face (positive Z-axis)
    const frontBlock = bot.blockAt(entity.position.offset(0, dy, hitboxWidth));
    if (frontBlock && blocksToCheck.includes(frontBlock.name)) {
      return true; // Collision detected on front face
    }

    // Back face (negative Z-axis)
    const backBlock = bot.blockAt(entity.position.offset(0, dy, -hitboxWidth));
    if (backBlock && blocksToCheck.includes(backBlock.name)) {
      return true; // Collision detected on back face
    }

    // Left face (negative X-axis)
    const leftBlock = bot.blockAt(entity.position.offset(-hitboxWidth, dy, 0));
    if (leftBlock && blocksToCheck.includes(leftBlock.name)) {
      return true; // Collision detected on left face
    }

    // Right face (positive X-axis)
    const rightBlock = bot.blockAt(entity.position.offset(hitboxWidth, dy, 0));
    if (rightBlock && blocksToCheck.includes(rightBlock.name)) {
      return true; // Collision detected on right face
    }

    // Check corners of the entity's hitbox
    for (const offset of cornerOffsets) {
      const cornerPos = entity.position.offset(offset.x, offset.y, offset.z);
      const cornerBlock = bot.blockAt(cornerPos);
      if (cornerBlock && blocksToCheck.includes(cornerBlock.name)) {
        return true; // Collision detected on a corner
      }
    }
  }

  // No collision detected
  return false;
}
/*
2/2 for bot
3/1 for entity 
*/
let lastCallTime = 0; // Timestamp of the last function call
let cachedBlocks = []; // Cached result of the last function call

function blocksNear(entity, block, maxDistance = 2, count = 2) {
  const now = Date.now();

  // If the function was called within the last 500ms, return the cached result
  if (now - lastCallTime < 200) {
    return cachedBlocks;
  }

  // Update the last call time
  lastCallTime = now;

  // Find blocks near the entity
  const blocks = bot.findBlocks({
    point: entity?.position,
    matching: bot.registry.blocksByName[block]?.id,
    maxDistance,
    count,
  });

  // Adjust block positions (center them)
  const adjustBlockPosition = (block) => {
    if (block) {
      block.set(block.x + 0.5, block.y, block.z + 0.5);
    }
  };

  // Adjust positions for blocks
  blocks.forEach(adjustBlockPosition);

  // Cache the result
  cachedBlocks = blocks;

  return blocks;
}
/*
  FUNCTIONS: PHYSICS
*/
function resetVelocity() {
  if ((isOverLiquid || isTouchingLiquid) && !bot.pathfinder?.isMoving()) {
// rewrite
    bot.entity.velocity.set(0,-0.08,0);
  }
}
async function unstuck(path) {
  if ((path === 'stuck' || (!isOverLiquid && isTouchingLiquid)) && isHunting) {
    renderChatBox(`${status.warn}Bot stuck! ${!isOverLiquid ? 'bot got stuck inside water while moving' : path === 'stuck' ? 'bot got stuck some other way' : ''}`);
    isHunting = false;
    resetCombat();
    bot.clearControlStates();
    bot.entity.velocity.set(0,0,0);
    await bot.waitForTicks(10);
    isHunting = true;
  }
}
function jesusOnLiquid() {
  /* check if block below/at bot position is liquid */
  const roundedBotPosition = roundVec3(bot.entity.position);
  const liquidBelow = bot.blockAt(new Vec3(bot.entity.position.x, roundedBotPosition.y - 0.5, bot.entity.position.z));
  isOverLiquid = liquidBelow && (liquidBelow.name === 'water' || liquidBelow.name === 'lava');

  const liquidBoundary = bot.blockAt(bot.entity.position);
  if (bot.entity.isInWater || bot.entity.isInLava || liquidBoundary && (liquidBoundary.name === 'water' || liquidBoundary.name === 'lava')) {
    isTouchingLiquid = true;

    bot.entity.velocity.set(bot.entity.velocity.x,0.11,bot.entity.velocity.z);
    bot.setControlState('jump', false);
  } else {
    isTouchingLiquid = false;
  }
}
/*
  IF ent pos Y -1.5 and -0.5 air 
  if 2 air below 
*/
function strafe(position,angleDegrees,speed) {
  const [velocityX,velocityZ] = getStrafeVelocity(position,angleDegrees,speed);
  if (bot.entity.onGround && !isTouchingLiquid && !isOverLiquid) {
    bot.entity.velocity.set(velocityX,0.42,velocityZ);
    //bot.setControlState('forward', false);
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
function rateBoolValue(currentBool, isReverse) {
  const statusType = isReverse ? (currentBool ? "bad" : "good") : (currentBool ? "good" : "bad");
  return `${status[statusType]}${currentBool}{/}`;
}
function rateIntValue(currentInt, maxInt, pctCurve, isReverse) {
  const [pctBoundaryOne, pctBoundaryTwo] = pctCurve || [66.66, 33.33];
  const percentage = (parseInt(currentInt, 10) / parseInt(maxInt, 10)) * 100;
  const roundedCurrent = Math.round(currentInt * 100) / 100;
  const statusType = isReverse ? 
    (percentage > pctBoundaryOne ? "bad" : percentage > pctBoundaryTwo ? "mediocre" : "good"):
    (percentage > pctBoundaryOne ? "good" : percentage > pctBoundaryTwo ? "mediocre" : "bad");
  return `${status[statusType]}${roundedCurrent}{/}`;
}
function formatCell(cell, index, type, columnWidths) {
  if (type === 'players') {
    switch (true) {
      case allies.includes(cell):
          return `{green-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case bot.players[cell]?.gamemode === 1:
          return `{cyan-fg}${cell.padEnd(columnWidths[index])}{/}`;
      case !isNaN(cell):
          return `{green-fg}${rateIntValue(cell.padEnd(columnWidths[index]), 200, null, true)}{/}`;
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
  } else {
    throw new Error(`${status.error}No itemId found to equip`);
  }
}
async function tossItem (itemId, amount) {
  const t0 = performance.now();
  amount = parseInt(amount, 10);
  itemId = parseInt(itemId, 10);
  if (itemId) {
    try {
      if (amount) {
        await bot.toss(itemId, null, amount);
        const t1 = performance.now();
        renderChatBox(`${status.ok}Tossed ${amount} x ${itemId} in ${(t1 - t0).toFixed(2)}ms`);
      } else {
        await bot.tossStack(itemId);
        const t1 = performance.now();
        renderChatBox(`${status.ok}Tossed stack of ${itemId} in ${(t1 - t0).toFixed(2)}ms`);
      }
    } catch (err) {
      renderError(err);
    }
  } else {
    throw new Error(`${status.error}No itemId found to toss`);
  }
}
async function tossAllItems() {
  const start = performance.now();
  const output = bot.inventory.items().filter(item => item).map(item => item.type);

  for (const id of output) {
    const item = bot.inventory.findInventoryItem(id, null);
    await bot.waitForTicks(2);
    await tossItem(item.type, item.count);
  }
  const end = performance.now();
  renderChatBox(`${status.ok}Done in ${(end - start).toFixed(2)}ms`);
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
  FUNCTIONS: MISC
*/
async function resetCombat() {
  bot.pvp.forceStop();
  bot.pathfinder.setGoal(null);
  await bot.waitForTicks(3);
  renderChatBox(`${status.ok}Reset completed`);
}
async function pray() {
  const prayers = [
    "Благодарим тебя за то что раскрыл слугам твоим козни врагов наших,",
    "озари сиянием твоим души тех кто отдал жизнь во исполнения воли твоей.",
    "В бой защитники монолита, в бой.",
    "Отомстим за павших братьев наших, да будет благославенно вечное их единение с монолитом",
    "смерть, лютая смерть тем кто отвергает его священную силу."
  ];
  for (const prayer of prayers) {
    await bot.waitForTicks(80);
    renderChatBox(`${status.debug}${prayer}`);
    if (!isSilent) bot.chat(prayer);
  }
}
/*
  FUNCTIONS: COMBAT INVENTORY/SLOT MANAGEMENT
*/
async function equipArmor() {
  if (lockValue['armor']) return;
  lockValue['armor'] = true;
  const armorPieces = [
    { destination: 'head', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_helmet.id, null), minEnch: 8 },
    { destination: 'torso', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_chestplate.id, null), minEnch: 6 },
    { destination: 'legs', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_leggings.id, null), minEnch: 6 },
    { destination: 'feet', item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_boots.id, null), minEnch: 9 }
  ];
  for (const piece of armorPieces) {
    if (piece.item?.nbt && piece.item && piece.item.enchants.length >= piece.minEnch) {
      const equipSlot = bot.getEquipmentDestSlot(piece.destination);
      if (bot.inventory.slots[equipSlot] === null || bot.inventory.slots[equipSlot].type != piece.item.type) {
        lockValue['hand'] = true;
        lockValue['off-hand']  = true;
        await equipItem(piece.item.type, piece.destination);
        lockValue['hand'] = false;
        lockValue['off-hand']  = false;
      }
    }
  }
  lockValue['armor'] = false;
}
async function equipGapple() {
  if (lockValue['gapple']) return;
  lockValue['gapple'] = true;

  const totalHealth = bot.health + (bot.entity.metadata[11] || 0);
  const canHeal = totalHealth <= 20 && bot.pvp.target || totalHealth <= 19.9;
  const isAboveMinHealth = totalHealth > options.healthOffset + deltaHealth || !cooldown['hurt'].lock;
  const hasTotem = getItemCount('totem_of_undying') >= 1;
  const gapple = bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id) || bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')];

  if (canHeal && (isAboveMinHealth && hasTotem || !hasTotem) && (gapple && gapple?.type === bot.registry.itemsByName.golden_apple.id)) {
    isHealing = true;
    lockValue['off-hand'] = true;

    const start = performance.now();
    const oldCount = getItemCount('golden_apple');
    renderChatBox(`${status.gapple}${status.info}STARTED Healing function exp: ${!cooldown['hurt'].lock && getItemCount('totem_of_undying') >= 1}`);

    while (true) {
      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type === gapple.type) {
        bot.activateItem(true);
        await bot.waitForTicks(35);
        bot.deactivateItem();
        break;
      } else {
        await equipItem(gapple.type, 'off-hand');
      }
    }

    const newCount = getItemCount('golden_apple');
    const end = performance.now();

    handleCooldown(options.itemCooldown, 'gapple');

    const gappleStatus = newCount < oldCount || bot.entity.effects['10'] ? `${status.ok}Gapple SUCCESS` : `${status.error}Gapple FAILED`;
    renderChatBox(`${status.gapple}${gappleStatus} done in ${end - start}ms`);
    
    isHealing = false;
    lockValue['off-hand'] = false;
  }
  lockValue['gapple'] = false;
}
async function equipBuff() {
  if (lockValue['buff']) return;
  lockValue['buff'] = true;
  
  const health = bot.health + bot.entity?.metadata[11];
  const canBuff = health >= 19 || (health > 10 && cooldown['gapple'].time >= 5);
  const buff = bot.inventory.findInventoryItem(bot.registry.itemsByName.potion.id, null);
 
  if (canBuff && buff?.nbt && bot.pvp.target && nbt.simplify(buff.nbt).Potion === 'minecraft:strong_strength' && !bot.entity.effects['5']) {
    lockValue['off-hand'] = true;

    const start = performance.now();
    const oldCount = getItemCount('potion');
    renderChatBox(`${status.buff}${status.info}Buff STARTED`);

    while (true) {
      if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type === buff.type) {
        bot.activateItem(true);
        await bot.waitForTicks(35);
        bot.deactivateItem();
        break;
      } else {
        await equipItem(buff.type, 'off-hand');
      }
    }

    const newCount = getItemCount('potion');
    const end = performance.now();

    handleCooldown(options.itemCooldown, 'buff');

    const buffStatus = newCount < oldCount || bot.entity.effects['5'] ? `${status.ok}Buff SUCCESS` : `${status.error}Buff FAILED`;
    renderChatBox(`${status.buff}${buffStatus} done in ${end - start}ms`);

    lockValue['off-hand'] = false;
  }
  lockValue['buff'] = false;
}
async function equipTotem() {
  if (lockValue['totem']) return;
  lockValue['totem'] = true;

  const totalHealth = (bot.health + bot.entity?.metadata[11]);
  const canEquip = (totalHealth <= options.healthOffset+deltaHealth || getItemCount('golden_apple') === 0);
  const totem = bot.inventory.findInventoryItem(bot.registry.itemsByName.totem_of_undying.id, null);

  if (totem && bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type != totem.type && canEquip) {
    lockValue['off-hand'] = true;
    await equipItem(totem.type, 'off-hand');
    lockValue['off-hand'] = false;
  }

  lockValue['totem'] = false;
}
async function tossPearl() {
  if (lockValue['pearl']) return;
  lockValue['pearl'] = true;

  const entity = bot.nearestEntity(e => e.type === 'player' && e.username === bot.pvp.target?.username && e.position.distanceTo(bot.entity.position) >= 10);
  const pearl = bot.inventory.findInventoryItem(bot.registry.itemsByName.ender_pearl.id, null);

  if (!pearl || !entity || cooldown['pearl'].time > 0) {
    lockValue['pearl'] = false;
    return;
  }

  if (bot.entityAtCursor(3.5)) {
    renderChatBox(`${status.pearl}${status.warn}There is an entity blocking the pearl path!`)
    lockValue['pearl'] = false;
    return;
  }

  lockValue['off-hand'] = true;
  isHunting = false;
  bot.pvp.forceStop();

  const start = performance.now();
  const angleInBlocks = getPearlTrajectory(entity.position.distanceTo(bot.entity.position));
  const oldCount = getItemCount('ender_pearl');

  renderChatBox(`${status.pearl}${status.ok}Pearl STARTED`);

  while (true) {
    if (bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')]?.type === pearl.type) {
      try {
        bot.pvp.forceStop();

        await bot.lookAt(entity.position.offset(0,angleInBlocks+entity.height/2,0), true);
        await bot.waitForTicks(5);
        
        bot.activateItem(true);
        await bot.waitForTicks(2);
        bot.deactivateItem();
        
        break;
      } catch (err) {
        renderError(err)
      }
    } else {
      await equipItem(pearl.type, 'off-hand');
    }
  }

  const newCount = getItemCount('ender_pearl');
  const end = performance.now();

  handleCooldown(options.itemCooldown, 'pearl');

  const tossStatus = newCount < oldCount ? `${status.ok}Pearl SUCCESS` : `${status.error}Pearl FAILED`;
  renderChatBox(`${status.pearl}${tossStatus} done in ${end - start}ms`);

  isHunting = true;
  lockValue['off-hand'] = false;
  lockValue['pearl'] = false;
}
async function equipPassive() {
  if (lockValue['passive']) return;
  lockValue['passive'] = true;

  const itemPieces = [
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.golden_apple.id, null), slot: 'off-hand', slotCheck: bot.inventory.slots[bot.getEquipmentDestSlot('off-hand')], slotUsed: 'off-hand' },
    { item: bot.inventory.findInventoryItem(bot.registry.itemsByName.diamond_sword.id, null), slot: 'hand', slotCheck: bot.heldItem, slotUsed: 'hand' }
  ]
  for(const piece of itemPieces) {
    if (piece.item && piece.slotCheck?.type != piece.item.type && !lockValue[piece.slotUsed]) {
      if (piece.slotUsed === 'off-hand' || piece.item.enchants.length >= 8) {
        lockValue[piece.slotUsed] = true;
        renderChatBox(`${status.passive}${piece.item.displayName} START`);
        await equipItem(piece.item.type, piece.slot);
        renderChatBox(`${status.passive}${piece.item.displayName} END`);
        lockValue[piece.slotUsed] = false;
      }
    }
  }
  lockValue['passive'] = false;
}
async function tossJunk() {
  if (lockValue['junk'] || lockValue['off-hand'] || lockValue['hand']) return;
  lockValue['junk'] = true;

  const junkArray = [
    bot.inventory.findInventoryItem(bot.registry.itemsByName.compass.id, null), 
    bot.inventory.findInventoryItem(bot.registry.itemsByName.knowledge_book.id, null),
    bot.inventory.findInventoryItem(bot.registry.itemsByName.glass_bottle.id, null)
  ];
  for (const item of junkArray) {
    if (item) {
      lockValue['hand'] = true;
      lockValue['off-hand'] = true;
      await bot.waitForTicks(3);
      await tossItem(item.type, item.count);
      lockValue['hand'] = false;
      lockValue['off-hand'] = false;
    }
  }
  lockValue['junk'] = false;
}
/*
  FUNCTIONS: RESTORE LOADOUT
*/
async function restoreLoadout() {
  const data = fs.readFileSync('./inventory-nbt.conf', 'utf8');
  const lines = data.split('\n');

  if (cooldown['pvp'].time > 0 || !isWindowLocked) throw new Error(`${status.error}Exit combat/login before restoring! isWindowlocked: ${isWindowLocked}`);

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
        try {
          await bot.waitForTicks(3);
          bot.creative.setInventorySlot(slot, new Item(itemType, result.count, result.metadata, itemNbt));
        } catch (err) {
          renderError(err)
        }
        lockValue['hand'] = false;
        lockValue['off-hand'] = false;
      }
    }
  }
  while (true) {
    if (bot.player.gamemode === 0) {
      renderChatBox(`${status.info}Gamemode is set to ${bot.player.gamemode}`);
      break;
    } else {
      bot.chat('/gm 0');
    }
    await bot.waitForTicks(5);
  }
  isAutoEquipping = true;
}
/*
  FUNCTIONS: TARGETING
*/
function filterEntity() {
  switch (combatMode) {
    case 0:
      return e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) <= 128 && e.kind === 'Hostile mobs';
    case 1:
      return e => e.type === 'player' && e.position.distanceTo(bot.entity.position) <= 128 && bot.players[e.username]?.gamemode === 0 && !allies.includes(e.username);
    case 2:
      return e => e.type === 'player' &&
                  (isInCylinder([e.position.x, e.position.y, e.position.z], cylinder1) || 
                   isInCylinder([e.position.x, e.position.y, e.position.z], cylinder2)) &&
                  e.position.distanceTo(bot.entity.position) < 128 &&
                  bot.players[e.username]?.gamemode === 0 && 
                  !allies.includes(e.username);
    case 3:
      return e => e.type === 'player' && 
                  e.position.distanceTo(bot.entity.position) <= 128 &&
                  e.username === master;
    case 4:
      return e => e.type === 'player' &&
                  e.position.distanceTo(bot.entity.position) <= 128 &&
                  e.username === targetPlayer.username;
    default:
      return null;
  }
}
class CombatHandler {
  constructor(bot) {
    this.bot = bot;
    this.filterEntity = filterEntity;
    this.strafe = strafe;
    this.entity = null;
  }

  updateEntity() {
    this.entity = this.bot.nearestEntity(this.filterEntity());

    if (!this.entity) {
      this.bot.pvp.forceStop();
    }
  }

  combatMovement() {
    if (!this.entity) return;

    if (this.isOverLiquid && !this.bot.pathfinder?.isMoving()) {
      this.bot.setControlState('forward', true);
    }

    if (this.bot.entity.isInWeb) {
      this.bot.setControlState('jump', false);
    }

    this.strafeMovement(this.entity);
  }

  combatTargeting() {
    if (!this.entity) return;

    if (this.entity.position.distanceTo(this.bot.entity.position) <= this.bot.pvp.attackRange && !this.bot.pathfinder?.isMoving()) {
      this.bot.lookAt(this.entity.position.offset(0, this.entity.eyeHeight, 0), true);
    }
  }

  combatAttacking() {
    if (!this.entity) return;
    this.bot.pvp.attack(this.entity);
  }

  // Main combat loop
  combatLoop() {
    this.updateEntity(); // Update the entity
    this.combatMovement(); // Handle movement
    this.combatTargeting(); // Handle targeting
    this.combatAttacking(); // Handle attacking
  }

  // Helper function for strafing movement
  strafeMovement() {
    if (!this.entity) return;
    // 1.5 strafe speed 0.6 distance max 
    /* Get blocks near entities */
    this.entityBlock = blocksNear(this.entity, 'web', 3, 1);
    this.botBlock = blocksNear(this.bot.entity, 'web', 2, 2);
//    renderChatBox(`${status.debug}${this.entityBlock}`)
    this.entityPos = [this.entity.position.x, this.entity.position.z];
    
    this.entityCloseToBlock = this.entityBlock[0] && this.entityBlock[0].distanceTo(this.entity.position) <= 1.5;
    this.botCloseToBlock = this.botBlock[0] && this.botBlock[0].distanceTo(this.bot.entity.position) <= 1.2;
  
    this.bot.pvp.followRange = (this.entityCloseToBlock || this.botCloseToBlock || this.preventFall(this.entity)) || this.bot.entity.isInWeb ? 1 : 5;

    if (!this.isOverLiquid && this.bot.entity.onGround && this.bot.entity.position.distanceTo(this.entity.position) <= this.bot.pvp.followRange && this.bot.pvp.followRange === 5) {
      if (!this.entityBlock[0]) {
        strafe(this.entityPos, 30, 0.6);
      } else {
        this.entityDistToBlock = this.entityBlock[0].distanceTo(this.entity.position);
        this.strafeSpeed = this.entityDistToBlock >= 3.5 ? 0.6 : this.entityDistToBlock > 1.5 ? 0.4 : null;
        if (this.strafeSpeed) {
          strafe(this.entityPos, 30, this.strafeSpeed);
        }
      }
    }
  }

  // Helper function to prevent falling
  preventFall(e) {
    const b = this.bot.findBlocks({
      point: e.position.offset(0, -1.5, 0),
      matching: this.bot.registry.blocksByName.air.id,
      maxDistance: 0,
      count: 2,
    });

    return (b[0].y < e.position.y && b[1].y < e.position.y && b[0].y < b[1].y && b[0].x === b[1].x && b[0].z === b[1].z);
  }
}
/* TODO notes
if in x seconds delta position less than 1-2 blocks: reset velocity (hack fix using fixed timer for now)
check y diff between bot and target, if distance is more than attack range: pearl
*/
/*
  SCHEDULER
  Runs sequentialy
*/
class TaskScheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false; // Flag to prevent overlapping runs
  }

  addTask(task) {
    this.tasks.push(task);
    this.tasks.sort((a, b) => b.priority - a.priority); // Sort by priority
  }

  async run() {
    if (this.isRunning) return; // Prevent overlapping runs
    this.isRunning = true;

    const now = Date.now();
    for (const task of this.tasks) {
      if (task.interval && now - task.lastRun < task.interval) continue;

      if (task.dependencies) {
        const dependenciesMet = task.dependencies.every(dep => this.tasks.find(t => t.id === dep)?.completed);
        if (!dependenciesMet) continue;
      }

      if (task.condition()) {
        try {
          // Run the task and wait for it to complete
          await runWithTimeout(() => runWithRetries(task.action, task.retries), task.timeout);
          task.completed = true;
          task.lastRun = Date.now();
        } catch (err) {
          renderError(`Task ${task.id} failed: ${err}`);
        }
      }
    }

    this.isRunning = false; // Reset the flag after all tasks are processed
  }
}

async function runWithTimeout(action, timeout = 1000) {
  return Promise.race([
    action(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout')), timeout)),
  ]);
}

async function runWithRetries(action, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await action();
    } catch (err) {
      renderError(`Attempt ${i + 1} failed: ${err}`);
    }
  }
  throw new Error('Task failed after retries');
}
// Initialize and use the scheduler
const scheduler = new TaskScheduler();
const combatHandler = new CombatHandler(bot);

/* Velocity checks and unstucks */
setInterval( async () => {
  if (!isWindowLocked || !isAutoEquipping) return;
  resetVelocity();
  //updateWebBlocks();
  await unstuck();
}, 2000);

/* Main loop */
setInterval(async () => {
  if (!isWindowLocked || !isAutoEquipping) return;
  jesusOnLiquid();
  await scheduler.run();
  combatHandler.combatLoop();
}, 50);
/*
  TASKS
  1: HIGH
  2: MID
  3: LOW

  todo:
  rewrite 'cooldown' values to ratelimit using .now() instead of await bot.waitForTicks
*/
// REMOVE LOCKVALUES, scheduler fixed
scheduler.addTask({
  id: 'equipArmor',
  condition: () => !lockValue['armor'],
  action: equipArmor,
  priority: 1,
});
scheduler.addTask({
  id: 'equipTotem',
  condition: () => !isHealing && !lockValue['off-hand'] && !lockValue['totem'],
  action: equipTotem,
  priority: 1,
});
scheduler.addTask({
  id: 'equipGapple',
  condition: () => !lockValue['gapple'] && cooldown['gapple'].time === 0 && !cooldown['gapple'].lock,
  action: equipGapple,
  priority: 2,
  timeout: 1750,
});
scheduler.addTask({
  id: 'equipBuff',
  condition: () => !isHealing && !lockValue['off-hand'] && !lockValue['buff'] && cooldown['buff'].time === 0 && !cooldown['buff'].lock,
  action: equipBuff,
  priority: 2,
  timeout: 1750,
});
scheduler.addTask({
  id: 'tossPearl',
  condition: () => !isHealing && !lockValue['off-hand'] && !lockValue['pearl'] && cooldown['pearl'].time === 0 && !cooldown['pearl'].lock,
  action: tossPearl,
  priority: 2,
});
scheduler.addTask({
  id: 'equipPassive',
  condition: () => !isHealing && !lockValue['hand'] && !lockValue['off-hand'] && (bot.health + (bot.entity?.metadata[11] || 0)) > options.healthOffset + deltaHealth && !lockValue['passive'],
  action: equipPassive,
  priority: 3,
});
scheduler.addTask({
  id: 'tossJunk',
  condition: () => !isHealing && !lockValue['hand'] && !lockValue['off-hand'] && (bot.health + (bot.entity?.metadata[11] || 0)) > options.healthOffset + deltaHealth && !lockValue['junk'] && cooldown['pvp'].time === 0,
  action: tossJunk,
  priority: 4,
});

setInterval(() => {
  if (!isWindowLocked) return;
  const helmetPct = (((363 - bot.inventory.slots[5]?.durabilityUsed) / 363) * 100);
  const chestplatePct = (((528 - bot.inventory.slots[6]?.durabilityUsed) / 528) * 100);
  const leggingsPct = (((495 - bot.inventory.slots[7]?.durabilityUsed) / 495) * 100);
  const bootsPct = (((429 - bot.inventory.slots[8]?.durabilityUsed) / 429) * 100);
  const totalBotHealth = bot.health+bot.entity?.metadata[11] || 0;
  const totalTargetHealth = bot.pvp.target?.metadata[7]+bot.pvp.target?.metadata[11] || 0;
  const distTo = bot.pvp.target?.position.distanceTo(bot.entity.position) || 0;

  const banner =
  `BOT ${bot.username} ${rateIntValue(totalBotHealth, 36, [55,30])} MODE ${combatMode} ` +
  `DHealth ${rateIntValue(deltaHealth, 5)} ` +
  `TARGET ${bot.pvp.target?.username || '----'} ${rateIntValue(totalTargetHealth, 36, [55,30], true)} ` +
  `DistTo ${rateIntValue(distTo, 20, [50,25], true)} DHeight ${rateIntValue(bot.pvp.target?.position.y-bot.entity.position.y || 0, 10, [50,25], true)}\n` +
  // INVENTORY
  `PEARL ${rateIntValue(getItemCount('ender_pearl'), 32)} BUFF ${rateIntValue(getItemCount('potion'), 5)} TOTEM ${rateIntValue(getItemCount('totem_of_undying'), 8)} GAPPLE ${rateIntValue(getItemCount('golden_apple'), 64)} ` + 
  `ARMOR ${[5, 6, 7, 8].map(i => rateIntValue(getItemCount(`diamond_${['helmet', 'chestplate', 'leggings', 'boots'][i - 5]}`), 6)).join('|')} ARMOR% ${[helmetPct, chestplatePct, leggingsPct, bootsPct].map(rateIntValue).join('|')}\n` +
  // COMBAT INDICATORS
  `PVP ${rateIntValue(cooldown['pvp']?.time, 14, [50,0], true)} HURT ${rateIntValue(cooldown['hurt']?.time, 3, [50,0], true)} BUFF ${rateIntValue(cooldown['buff']?.time, 14, [50,0], true)} GAPPLE ${rateIntValue(cooldown['gapple']?.time, 14, [50,0], true)} PEARL ${rateIntValue(cooldown['pearl']?.time, 14, [50,0], true)} ` +
  `HAND ${rateBoolValue(lockValue['hand'], true)} OFF-HAND ${rateBoolValue(lockValue['off-hand'], true)}\n` +
  `HSR ${rateIntValue((pvpHitSuccess/pvpHitAttempts) || 0, 1)} `
  renderFunctionBox(banner);
}, 500);
/*
  CLIENT RELATED EVENT HANDLERS
*/
function startClient() {
  isWindowLocked = false;
  const start = performance.now();
  if (!bot) bot = mineflayer.createBot(config);

  bot.on('inject_allowed', async () => {
    bot.setMaxListeners(10);
  
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    bloodhoundPlugin(bot);

    await waitForPlugin(bot);

    bot.bloodhound.yaw_correlation_enabled = true;

    bot.pvp.movements.infiniteLiquidDropdownDistance = true;
    bot.pvp.movements.allowEntityDetection = true;
    bot.pvp.movements.allowFreeMotion = true;
    bot.pvp.movements.allowParkour = true;
    bot.pvp.movements.maxDropDown = 256;
  
    bot.pvp.movements.allow1by1towers = false;
    bot.pvp.movements.canOpenDoors = false;
    bot.pvp.movements.canDig = false;
  
    bot.pvp.movements.scafoldingBlocks = [null];
  
    bot.pvp.attackRange = 4;
    bot.pvp.followRange = 1;
  
    bot.pvp.viewDistance = 128;
  });
  // scheduler written, line useless
  //bot.on('physicsTick', async () => await functionLoop());
  bot.on('messagestr', (data) => logAbnormalities(data));
  bot.on('message', (data) => chatCommands(data)); 
  bot.on('error', (err) => renderError(err));
  /* LOGIN ONLY */
  bot.on('windowOpen', async (window) => {
    if (isWindowLocked || isWindowClickLocked) return;
    isWindowClickLocked = true;
    const slot = 0;
    await bot.waitForTicks(2);
    await bot.clickWindow(slot,0,0); // 1
    renderChatBox(`${status.info}Clicking slot ${slot} ${window.slots[slot]}`);
    await window.close();
    isWindowClickLocked = false;
  });

  bot.on('path_reset', async (path) => await unstuck(path));
  bot.on('scoreRemoved', () => {
    if (!isWindowLocked || !bot.players[master]) return;

    if (!cooldown['pvp'].lock && getScoreBoardInfo(/^\s*.*Денег:.*\$$/) > 0) {
      bot.chat(`/pay ${master} ${getScoreBoardInfo(/^\s*.*Денег:.*\$$/)}`);
    }
  });
  /* HIT DETECTION */
  bot.on('attackedTarget', () => pvpHitAttempts++);
  /*bot.on('entityHurt', (entity) => {
    entity.username === bot.pvp.target?.username && pvpHitSuccess++;
    if (entity.username === bot.username) {
      handleCooldown(3, 'hurt');
      getDeltaHealth();
    }
  });
  bot.on('death', async() => {
    resetCombat();
    renderChatBox(`${status.warn}Died. Waiting ${Math.ceil((cooldown['pvp'].time) * 20)} ticks`);
    setTimeout( async () => {
      await restoreLoadout();
      const zoneCoordinates = [
        [2217.5, 1005.5],
        [2164.5, 1008.5],
        [2190.5, 1036.5],
        [2195.5, 968.5]
      ];
      const zoneArray = ['',2,3,4];
      const zone = Math.floor(Math.random() * zoneArray.length);
      bot.chat(`/warp play${zoneArray[zone]}`);
      await bot.waitForTicks(60);
    }, cooldown['pvp'].time*1000);
  });*/
  bot.on('kicked', (reason) => {
    renderChatBox(`${status.error}Kicked: ${reason}`);
    if (reason.includes('Пожалуйста, попробуйте присоединиться чуть позже.')) {
      renderChatBox(`${status.debug}Waiting extra 10min for IP block removal`);
      reconnectDelay += 600000;
    }
  });
  bot.on('end', (reason) => {
    for (const event of Object.keys(bot._events)) {
      bot.removeAllListeners(event);
      renderChatBox(`${status.info}Removed listeners for ${event}`);
    }
    renderChatBox(`${status.error}End: ${reason}`);
    renderChatBox(`${status.info}Reconnecting in ${reconnectDelay}ms`);

    setTimeout(() => {
      startClient();
    }, reconnectDelay);
    reconnectDelay += 5000;
  });
  const end = performance.now();
  renderChatBox(`${status.ok}All event handlers initialized in ${(end - start)}ms`);
}
/*
  NON CLIENT RELATED EVENT HANDLERS
*/
process.on('uncaughtException', (err) => renderError(err));
process.on('warning', (err) => renderError(err));

screen.key(['C-z'], () => logBox.focus());
screen.key(['C-x'], () => chatBox.focus());
screen.key(['C-r'], () => {
  bot.end();
  process.exit(0);
});
screen.key(['return', 'enter'], () => {
  inputBox.submit();
  inputBox.focus();
});
screen.key(['escape'], () => {
  bot.end();
  process.exit(1);
});

inputBox.on('submit', (data) => cliCommands(data));
inputBox.key(['tab'], () => getTabComplete());

startClient();