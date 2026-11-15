/**
 * NeedsSystem — hunger, thirst, energy, health, hygiene.
 *
 * Values are 0..100. Needs decay over real time and affect the player when
 * they reach critical levels. Sleeping, eating and drinking restore them.
 */

const DECAY_PER_MINUTE = {
  hunger: 0.5,
  thirst: 0.8,
  energy: 0.35,
  hygiene: 0.2,
};

export class NeedsSystem {
  constructor({ timeSystem } = {}) {
    this.timeSystem = timeSystem;
    this.hunger = 80;
    this.thirst = 80;
    this.energy = 100;
    this.health = 100;
    this.hygiene = 80;

    this.lastTickTime = timeSystem ? timeSystem.time : 0;
  }

  setTimeSystem(timeSystem) {
    this.timeSystem = timeSystem;
  }

  tick(deltaMinutes) {
    if (!this.timeSystem) return;

    // Decay each need.
    this.hunger = Math.max(0, this.hunger - DECAY_PER_MINUTE.hunger * deltaMinutes);
    this.thirst = Math.max(0, this.thirst - DECAY_PER_MINUTE.thirst * deltaMinutes);
    this.energy = Math.max(0, this.energy - DECAY_PER_MINUTE.energy * deltaMinutes);
    this.hygiene = Math.max(0, this.hygiene - DECAY_PER_MINUTE.hygiene * deltaMinutes);

    // Health: drain slowly when critical needs are unmet.
    const critical = this.hunger < 10 || this.thirst < 10 || this.energy < 5;
    if (critical) {
      this.health = Math.max(0, this.health - 0.6 * deltaMinutes);
    } else if (this.health < 100) {
      // Slow natural regeneration when needs are fine.
      this.health = Math.min(100, this.health + 0.2 * deltaMinutes);
    }
  }

  // Time-based tick called from the main loop using the simulation clock.
  tickByClock() {
    if (!this.timeSystem) return;
    const now = this.timeSystem.time;
    const deltaMinutes = now - this.lastTickTime;
    if (deltaMinutes > 0) this.tick(deltaMinutes);
    this.lastTickTime = now;
  }

  eat(amount = 30) {
    this.hunger = Math.min(100, this.hunger + amount);
  }

  drink(amount = 30) {
    this.thirst = Math.min(100, this.thirst + amount);
  }

  sleep(hours) {
    this.energy = Math.min(100, this.energy + hours * 12);
    this.hygiene = Math.max(0, this.hygiene - 5);
  }

  get status() {
    let status = 'fine';
    if (this.hunger < 20 || this.thirst < 20 || this.energy < 20 || this.hygiene < 20) status = 'poor';
    if (this.hunger < 10 || this.thirst < 10 || this.energy < 10 || this.health < 30) status = 'critical';
    return status;
  }

  toJSON() {
    return {
      hunger: this.hunger,
      thirst: this.thirst,
      energy: this.energy,
      health: this.health,
      hygiene: this.hygiene,
      lastTickTime: this.lastTickTime,
    };
  }

  fromJSON(data) {
    if (data.hunger !== undefined) this.hunger = data.hunger;
    if (data.thirst !== undefined) this.thirst = data.thirst;
    if (data.energy !== undefined) this.energy = data.energy;
    if (data.health !== undefined) this.health = data.health;
    if (data.hygiene !== undefined) this.hygiene = data.hygiene;
    if (data.lastTickTime !== undefined) this.lastTickTime = data.lastTickTime;
  }
}
