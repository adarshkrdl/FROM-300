/**
 * Renderer — Three.js WebGL renderer setup with shadow mapping.
 */

import * as THREE from 'three';

export class Renderer {
  constructor({ canvas, antialias = true } = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setSize(width, height) {
    this.renderer.setSize(width, height);
  }

  setPixelRatio(ratio) {
    this.renderer.setPixelRatio(Math.min(ratio, 2));
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
