/**
 * TrafficSystem — performance-conscious moving vehicles on roads.
 *
 * Uses the downloaded vehicle GLBs. Vehicles patrol along road lines and
 * despawn/respawn to keep draw calls low.
 */

import * as THREE from 'three';
import { cloneModel } from '../core/AssetLoader.js';

export class TrafficSystem {
  constructor({ city, assets, timeSystem } = {}) {
    this.city = city;
    this.assets = assets; // { vehicles: [{url, model}] }
    this.timeSystem = timeSystem;
    this.vehicles = []; // { mesh, model, lane, position, speed, direction }
    this.maxVehicles = 16;
    this._laneZ = [-24, -16, -8, 8, 16, 24]; // footpath offsets on vertical roads
  }

  spawn() {
    if (!this.city || !this.assets || this.assets.vehicles.length === 0) return;
    const { vehicles } = this.assets;
    while (this.vehicles.length < this.maxVehicles) {
      const src = vehicles[Math.floor(Math.random() * vehicles.length)];
      const mesh = cloneModel(src.model);
      if (!mesh) continue;

      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      const s = 2.5 / Math.max(size.x, 0.1);
      mesh.scale.set(s, s, s);

      const lane = this._laneZ[Math.floor(Math.random() * this._laneZ.length)];
      const x = -700 + Math.random() * 1400;
      mesh.position.set(x, 0, lane);
      mesh.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.city.scene.add(mesh);

      this.vehicles.push({
        mesh,
        lane,
        x,
        z: lane,
        direction: mesh.rotation.y > Math.PI / 2 ? -1 : 1,
        speed: 3 + Math.random() * 4,
        model: src.url,
      });
    }
  }

  tick(deltaSeconds) {
    if (!this.city) return;
    const alive = [];
    for (const v of this.vehicles) {
      v.x += v.direction * v.speed * deltaSeconds;
      v.mesh.position.x = v.x;
      // Loop back when off-screen.
      if (v.x > 800 || v.x < -800) {
        v.x = v.direction > 0 ? -800 : 800;
        v.mesh.position.x = v.x;
      }
      alive.push(v);
    }
    this.vehicles = alive;
    // Maintain count.
    while (this.vehicles.length < this.maxVehicles && this.assets && this.assets.vehicles.length) {
      this.spawnOne();
    }
  }

  spawnOne() {
    const src = this.assets.vehicles[Math.floor(Math.random() * this.assets.vehicles.length)];
    const mesh = cloneModel(src.model);
    if (!mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 2.5 / Math.max(size.x, 0.1);
    mesh.scale.set(s, s, s);
    const lane = this._laneZ[Math.floor(Math.random() * this._laneZ.length)];
    mesh.position.set(-800, 0, lane);
    mesh.rotation.y = 0;
    mesh.castShadow = true;
    this.city.scene.add(mesh);
    this.vehicles.push({
      mesh, lane, x: -800, z: lane, direction: 1,
      speed: 3 + Math.random() * 4, model: src.url,
    });
  }

  toJSON() { return {}; }
  fromJSON() {}
}
