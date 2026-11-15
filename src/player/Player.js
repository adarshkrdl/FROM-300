/**
 * Player — controllable third-person character with movement, jumping and
 * simple AABB collision against the world.
 */

import * as THREE from 'three';
import { wrapAngle } from '../utils/math.js';

const WALK_SPEED = 3.6;
const RUN_SPEED = 6.4;
const JUMP_VELOCITY = 7.2;
const GRAVITY = 28.0;
const GROUND_FRICTION = 8.0;

export class Player {
  constructor({ cameraSystem, input } = {}) {
    this.cameraSystem = cameraSystem;
    this.input = input;

    // Physics state.
    this.position = new THREE.Vector3(0, 1.2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = 0; // yaw in radians
    this.grounded = false;
    this.height = 1.8;
    this.radius = 0.4;

    // Three.js visual mesh (simple capsule-like placeholder).
    this.mesh = this._buildMesh();
    this.mesh.position.copy(this.position);

    // State.
    this.money = 30000; // ₹300.00 in paise (integer-safe money).
    this.interacting = false;
  }

  _buildMesh() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.1, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.75;
    head.castShadow = true;
    group.add(head);

    return group;
  }

  getAABB() {
    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      this.position,
      new THREE.Vector3(this.radius * 2, this.height, this.radius * 2)
    );
    return box;
  }

  update(deltaTime, world) {
    const input = this.input;

    // Target movement direction in world space.
    const forward = this.cameraSystem.forward.clone();
    forward.y = 0;
    forward.normalize();
    const right = this.cameraSystem.right.clone();
    right.y = 0;
    right.normalize();

    const moveDir = new THREE.Vector3()
      .copy(forward).multiplyScalar(-input.move.z)
      .add(right.clone().multiplyScalar(input.move.x))
      .normalize();

    const speed = input.run ? RUN_SPEED : WALK_SPEED;

    // Ground movement.
    if (this.grounded) {
      const targetVelocity = moveDir.multiplyScalar(speed);
      // Smooth acceleration toward target.
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelocity.x, GROUND_FRICTION * deltaTime);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelocity.z, GROUND_FRICTION * deltaTime);
      this.velocity.y = 0;
    } else {
      this.velocity.y -= GRAVITY * deltaTime;
      // Air control (reduced).
      if (moveDir.lengthSq() > 0.0001) {
        const airAccel = 6.0;
        this.velocity.x += moveDir.x * airAccel * deltaTime;
        this.velocity.z += moveDir.z * airAccel * deltaTime;
      }
    }

    // Jump (consume the one-shot flag).
    if (input.jump && this.grounded) {
      this.velocity.y = JUMP_VELOCITY;
      this.grounded = false;
      input.jump = false;
    }

    // Integrate.
    const nextPosition = this.position.clone().add(this.velocity.clone().multiplyScalar(deltaTime));

    // Collision response against world geometry.
    let resolved = nextPosition;
    let hitGround = false;
    const hitCeiling = [];

    if (world && world.colliders) {
      resolved = this._resolveCollision(nextPosition, world.colliders, hitGround, hitCeiling);
    } else {
      resolved = nextPosition;
      hitGround = resolved.y <= 1.2; // flat ground fallback
    }

    this.position.copy(resolved);

    // Snap to ground when very close (sticky ground).
    if (hitGround) {
      this.position.y = 1.2;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Face movement direction when moving.
    if (moveDir.lengthSq() > 0.0001) {
      this.rotation = Math.atan2(moveDir.x, -moveDir.z);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Keep camera target updated.
    if (this.cameraSystem) {
      this.cameraSystem.setTarget(this.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
    }
  }

  _resolveCollision(next, colliders, hitGround, hitCeiling) {
    const box = this.getAABB();
    box.min.copy(next).add(new THREE.Vector3(-this.radius, 0, -this.radius));
    box.max.copy(next).add(new THREE.Vector3(this.radius, this.height, this.radius));

    let resolved = next.clone();
    let ground = false;
    let ceiling = false;

    for (const collider of colliders) {
      // Check overlap.
      if (!box.intersectsBox(collider)) continue;

      const overlap = new THREE.Box3();
      overlap.intersect(box, collider);

      const ox = overlap.max.x - overlap.min.x;
      const oy = overlap.max.y - overlap.min.y;
      const oz = overlap.max.z - overlap.min.z;

      // Resolve along the smallest overlap axis.
      if (oy <= ox && oy <= oz) {
        // Vertical overlap: floor or ceiling.
        const centerY = (box.min.y + box.max.y) / 2;
        const colliderCenterY = (collider.min.y + collider.max.y) / 2;
        if (centerY < colliderCenterY) {
          // Landing on top of collider.
          resolved.y = collider.min.y - this.height;
          ground = true;
          this.velocity.y = Math.min(this.velocity.y, 0);
        } else {
          // Hit ceiling.
          resolved.y = collider.max.y;
          ceiling = true;
          this.velocity.y = Math.min(this.velocity.y, 0);
        }
      } else if (ox <= oz) {
        // Horizontal X overlap.
        const centerX = (box.min.x + box.max.x) / 2;
        const colliderCenterX = (collider.min.x + collider.max.x) / 2;
        if (centerX < colliderCenterX) {
          resolved.x = collider.min.x - this.radius;
        } else {
          resolved.x = collider.max.x + this.radius;
        }
        this.velocity.x = 0;
      } else {
        // Horizontal Z overlap.
        const centerZ = (box.min.z + box.max.z) / 2;
        const colliderCenterZ = (collider.min.z + collider.max.z) / 2;
        if (centerZ < colliderCenterZ) {
          resolved.z = collider.min.z - this.radius;
        } else {
          resolved.z = collider.max.z + this.radius;
        }
        this.velocity.z = 0;
      }
    }

    hitGround[0] = ground;
    hitCeiling[0] = ceiling;
    return resolved;
  }

  addMoney(paise) {
    this.money += paise;
    return this.money;
  }

  spendMoney(paise) {
    if (this.money >= paise) {
      this.money -= paise;
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: this.rotation,
      money: this.money,
    };
  }

  fromJSON(data) {
    if (data.position) this.position.set(data.position.x, data.position.y, data.position.z);
    if (data.rotation !== undefined) this.rotation = data.rotation;
    if (data.money !== undefined) this.money = data.money;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }
}
