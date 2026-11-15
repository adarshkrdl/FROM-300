/**
 * City — open-world environment with detailed procedural geometry + downloaded GLB assets.
 *
 * Visual polish focus: detailed buildings with roofs, varied facades, district-specific
 * color palettes, street elements, improved lighting and ground. Downloaded assets are
 * placed on top with proper scaling. Every asset load has a procedural fallback.
 */

import * as THREE from 'three';
import { loadModel, cloneModel } from '../core/AssetLoader.js';

const DISTRICTS = [
  {
    name: 'Village Outskirts', color: 0x8fbc8f, roof: 0x6d8a6f, minH: 3, maxH: 6, density: 0.35, size: 220,
    wallColor: 0xc8d5b8, accent: 0xbfa07a,
  },
  {
    name: 'Poor Neighbourhood', color: 0x9e9e9e, roof: 0x7a7a7a, minH: 3, maxH: 7, density: 0.6, size: 220,
    wallColor: 0xd3d3d3, accent: 0x5a5a5a,
  },
  {
    name: 'Marketplace', color: 0xffa726, roof: 0xe65100, minH: 4, maxH: 9, density: 0.8, size: 200,
    wallColor: 0xffcc80, accent: 0xff6f00,
  },
  {
    name: 'Commercial District', color: 0x29b6f6, roof: 0x0277bd, minH: 6, maxH: 15, density: 0.85, size: 240,
    wallColor: 0x81d4fa, accent: 0x01579b,
  },
  {
    name: 'Industrial District', color: 0x78909c, roof: 0x455a64, minH: 5, maxH: 12, density: 0.7, size: 260,
    wallColor: 0xb0bec5, accent: 0x37474f,
  },
  {
    name: 'Financial District', color: 0x455a64, roof: 0x263238, minH: 12, maxH: 35, density: 0.75, size: 200,
    wallColor: 0x90a4ae, accent: 0x1a232f,
  },
  {
    name: 'Luxury Residential', color: 0x7e57c2, roof: 0x5e35b1, minH: 5, maxH: 10, density: 0.5, size: 240,
    wallColor: 0xe1bee7, accent: 0x4527a0,
  },
  {
    name: 'Entertainment District', color: 0xf06292, roof: 0xad1457, minH: 6, maxH: 13, density: 0.8, size: 200,
    wallColor: 0xf8bbd0, accent: 0x880e4f,
  },
];

const BLOCK_SIZE = 28;
const ROAD_WIDTH = 9;
const FOOTPATH_WIDTH = 2.2;

const ASSETS = {
  trees: [
    'assets/models/nature/TreeLow001.glb',
    'assets/models/nature/TreeMed001.glb',
    'assets/models/nature/TreeHigh001.glb',
    'assets/models/nature/Bush001.glb',
  ],
  cityKit: 'assets/models/buildings/city-kit.glb',
  vehicles: [
    'assets/models/vehicles/car_police.glb',
    'assets/models/vehicles/car_muscle.glb',
    'assets/models/vehicles/truck_icecream.glb',
    'assets/models/vehicles/truck_fire.glb',
  ],
};

export class City {
  constructor() {
    this.scene = new THREE.Group();
    this.scene.name = 'City';
    this.colliders = [];
    this.districtMeshes = [];
    this.assets = { trees: [], buildings: [], vehicles: [], characters: [] };
    this.ready = this._buildBase();
  }

  async _buildBase() {
    this._buildGround();
    this._buildRoads();
    this._buildDistricts();
    this._buildStreetElements();
    await this._loadAssets();
  }

  /* ---------- materials ---------- */

  _mat(color, { roughness = 0.8, metalness = 0.1, emissive = 0 } = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive });
  }

  _mesh(geometry, material, castShadow = true, receiveShadow = true) {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = castShadow;
    m.receiveShadow = receiveShadow;
    return m;
  }

  /* ---------- ground ---------- */

  _buildGround() {
    const geo = new THREE.PlaneGeometry(4200, 4200);
    const mat = this._mat(0x5d6d4e, { roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle grass variation patches.
    for (let i = 0; i < 40; i++) {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(25 + Math.random() * 40, 8),
        this._mat(0x6b7b58, { roughness: 1 })
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(-2000 + Math.random() * 4000, 0.06, -2000 + Math.random() * 4000);
      patch.receiveShadow = true;
      this.scene.add(patch);
    }

    const grid = new THREE.GridHelper(4200, 140, 0x3a4a33, 0x4a5a43);
    grid.position.y = 0.05;
    this.scene.add(grid);
  }

  /* ---------- roads ---------- */

  _buildRoads() {
    const extent = 1200;
    const roadMat = this._mat(0x2b2b2b, { roughness: 0.95, metalness: 0.1 });
    const pathMat = this._mat(0x556055, { roughness: 1, metalness: 0 });

    const roadGroup = new THREE.Group();
    for (let x = -extent; x <= extent; x += BLOCK_SIZE) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, extent * 2 + 40), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      roadGroup.add(road);

      const pathL = new THREE.Mesh(new THREE.PlaneGeometry(FOOTPATH_WIDTH, extent * 2 + 40), pathMat);
      pathL.rotation.x = -Math.PI / 2;
      pathL.position.set(x - ROAD_WIDTH / 2 - FOOTPATH_WIDTH / 2, 0.03, 0);
      pathL.receiveShadow = true;
      roadGroup.add(pathL);

      const pathR = new THREE.Mesh(new THREE.PlaneGeometry(FOOTPATH_WIDTH, extent * 2 + 40), pathMat);
      pathR.rotation.x = -Math.PI / 2;
      pathR.position.set(x + ROAD_WIDTH / 2 + FOOTPATH_WIDTH / 2, 0.03, 0);
      pathR.receiveShadow = true;
      roadGroup.add(pathR);
    }
    for (let z = -extent; z <= extent; z += BLOCK_SIZE) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(extent * 2 + 40, ROAD_WIDTH), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      roadGroup.add(road);

      const pathL = new THREE.Mesh(new THREE.PlaneGeometry(extent * 2 + 40, FOOTPATH_WIDTH), pathMat);
      pathL.rotation.x = -Math.PI / 2;
      pathL.position.set(0, 0.03, z - ROAD_WIDTH / 2 - FOOTPATH_WIDTH / 2);
      pathL.receiveShadow = true;
      roadGroup.add(pathL);

      const pathR = new THREE.Mesh(new THREE.PlaneGeometry(extent * 2 + 40, FOOTPATH_WIDTH), pathMat);
      pathR.rotation.x = -Math.PI / 2;
      pathR.position.set(0, 0.03, z + ROAD_WIDTH / 2 + FOOTPATH_WIDTH / 2);
      pathR.receiveShadow = true;
      roadGroup.add(pathR);
    }

    // Road markings (dashed center lines).
    const markMat = this._mat(0xffff44, { roughness: 1, metalness: 0 });
    for (let x = -extent; x <= extent; x += BLOCK_SIZE * 2) {
      for (let z = -extent; z <= extent; z += 12) {
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 4), markMat);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(x + ROAD_WIDTH / 2 - 0.6, 0.04, z);
        mark.receiveShadow = true;
        roadGroup.add(mark);
      }
    }

    for (let x = -extent; x <= extent; x += BLOCK_SIZE) {
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(x - ROAD_WIDTH / 2, -1, -extent - 20),
        new THREE.Vector3(x + ROAD_WIDTH / 2, 1, extent + 20)
      ));
    }
    for (let z = -extent; z <= extent; z += BLOCK_SIZE) {
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(-extent - 20, -1, z - ROAD_WIDTH / 2),
        new THREE.Vector3(extent + 20, 1, z + ROAD_WIDTH / 2)
      ));
    }

    this.scene.add(roadGroup);
  }

  /* ---------- districts ---------- */

  _buildDistricts() {
    const cols = 4;
    const rows = 4;
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const district = DISTRICTS[index % DISTRICTS.length];
        index++;
        const cx = (col - cols / 2 + 0.5) * BLOCK_SIZE;
        const cz = (row - rows / 2 + 0.5) * BLOCK_SIZE;
        this._buildDistrictBlock(cx, cz, district);
      }
    }
  }

  _buildDistrictBlock(cx, cz, district) {
    const group = new THREE.Group();
    group.name = district.name;

    const blockHalf = BLOCK_SIZE / 2 - ROAD_WIDTH / 2 - 1;
    const buildingCount = Math.max(1, Math.floor(district.density * 5));

    for (let i = 0; i < buildingCount; i++) {
      const bx = cx + (Math.random() - 0.5) * blockHalf * 1.5;
      const bz = cz + (Math.random() - 0.5) * blockHalf * 1.5;

      const w = 7 + Math.random() * 11;
      const d = 7 + Math.random() * 11;
      const h = district.minH + Math.random() * (district.maxH - district.minH);

      this._addBuilding(group, bx, bz, w, h, d, district);

      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(bx - w / 2, 0, bz - d / 2),
        new THREE.Vector3(bx + w / 2, h, bz + d / 2)
      ));

      // Signage on commercial/marketplace buildings.
      if ((district.name === 'Marketplace' || district.name === 'Commercial District') && Math.random() < 0.7) {
        const sign = this._addSign(bx, bz, w, d, h, district);
        if (sign) group.add(sign);
      }
    }

    this.scene.add(group);
    this.districtMeshes.push(group);
  }

  _addBuilding(group, x, y, w, h, d, district) {
    const wallMat = this._mat(district.wallColor || district.color);
    const roofMat = this._mat(district.roof);
    const trimMat = this._mat(district.accent);

    // Main volume.
    const main = this._mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    main.position.set(x, h / 2, y);
    group.add(main);

    // Roof (sloped-ish box on top).
    const roofH = 1 + Math.random() * 2;
    const roof = this._mesh(new THREE.BoxGeometry(w * 1.12, roofH, d * 1.12), roofMat);
    roof.position.set(x, h + roofH / 2, y);
    group.add(roof);

    // Roof trim / parapet.
    const trim = this._mesh(new THREE.BoxGeometry(w * 1.16, 0.35, d * 1.16), trimMat);
    trim.position.set(x, h + roofH + 0.17, y);
    group.add(trim);

    // Windows (simple recessed rectangles).
    const winMat = this._mat(0x1a2330, { roughness: 0.1, metalness: 0.6 });
    const winRows = Math.max(1, Math.floor(h / 3));
    const winCols = Math.max(1, Math.floor(w / 4));
    for (let r = 0; r < winRows; r++) {
      for (let c = 0; c < winCols; c++) {
        const wx = -w / 2 + (c + 0.6) * (w / winCols);
        const wz = d / 2 + 0.06;
        const wy = 1.5 + r * 3 + Math.random() * 0.5;
        if (wy > h - 1) continue;
        const win = this._mesh(new THREE.BoxGeometry(0.9, 1.4, 0.12), winMat, false, false);
        win.position.set(x + wx, wy, y + wz);
        group.add(win);

        // Back face window for two-sided look.
        const win2 = this._mesh(new THREE.BoxGeometry(0.9, 1.4, 0.12), winMat, false, false);
        win2.position.set(x + wx, wy, y - wz);
        win2.rotation.y = Math.PI;
        group.add(win2);
      }
    }

    // Door at front.
    const door = this._mesh(new THREE.BoxGeometry(1, 1.8, 0.12), this._mat(0x3e2723, { roughness: 0.9 }));
    door.position.set(x, 0.9, y - d / 2 - 0.07);
    group.add(door);
  }

  _addSign(x, z, w, d, h, district) {
    const signMat = this._mat(0x111111, { roughness: 0.8 });
    const textMat = this._mat(district.accent, { roughness: 0.4 });
    const sign = this._mesh(new THREE.BoxGeometry(w * 0.85, 1, 0.2), signMat, false, false);
    sign.position.set(x, h + 0.7, z - d / 2 - 0.11);
    const text = this._mesh(new THREE.BoxGeometry(w * 0.5, 0.5, 0.11), textMat, false, false);
    text.position.set(x, h + 0.7, z - d / 2 - 0.105);
    const group = new THREE.Group();
    group.add(sign);
    group.add(text);
    return group;
  }

  /* ---------- street elements ---------- */

  _buildStreetElements() {
    // Streetlights along roads.
    const poleMat = this._mat(0x444444);
    const lampMat = this._mat(0xffd54f, { emissive: 0xffd54f, emissiveIntensity: 0.4 });

    const instanced = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 5, 6), poleMat, 200);
    const lampInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 6), lampMat, 200);
    const dummy = new THREE.Object3D();

    let count = 0;
    for (let x = -900; x <= 900 && count < 200; x += 22) {
      for (let side of [-1, 1]) {
        dummy.position.set(x, 2.5, side * (ROAD_WIDTH / 2 + FOOTPATH_WIDTH / 2));
        dummy.updateMatrix();
        instanced.setMatrixAt(count, dummy.matrix);
        lampInstanced.setMatrixAt(count, dummy.matrix);
        count++;
      }
    }

    instanced.castShadow = true;
    this.scene.add(instanced);
    this.scene.add(lampInstanced);

    // Point lights for streetlamps (subset for performance).
    for (let i = 0; i < Math.min(count, 48); i++) {
      const light = new THREE.PointLight(0xffd54f, 0.7, 16);
      light.castShadow = false;
      const m = new THREE.Matrix4();
      instanced.getMatrixAt(i, m);
      const pos = new THREE.Vector3().setFromMatrixPosition(m);
      pos.y = 5;
      light.position.copy(pos);
      this.scene.add(light);
    }

    // Benches and dustbins along footpaths.
    for (let x = -800; x <= 800; x += 80) {
      for (let side of [-1, 1]) {
        if (Math.random() < 0.6) this._addBench(x, side * (ROAD_WIDTH / 2 + FOOTPATH_WIDTH + 1));
        if (Math.random() < 0.4) this._addDustbin(x + 12, side * (ROAD_WIDTH / 2 + FOOTPATH_WIDTH + 2));
      }
    }
  }

  _addBench(x, z) {
    const group = new THREE.Group();
    const seat = this._mesh(new THREE.BoxGeometry(1.4, 0.1, 0.5), this._mat(0x3e2723));
    seat.position.set(0, 0.45, 0);
    group.add(seat);
    const leg = (dx) => {
      const l = this._mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), this._mat(0x444444));
      l.position.set(dx, 0.225, 0);
      group.add(l);
    };
    leg(-0.6); leg(0.6);
    const back = this._mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), this._mat(0x3e2723));
    back.position.set(0, 0.8, -0.24);
    group.add(back);
    group.position.set(x, 0, z);
    group.castShadow = true;
    group.receiveShadow = true;
    this.scene.add(group);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(x - 0.75, 0, z - 0.3),
      new THREE.Vector3(x + 0.75, 0.9, z + 0.3)
    ));
  }

  _addDustbin(x, z) {
    const bin = this._mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 8), this._mat(0x444444));
    bin.position.set(x, 0.35, z);
    bin.castShadow = true;
    bin.receiveShadow = true;
    this.scene.add(bin);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(x - 0.25, 0, z - 0.25),
      new THREE.Vector3(x + 0.25, 0.7, z + 0.25)
    ));
  }

  /* ---------- downloaded assets ---------- */

  async _loadAssets() {
    for (const url of ASSETS.trees) {
      const model = await loadModel(url).catch(() => null);
      if (model) this.assets.trees.push({ url, model });
    }

    const cityKit = await loadModel(ASSETS.cityKit).catch(() => null);
    if (cityKit) this.assets.buildings.push({ url: ASSETS.cityKit, model: cityKit });

    for (const url of ASSETS.vehicles) {
      const model = await loadModel(url).catch(() => null);
      if (model) this.assets.vehicles.push({ url, model });
    }

    const charUrl = 'assets/models/characters/npc_minion.glb';
    const charModel = await loadModel(charUrl).catch(() => null);
    if (charModel) this.assets.characters.push({ url: charUrl, model: charModel });

    this._placeTrees();
    this._placeLandmarks();
    this._placeVehicles();

    console.log('[City] assets loaded:',
      this.assets.trees.length, 'tree models,',
      this.assets.buildings.length, 'building models,',
      this.assets.vehicles.length, 'vehicle models,',
      this.assets.characters.length, 'character models');
  }

  _placeTrees() {
    if (this.assets.trees.length === 0) return;
    const placed = [];
    const cols = 4;
    const rows = 4;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = (col - cols / 2 + 0.5) * BLOCK_SIZE;
        const cz = (row - rows / 2 + 0.5) * BLOCK_SIZE;
        const count = 4 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
          const src = this.assets.trees[Math.floor(Math.random() * this.assets.trees.length)];
          const tree = cloneModel(src.model);
          if (!tree) continue;
          const offset = (BLOCK_SIZE / 2 - 3) * (Math.random() - 0.5);
          const px = cx + offset;
          const pz = cz + offset;
          const s = 0.7 + Math.random() * 0.9;
          tree.position.set(px, 0, pz);
          tree.scale.set(s, s, s);
          tree.castShadow = true;
          tree.receiveShadow = true;
          this.scene.add(tree);
          placed.push(tree);
          const box = new THREE.Box3().setFromObject(tree);
          box.expandByScalar(0.3);
          this.colliders.push(box);
        }
      }
    }
    this.assets.placedTrees = placed.length;
  }

  _placeLandmarks() {
    if (this.assets.buildings.length === 0) return;
    const kit = this.assets.buildings[0].model;
    const cols = 4;
    const rows = 4;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = (col - cols / 2 + 0.5) * BLOCK_SIZE;
        const cz = (row - rows / 2 + 0.5) * BLOCK_SIZE;
        const landmark = cloneModel(kit);
        if (!landmark) continue;
        const box = new THREE.Box3().setFromObject(landmark);
        const size = new THREE.Vector3();
        box.getSize(size);
        const scale = Math.min(20 / Math.max(size.x, 0.1), 28 / Math.max(size.y, 0.1), 20 / Math.max(size.z, 0.1), 1);
        landmark.scale.set(scale, scale, scale);
        landmark.position.set(cx, 0, cz);
        landmark.castShadow = true;
        landmark.receiveShadow = true;
        this.scene.add(landmark);
        const b2 = new THREE.Box3().setFromObject(landmark);
        this.colliders.push(b2);
        idx++;
      }
    }
    this.assets.placedLandmarks = idx;
  }

  _placeVehicles() {
    if (this.assets.vehicles.length === 0) return;
    let count = 0;
    for (let x = -700; x <= 700 && count < 24; x += 110) {
      const src = this.assets.vehicles[count % this.assets.vehicles.length];
      const v = cloneModel(src.model);
      if (!v) continue;
      const box = new THREE.Box3().setFromObject(v);
      const size = new THREE.Vector3();
      box.getSize(size);
      const s = 2.6 / Math.max(size.x, 0.1);
      v.scale.set(s, s, s);
      const side = (count % 2 === 0) ? 1 : -1;
      v.position.set(x, 0, side * (ROAD_WIDTH / 2 + 1.5));
      v.rotation.y = Math.PI / 2;
      v.castShadow = true;
      v.receiveShadow = true;
      this.scene.add(v);
      count++;
    }
    this.assets.placedVehicles = count;
  }

  setTimeOfDay(lightFactor, isNight) {
    return isNight ? 0x0b1020 : 0x87ceeb;
  }

  toJSON() { return {}; }
  fromJSON() {}
}
