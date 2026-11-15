/**
 * InteractionSystem — raycast-based object interaction.
 *
 * Casts a ray from the player forward. When a interactable (building collider
 * or door) is within range, shows an "E to interact" prompt. Pressing E either
 * enters a building interior or triggers an object interaction.
 */

import * as THREE from 'three';

const INTERACT_RANGE = 12;

export class InteractionSystem {
  constructor({ player, cameraSystem, colliders, ui, onEnterBuilding, onExitBuilding } = {}) {
    this.player = player;
    this.cameraSystem = cameraSystem;
    this.colliders = colliders || [];
    this.ui = ui;
    this.onEnterBuilding = onEnterBuilding;
    this.onExitBuilding = onExitBuilding;

    this.raycaster = new THREE.Raycaster();
    this.interactable = null; // { collider, label, type }
    this.promptEl = null;
    this._buildPrompt();
  }

  _buildPrompt() {
    this.promptEl = document.createElement('div');
    this.promptEl.id = 'interact-prompt';
    this.promptEl.style.cssText = `
      position: absolute; left: 50%; top: 55%; transform: translateX(-50%);
      pointer-events: none; background: rgba(0,0,0,0.7); color: #fff;
      padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);
      font-size: 15px; font-weight: 600; display: none; white-space: nowrap;
      z-index: 60;
    `;
    this.promptEl.textContent = 'E — Interact';
    document.body.appendChild(this.promptEl);
  }

  setColliders(colliders) {
    this.colliders = colliders;
  }

  update(deltaTime, input) {
    if (!this.player || !this.cameraSystem) return;

    const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    const forward = this.cameraSystem.forward.clone();
    forward.y = 0;
    forward.normalize();

    this.raycaster.set(origin, forward);
    const hits = this.raycaster.intersectObjects(this.colliders.map((c) => {
      // Build a cheap mesh proxy from Box3 for raycasting.
      const box = new THREE.Box3().copy(c);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z));
      m.position.copy(center);
      m.userData = { box: c };
      return m;
    }));

    let nearest = null;
    let nearestDist = INTERACT_RANGE;
    for (const hit of hits) {
      const d = this.player.position.distanceTo(hit.point);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = hit.object.userData.box;
      }
    }

    if (nearest) {
      this.interactable = { collider: nearest, label: 'Enter building', type: 'building' };
      if (this.promptEl) this.promptEl.style.display = 'block';

      if (input.interactJustPressed) {
        this._trigger();
      }
    } else {
      this.interactable = null;
      if (this.promptEl) this.promptEl.style.display = 'none';
    }
  }

  _trigger() {
    if (!this.interactable) return;
    if (this.interactable.type === 'building' && this.onEnterBuilding) {
      this.onEnterBuilding(this.interactable.collider);
    }
  }

  setPromptVisible(v) {
    if (this.promptEl) this.promptEl.style.display = v ? 'block' : 'none';
  }

  destroy() {
    if (this.promptEl && this.promptEl.parentNode) this.promptEl.remove();
  }
}
