/**
 * City — open-world environment with procedural geometry + downloaded GLB assets.
 *
 * Base layer: ground, road grid, instanced procedural buildings (fast, no assets).
 * Asset layer (loaded asynchronously): downloaded trees, landmark buildings and
 * vehicles are placed on top. Every asset load has a procedural fallback so the
 * game never depends on external files.
 */

import * as THREE from 'three';
import { loadModel, cloneModel } from '../core/AssetLoader.js';

const DISTRICTS = [
  { name: 'Village Outskirts', color: 0x8fbc8f, minH: 3, maxH: 7, density: 0.35, size: 220 },
  { name: 'Poor Neighbourhood', color: 0x9e9e9e, minH: 4, maxH: 9, density: 0.6, size: 220 },
  { name: 'Marketplace', color: 0xffa726, minH: 5, maxH: 11, density: 0.8, size: 200 },
  { name: 'Commercial District', color: 0x29b6f6, minH: 8, maxH: 18, density: 0.85, size: 240 },
  { name: 'Industrial District', color: 0x78909c, minH: 6, maxH: 14, density: 0.7, size: 260 },
  { name: 'Financial District', color: 0x455a64, minH: 15, maxH: 40, density: 0.75, size: 200 },
  { name: 'Luxury Residential', color: 0x7e57c2, minH: 6, maxH: 12, density: 0.5, size: 240 },
  { name: 'Entertainment District', color: 0xf06292, minH: 7, maxH: 15, density: 0.8, size: 200 },
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
    this.ready = this._buildBase(); // resolves when base + assets loaded
  }

  async _buildBase() {
    this._buildGround();
    this._buildRoads();
    this._buildDistricts();
    this._buildStreetObjects();
    await this._loadAssets();
  }

  /* ---------- procedural base ---------- */

  _buildGround() {
    const geo = new THREE.PlaneGeometry(4000, 4000);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5d6d4e, roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(4000, 100, 0x3a4a33, 0x4a5a43);
    grid.position.y = 0.05;
    this.scene.add(grid);
  }

  _box(width, height, depth, color, receiveShadow = true, castShadow = true) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = receiveShadow;
    mesh.castShadow = castShadow;
    return mesh;
  }

  _buildRoads() {
    const extent = 1200;
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0 });
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x556055, roughness: 1, metalness: 0 });

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
    const buildingCount = Math.max(1, Math.floor(district.density * 6));

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: district.color,
      roughness: 0.75,
      metalness: 0.15,
    });
    const instanced = new THREE.InstancedMesh(geo, mat, buildingCount);
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < buildingCount; i++) {
      const bx = cx + (Math.random() - 0.5) * blockHalf * 1.6;
      const bz = cz + (Math.random() - 0.5) * blockHalf * 1.6;
      const w = 6 + Math.random() * 10;
      const d = 6 + Math.random() * 10;
      const h = district.minH + Math.random() * (district.maxH - district.minH);

      dummy.position.set(bx, h / 2, bz);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);

      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(bx - w / 2, 0, bz - d / 2),
        new THREE.Vector3(bx + w / 2, h, bz + d / 2)
      ));

      if (district.name === 'Marketplace' || district.name === 'Commercial District') {
        const sign = this._box(w * 0.9, 1.2, 0.3, 0x111111, false, false);
        sign.position.set(bx, h + 0.65, bz - d / 2 - 0.16);
        group.add(sign);
      }
    }

    group.add(instanced);
    this.scene.add(group);
    this.districtMeshes.push(group);
  }

  _buildStreetObjects() {
    const lightGeo = new THREE.CylinderGeometry(0.08, 0.08, 5, 6);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xffd54f, emissiveIntensity: 0.5 });

    const instanced = new THREE.InstancedMesh(lightGeo, lightMat, 200);
    const lampInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 6, 6), lampMat, 200);
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

    for (let i = 0; i < Math.min(count, 48); i++) {
      const light = new THREE.PointLight(0xffd54f, 0.6, 14);
      light.castShadow = false;
      const m = new THREE.Matrix4();
      instanced.getMatrixAt(i, m);
      const pos = new THREE.Vector3().setFromMatrixPosition(m);
      pos.y = 5;
      light.position.copy(pos);
      this.scene.add(light);
    }

    instanced.castShadow = true;
    this.scene.add(instanced);
    this.scene.add(lampInstanced);
  }

  /* ---------- downloaded assets ---------- */

  async _loadAssets() {
    // Load trees and nature props first (cheap).
    for (const url of ASSETS.trees) {
      const model = await loadModel(url).catch(() => null);
      if (model) this.assets.trees.push({ url, model });
    }

    // Landmark city-kit building.
    const cityKit = await loadModel(ASSETS.cityKit).catch(() => null);
    if (cityKit) this.assets.buildings.push({ url: ASSETS.cityKit, model: cityKit });

    // Vehicles.
    for (const url of ASSETS.vehicles) {
      const model = await loadModel(url).catch(() => null);
      if (model) this.assets.vehicles.push({ url, model });
    }

    // Character (player / NPC placeholder).
    const charUrl = 'assets/models/characters/npc_minion.glb';
    const charModel = await loadModel(charUrl).catch(() => null);
    if (charModel) this.assets.characters.push({ url: charUrl, model: charModel });

    this._placeTrees();
    this._placeLandmarks();
    this._placeVehicles();

    console.log('[City] assets loaded:',
      this.assets.trees.length, 'tree models,',
      this.assets.buildings.length, 'building models,',
      this.assets.vehicles.length, 'vehicle models');
  }

  _placeTrees() {
    if (this.assets.trees.length === 0) return;
    // Plant trees along footpaths of each district block and in parks.
    const placed = [];
    const cols = 4;
    const rows = 4;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = (col - cols / 2 + 0.5) * BLOCK_SIZE;
        const cz = (row - rows / 2 + 0.5) * BLOCK_SIZE;
        const count = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          const src = this.assets.trees[Math.floor(Math.random() * this.assets.trees.length)];
          const tree = cloneModel(src.model);
          if (!tree) continue;
          const offset = (BLOCK_SIZE / 2 - 4) * (Math.random() - 0.5);
          const px = cx + offset;
          const pz = cz + offset;
          const s = 0.8 + Math.random() * 0.8;
          tree.position.set(px, 0, pz);
          tree.scale.set(s, s, s);
          tree.castShadow = true;
          tree.receiveShadow = true;
          this.scene.add(tree);
          this.assets.trees.push && placed.push(tree);
          const box = new THREE.Box3().setFromObject(tree);
          box.expandByScalar(0.4);
          this.colliders.push(box);
        }
      }
    }
    // Track placed trees under assets.trees for reporting.
    this.assets.placedTrees = placed.length;
  }

  _placeLandmarks() {
    if (this.assets.buildings.length === 0) return;
    const kit = this.assets.buildings[0].model;
    const cols = 4;
    const rows = 4;
    // One landmark per district block, at block centers near roads.
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = (col - cols / 2 + 0.5) * BLOCK_SIZE;
        const cz = (row - rows / 2 + 0.5) * BLOCK_SIZE;
        const landmark = cloneModel(kit);
        if (!landmark) continue;
        // Normalize size: fit within a 22x22 footprint, max height 30.
        const box = new THREE.Box3().setFromObject(landmark);
        const size = new THREE.Vector3();
        box.getSize(size);
        const scale = Math.min(22 / Math.max(size.x, 0.1), 30 / Math.max(size.y, 0.1), 22 / Math.max(size.z, 0.1), 1.2);
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
      const s = 3 / Math.max(box.size().x, 0.1);
      v.scale.set(s, s, s);
      // Park on footpath side of vertical roads.
      const side = (count % 2 === 0) ? 1 : -1;
      v.position.set(x, 0, side * (ROAD_WIDTH / 2 + 2));
      v.rotation.y = Math.PI / 2;
      v.castShadow = true;
      v.receiveShadow = true;
      this.scene.add(v);
      count++;
    }
    this.assets.placedVehicles = count;
  }

  setTimeOfDay(lightFactor, isNight) {
    // Hook for future sky/fog changes.
    return isNight ? 0x0b1020 : 0x87ceeb;
  }

  toJSON() { return {}; }
  fromJSON() {}
}
