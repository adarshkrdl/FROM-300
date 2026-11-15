/**
 * AssetLoader — caches and clones GLB/glTF models loaded via GLTFLoader.
 *
 * Loads are async and failures fall back to null so the game keeps running
 * with procedural geometry.
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();

export function loadModel(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        cache.set(url, gltf.scene);
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.warn(`AssetLoader: failed to load ${url}`, err);
        cache.set(url, null);
        reject(err);
      }
    );
  });
}

/**
 * Deep-clone a loaded model scene so it can be instanced many times.
 */
export function cloneModel(source) {
  if (!source) return null;
  return source.clone();
}

/**
 * Load and place multiple copies of a model with a placement callback.
 */
export async function loadAndPlace(url, scene, place) {
  const model = await loadModel(url).catch(() => null);
  if (!model) return 0;
  let count = 0;
  place(model, () => { count++; });
  return count;
}
