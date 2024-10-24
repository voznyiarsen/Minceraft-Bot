"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PVP = void 0;
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const TimingSolver_1 = require("./TimingSolver");
const mineflayer_utils_1 = require("mineflayer-utils");
/**
 * The main pvp manager plugin class.
 */
class PVP {
    /**
     * Creates a new instance of the PVP plugin.
     *
     * @param bot - The bot this plugin is being attached to.
     */
    constructor(bot) {
        this.timeToNextAttack = 0;
        this.wasInRange = false;
        this.blockingExplosion = false;
        /**
         * How close the bot will attempt to get to the target when when pursuing it.
         */
        this.followRange = 2;
        /**
         * How far away the target entity must be to lose the target. Target entities further than this
         * distance from the bot will be considered defeated.
         */
        this.viewDistance = 128;
        /**
         * How close must the bot be to the target in order to try attacking it.
         */
        this.attackRange = 3.5;
        /**
         * The timing solver to use when deciding how long to wait before preforming another attack
         * after finishing an attack.
         *
         * // TODO Check for 'hasAtttackCooldown' feature. If feature not present, default to RandomTicks solver.
         */
        this.meleeAttackRate = new TimingSolver_1.MaxDamageOffset();
        this.bot = bot;
        this.movements = new mineflayer_pathfinder_1.Movements(bot, require('minecraft-data')(bot.version));
        this.bot.on('physicTick', () => this.update());
        this.bot.on('entityGone', e => { if (e === this.target)
            this.stop(); });
    }
    /**
     * Causes the bot to begin attacking an entity until it is killed or told to stop.
     *
     * @param target - The target to attack.
     */
    attack(target) {
        return __awaiter(this, void 0, void 0, function* () {
            if (target === this.target)
                return;
            yield this.stop();
            this.target = target;
            this.timeToNextAttack = 0;
            if (!this.target)
                return;
            const pathfinder = this.bot.pathfinder;
            if (this.movements)
                pathfinder.setMovements(this.movements);
            pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalFollow(this.target, this.followRange), true);
            // @ts-expect-error
            this.bot.emit('startedAttacking');
        });
    }
    /**
     * Stops attacking the current entity.
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.target == null)
                return;
            this.target = undefined;
            const pathfinder = this.bot.pathfinder;
            pathfinder.stop();
            try {
                yield this.onceWithTimeout('path_stop', 5000);
            }
            catch (err) {
                this.bot.removeAllListeners('path_stop');
                pathfinder.setGoal(null);
            }
            // @ts-expect-error
            this.bot.emit('stoppedAttacking');
        });
    }
    /**
     * Resolve if event fires within the timeout. Rejects if the event did not fire within the timeout.
     * @param eventName Event name to listen to
     * @param timeout Timeout in ms
     * @returns {Promise<void>}
     */
    onceWithTimeout(eventName, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            let callback = () => { };
            let timeoutId;
            const cleanup = () => {
                clearTimeout(timeoutId);
                this.bot.removeListener(eventName, callback);
            };
            return new Promise((resolve, reject) => {
                callback = () => {
                    cleanup();
                    resolve();
                };
                this.bot.once(eventName, callback);
                timeoutId = setTimeout(() => {
                    cleanup();
                    reject();
                }, timeout);
            });
        });
    }
    /**
     * Stops attacking the current entity. Force stops pathfinder. May result in the bot falling off of things or failing jumps.
     * @returns void
     */
    forceStop() {
        if (this.target == null)
            return;
        this.target = undefined;
        const pathfinder = this.bot.pathfinder;
        pathfinder.setGoal(null);
        // @ts-expect-error
        this.bot.emit('stoppedAttacking');
    }
    /**
     * Called each tick to update attack timers.
     */
    update() {
        this.checkExplosion();
        this.checkRange();
        if (!this.target || this.blockingExplosion)
            return;
        this.timeToNextAttack--;
        if (this.timeToNextAttack === -1)
            this.attemptAttack();
    }
    /**
     * Updates whether the bot is in attack range of the target or not.
     */
    checkRange() {
        if (!this.target)
            return;
        if (this.timeToNextAttack < 0)
            return;
        const dist = this.target.position.distanceTo(this.bot.entity.position);
        if (dist > this.viewDistance) {
            this.stop();
            return;
        }
        const inRange = dist <= this.attackRange;
        if (!this.wasInRange && inRange)
            this.timeToNextAttack = 0;
        this.wasInRange = inRange;
    }
    /**
     * Blocks a creeper explosion with a shield.
     */
    checkExplosion() {
        if (!this.target || !this.hasShield())
            return;
        if (this.target.name &&
            this.target.name === 'creeper' &&
            this.target.metadata[16] &&
            // @ts-ignore
            this.target.metadata[16] === 1) {
            this.blockingExplosion = true;
            this.bot.pathfinder.stop();
            this.bot.lookAt(this.target.position.offset(0, 1, 0), true);
            this.bot.activateItem(true);
            setTimeout(() => {
                this.blockingExplosion = false;
            }, 2000);
        }
    }
    /**
     * Attempts to preform an attack on the target.
     */
    attemptAttack() {
        if (!this.target)
            return;
        if (!this.wasInRange) {
            this.timeToNextAttack = this.meleeAttackRate.getTicks(this.bot);
            return;
        }
        const queue = new mineflayer_utils_1.TaskQueue();
        const target = this.target;
        const shield = this.hasShield();
        if (shield) {
            queue.addSync(() => this.bot.deactivateItem());
            queue.add(cb => setTimeout(cb, 100));
        }
        // Poor man's .diff file
        /* MODIFIED - COMMENTED OUT voznyiarsen
        queue.add(cb => {
            if (target !== this.target)
                throw 'Target changed!';
            this.bot.lookAt(this.target.position.offset(0, this.target.height, 0), true).then(() => cb()).catch(err => cb(err));
        });
        // MODIFIED - ASYNC */
        queue.addSync(async () => {
            if (target !== this.target)
                throw 'Target changed!';
            // MODIFIED - LOGIC
            if (!this.target) return;
            if (this.bot.entity.onGround) {
                setTimeout(() => {
                    this.bot.entity.velocity.y = 0.11;
                }, 0);
                await this.bot.waitForTicks(3);
            }

            this.bot.attack(this.target);
            // @ts-expect-error
            this.bot.emit('attackedTarget');
        });
        if (shield) {
            queue.add(cb => setTimeout(cb, 150));
            queue.addSync(() => {
                if (target !== this.target)
                    throw 'Target changed!';
                if (this.hasShield())
                    this.bot.activateItem(true);
            });
        }
        queue.runAll((err) => {
            if (!err)
                this.timeToNextAttack = this.meleeAttackRate.getTicks(this.bot);
        });
    }
    /**
     * Check if the bot currently has a shield equipped.
     */
    hasShield() {
        if (this.bot.supportFeature('doesntHaveOffHandSlot'))
            return false;
        const slot = this.bot.inventory.slots[this.bot.getEquipmentDestSlot('off-hand')];
        if (!slot)
            return false;
        return slot.name.includes('shield');
    }
}
exports.PVP = PVP;
