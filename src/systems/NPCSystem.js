/**
 * NPCSystem — simple NPCs with schedules and movement.
 *
 * Distant NPCs use simplified simulation; nearby NPCs are full entities that
 * walk between home/work/shop based on time of day.
 */

const SCHEDULES = {
  worker: [
    { start: 6 * 60, end: 9 * 60, action: 'commute', target: 'work' },
    { start: 9 * 60, end: 17 * 60, action: 'work', target: 'work' },
    { start: 17 * 60, end: 18 * 60, action: 'commute', target: 'home' },
    { start: 18 * 60, end: 22 * 60, action: 'leisure', target: 'market' },
    { start: 22 * 60, end: 24 * 60, action: 'sleep', target: 'home' },
    { start: 0, end: 6 * 60, action: 'sleep', target: 'home' },
  ],
};

const NAMES = ['Rahul', 'Sita', 'Amit', 'Kavya', 'Ravi', 'Anita', 'Vikram', 'Neha', 'Arjun', 'Meera'];

export class NPCSystem {
  constructor({ city, timeSystem } = {}) {
    this.city = city;
    this.timeSystem = timeSystem;
    this.npcs = [];
    this.meshes = [];
  }

  spawn(count = 12) {
    if (!this.city || !this.city.scene) return;
    for (let i = 0; i < count; i++) {
      const npc = this._createNPC();
      this.npcs.push(npc);
      // Procedural placeholder mesh until a character model is assigned.
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.3, 1.0, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x9e9e9e })
      );
      mesh.position.copy(npc.position);
      mesh.castShadow = true;
      this.city.scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  _createNPC() {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const job = Object.keys(SCHEDULES)[Math.floor(Math.random() * Object.keys(SCHEDULES).length)];
    // Random position within city.
    const x = -500 + Math.random() * 1000;
    const z = -500 + Math.random() * 1000;
    return {
      id: `npc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name,
      job,
      position: new THREE.Vector3(x, 1.2, z),
      target: new THREE.Vector3(x, 1.2, z),
      money: 50000 + Math.floor(Math.random() * 200000),
      schedule: SCHEDULES[job],
      state: 'idle',
    };
  }

  tick(deltaSeconds) {
    if (!this.timeSystem) return;
    const t = (this.timeSystem.time % (24 * 60));
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const mesh = this.meshes[i];
      if (!mesh) continue;

      // Determine current schedule action.
      let action = 'idle';
      for (const s of npc.schedule) {
        if (s.start <= s.end) {
          if (t >= s.start && t < s.end) { action = s.action; break; }
        } else {
          if (t >= s.start || t < s.end) { action = s.action; break; }
        }
      }
      npc.state = action;

      // Move toward target slowly (simplified: wander).
      const speed = 1.5;
      const dir = new THREE.Vector3().subVectors(npc.target, npc.position).normalize();
      npc.position.add(dir.multiplyScalar(speed * deltaSeconds));
      mesh.position.copy(npc.position);
      mesh.lookAt(npc.target);

      // Occasionally pick a new wander target.
      if (Math.random() < 0.02) {
        npc.target.set(
          npc.position.x + (Math.random() - 0.5) * 20,
          npc.position.y,
          npc.position.z + (Math.random() - 0.5) * 20
        );
      }
    }
  }

  toJSON() { return {}; }
  fromJSON() {}
}
