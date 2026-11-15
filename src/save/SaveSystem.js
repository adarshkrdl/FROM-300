/**
 * SaveSystem — IndexedDB local saves with versioned save format.
 *
 * Supports multiple save slots, manual/automatic saving, loading and
 * schema validation. Basic gameplay does not require a backend.
 */

const DB_NAME = 'From300Saves';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_FORMAT_VERSION = 1;

const SLOT_NAMES = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5'];

export class SaveSystem {
  constructor() {
    this.db = null;
    this.ready = this._open();
  }

  _open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not available in this browser'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });
  }

  async _ensure() {
    await this.ready;
    if (!this.db) throw new Error('Save database not open');
  }

  _emptySave(slot, meta) {
    return {
      slot,
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt: meta.savedAt || Date.now(),
      playTime: meta.playTime || 0,
      player: {
        position: { x: 0, y: 1.2, z: 0 },
        rotation: 0,
        money: 30000, // ₹300 starting money in paise
      },
      needs: { hunger: 80, thirst: 80, energy: 100, health: 100, hygiene: 80 },
      time: { time: 360, speed: 4, paused: false },
      banking: { banks: [], loans: [], transactions: [], creditScore: 700 },
      businesses: { businesses: [], nextId: 1 },
      inventory: [],
      properties: [],
      vehicles: [],
      stocks: [],
      campaign: { mode: 'sandbox', progress: {}, completed: [] },
    };
  }

  async listSlots() {
    await this._ensure();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const slots = {};
        for (const s of SLOT_NAMES) {
          const found = request.result.find((r) => r.slot === s);
          slots[s] = found
            ? {
                slot: found.slot,
                savedAt: found.savedAt,
                playTime: found.playTime,
                day: found.time ? Math.floor(found.time.time / (24 * 60)) + 1 : 1,
                money: found.player ? found.player.money : 0,
                formatVersion: found.formatVersion,
              }
            : null;
        }
        resolve(slots);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async save(slot, state) {
    await this._ensure();
    const record = {
      slot,
      ...state,
      savedAt: Date.now(),
      formatVersion: SAVE_FORMAT_VERSION,
    };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  async load(slot) {
    await this._ensure();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(slot);
      request.onsuccess = () => {
        if (!request.result) resolve(null);
        else resolve(this._validate(request.result));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(slot) {
    await this._ensure();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(slot);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Validate and migrate a saved record. Returns null if the save is invalid.
  _validate(record) {
    if (!record || record.formatVersion === undefined) return null;
    if (record.formatVersion !== SAVE_FORMAT_VERSION) {
      // Future migration logic would go here.
      return null;
    }
    return record;
  }

  async hasSave(slot) {
    const data = await this.load(slot);
    return !!data;
  }
}

export { SLOT_NAMES };
