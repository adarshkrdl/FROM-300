/**
 * Interior — a replaceable indoor scene.
 *
 * When the player enters a building, the city is hidden and an interior
 * group is shown. Contains furniture, an exit door marker and colliders.
 */

import * as THREE from 'three';

export class Interior {
  constructor({ buildingName = 'Building' } = {}) {
    this.group = new THREE.Group();
    this.group.name = `Interior:${buildingName}`;
    this.buildingName = buildingName;
    this.colliders = [];
    this.exitMarker = null;

    this._build();
  }

  _build() {
    // Walls.
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d3, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4c7b3, roughness: 0.9 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 14), floorMat);
    floor.position.y = 0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    const wall = (x, z, rx, rz, w, h) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), wallMat);
      m.position.set(x, h / 2, z);
      m.rotation.y = Math.atan2(rx, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };

    const half = 7;
    wall(-half, 0, 1, 0, 14, 4); // back
    wall(half, 0, -1, 0, 14, 4); // front
    wall(0, -half, 0, 1, 14, 4); // left
    wall(0, half, 0, -1, 14, 4); // right

    // Wall colliders (thin boxes).
    for (const b of [
      new THREE.Box3(new THREE.Vector3(-half - 0.1, 0, -0.1), new THREE.Vector3(half + 0.1, 4, 0.1)),
      new THREE.Box3(new THREE.Vector3(-half - 0.1, 0, -0.1), new THREE.Vector3(half + 0.1, 4, 0.1)),
    ]) {
      this.colliders.push(b);
    }

    // Furniture: bed, table, chair, counter.
    this._addBed(2, 0, 2);
    this._addTable(-2, 0, -2);
    this._addChair(-3.2, 0, -2);
    this._addChair(-0.8, 0, -2.8);

    // Reception counter (shop/office feel).
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 1), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
    counter.position.set(0, 0.7, half - 0.6);
    counter.castShadow = true;
    counter.receiveShadow = true;
    this.group.add(counter);

    // Exit door marker (invisible trigger + visual).
    const exitGeo = new THREE.BoxGeometry(1.2, 2.2, 0.2);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, transparent: true, opacity: 0.35 });
    this.exitMarker = new THREE.Mesh(exitGeo, exitMat);
    this.exitMarker.position.set(0, 1.1, -half + 0.12);
    this.exitMarker.castShadow = true;
    this.group.add(this.exitMarker);

    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(-0.7, 0, -half - 0.1),
      new THREE.Vector3(0.7, 2.4, -half + 0.1)
    ));

    // Ceiling light.
    const light = new THREE.PointLight(0xfff0e0, 1.2, 12);
    light.position.set(0, 3.4, 0);
    light.castShadow = false;
    this.group.add(light);
  }

  _addBed(x, y, z) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 2.2), new THREE.MeshStandardMaterial({ color: 0x37474f }));
    base.position.y = 0.175;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 2.0), new THREE.MeshStandardMaterial({ color: 0xef5350 }));
    mattress.position.y = 0.475;
    mattress.castShadow = true;
    g.add(mattress);
    g.position.set(x, y, z);
    g.castShadow = true;
    g.receiveShadow = true;
    this.group.add(g);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(x - 0.75, 0, z - 1.25),
      new THREE.Vector3(x + 0.75, 0.9, z + 1.25)
    ));
  }

  _addTable(x, y, z) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.0), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    top.position.y = 0.825;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    const leg = (dx, dz) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.825, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
      l.position.set(dx, 0.4, dz);
      l.castShadow = true;
      g.add(l);
    };
    leg(-0.7, -0.42); leg(0.7, -0.42); leg(-0.7, 0.42); leg(0.7, 0.42);
    g.position.set(x, y, z);
    this.group.add(g);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(x - 0.85, 0, z - 0.6),
      new THREE.Vector3(x + 0.85, 0.95, z + 0.6)
    ));
  }

  _addChair(x, y, z) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x4e342e }));
    seat.position.y = 0.55;
    seat.castShadow = true;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
    back.position.set(0, 0.8, -0.25);
    back.castShadow = true;
    g.add(back);
    g.position.set(x, y, z);
    this.group.add(g);
  }

  setTimeOfDay(isNight) {
    // Dim interior at night slightly.
    for (const child of this.group.children) {
      if (child.isPointLight) {
        child.intensity = isNight ? 0.6 : 1.2;
      }
    }
  }

  toJSON() { return { buildingName: this.buildingName }; }
  fromJSON() {}
}
