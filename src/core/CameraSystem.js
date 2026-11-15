/**
 * CameraSystem — third-person follow camera with pointer-lock / touch look.
 */

import * as THREE from 'three';

export class CameraSystem {
  constructor({ domElement, fov = 60, near = 0.1, far = 500 } = {}) {
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);

    // Third-person offset relative to the target.
    this.offset = new THREE.Vector3(0, 2.2, -5.5);
    this.target = new THREE.Vector3(0, 0, 0);
    this.lookTarget = new THREE.Vector3(0, 1.4, 0); // camera looks at chest height

    this.yaw = 0; // radians around Y
    this.pitch = -0.25; // radians up/down

    this.domElement = domElement;
    this.enabled = true;
    this.distance = 5.5;
    this.minDistance = 2.5;
    this.maxDistance = 9;
    this.collisionRadius = 0.35;

    this._updateCameraPosition();
  }

  setSize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setTarget(position) {
    this.target.copy(position);
    this.lookTarget.copy(position).add(new THREE.Vector3(0, 1.4, 0));
  }

  rotate(dx, dy) {
    if (!this.enabled) return;
    this.yaw += dx;
    this.pitch += dy;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
  }

  zoom(delta) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta));
    this.offset.setLength(this.distance);
  }

  _updateCameraPosition() {
    const yaw = this.yaw;
    const pitch = this.pitch;

    const x = Math.cos(pitch) * Math.sin(yaw);
    const y = Math.sin(pitch);
    const z = Math.cos(pitch) * Math.cos(yaw);

    this.offset.set(x, y, z).multiplyScalar(-this.distance);
  }

  update(colliders) {
    this._updateCameraPosition();

    let idealPosition = this.target.clone().add(this.offset);
    let actualPosition = idealPosition.clone();

    // Simple camera-vs-geometry collision: push camera toward target if blocked.
    if (colliders && colliders.length) {
      const dir = new THREE.Vector3().subVectors(actualPosition, this.target).normalize();
      const ray = new THREE.Ray(this.target.clone(), dir);
      let hitDistance = this.distance;
      let hit = false;
      for (const box of colliders) {
        const result = ray.intersectBox(box, new THREE.Vector3());
        if (result) {
          const d = this.target.distanceTo(result);
          if (d > 0.8 && d < hitDistance) {
            hitDistance = d;
            hit = true;
          }
        }
      }
      if (hit) {
        actualPosition = this.target.clone().add(dir.multiplyScalar(hitDistance - 0.25));
      }
    }

    this.camera.position.copy(actualPosition);
    this.camera.lookAt(this.lookTarget);
  }

  get forward() {
    const v = new THREE.Vector3(0, 0, -1);
    v.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    return v;
  }

  get right() {
    const v = new THREE.Vector3(1, 0, 0);
    v.applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ'));
    return v;
  }
}
