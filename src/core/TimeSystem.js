/**
 * TimeSystem — accelerated day/night cycle and simulation clock.
 *
 * Simulation time runs at a fixed multiple of real time. The clock drives
 * lighting, weather, business opening hours and NPC schedules.
 */

import { formatTime, formatDay } from '../utils/math.js';

const MINUTES_PER_DAY = 24 * 60;

export class TimeSystem {
  constructor({ speed = 4, startMinute = 6 * 60 } = {}) {
    // Game speed: how many simulation minutes pass per real second.
    this.speed = speed;
    // Simulation time in minutes since day 0 00:00.
    this.time = startMinute;
    this.paused = false;
    this.date = new Date();
    this.date.setHours(0, 0, 0, 0);
    this.date.setMinutes(startMinute);
  }

  get day() {
    return Math.floor(this.time / MINUTES_PER_DAY) + 1;
  }

  get hour() {
    return Math.floor((this.time % MINUTES_PER_DAY) / 60);
  }

  get minute() {
    return Math.floor(this.time % 60);
  }

  get timeString() {
    return formatTime(this.time);
  }

  get dayString() {
    return formatDay(this.time);
  }

  get isNight() {
    const h = this.hour;
    return h >= 20 || h < 6;
  }

  get isMorning() {
    const h = this.hour;
    return h >= 6 && h < 12;
  }

  get isEvening() {
    const h = this.hour;
    return h >= 16 && h < 20;
  }

  // Lighting factor 0 (midnight) -> 1 (noon), used for ambient/directional light.
  get lightFactor() {
    const t = (this.time % MINUTES_PER_DAY) / MINUTES_PER_DAY;
    // Sunrise at ~6, sunset at ~18.
    return Math.max(0, Math.sin((t - 0.25) * Math.PI));
  }

  tick(deltaSeconds) {
    if (this.paused) return;
    this.time += deltaSeconds * this.speed;
    while (this.time >= MINUTES_PER_DAY) {
      this.time -= MINUTES_PER_DAY;
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  toJSON() {
    return {
      time: this.time,
      speed: this.speed,
      paused: this.paused,
    };
  }

  fromJSON(data) {
    if (data.time !== undefined) this.time = data.time;
    if (data.speed !== undefined) this.speed = data.speed;
    if (data.paused !== undefined) this.paused = data.paused;
  }
}
