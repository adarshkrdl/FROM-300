/**
 * main.js — From ₹300 game entry point.
 *
 * Bootstraps Three.js, the city, player, input, simulation systems and UI,
 * then runs the render/update loop.
 */

import * as THREE from 'three';
import { Input } from './core/Input.js';
import { CameraSystem } from './core/CameraSystem.js';
import { Renderer } from './core/Renderer.js';
import { TimeSystem } from './core/TimeSystem.js';
import { Player } from './player/Player.js';
import { City } from './world/City.js';
import { NeedsSystem } from './systems/NeedsSystem.js';
import { BankingSystem, formatRupees } from './systems/BankingSystem.js';
import { BusinessSystem } from './systems/BusinessSystem.js';
import { UI } from './ui/UI.js';
import { SaveSystem, SLOT_NAMES } from './save/SaveSystem.js';
import { loadModel } from './core/AssetLoader.js';

let renderer, cameraSystem, scene, city, player, input, timeSystem, needsSystem,
  bankingSystem, businessSystem, ui, saveSystem;

let lastTime = performance.now();
let paused = false;
let gameStarted = false;
let autoSaveTimer = 0;

// Fog for atmospheric distance (performance-friendly).
const FOG_COLOR_NIGHT = 0x05070f;
const FOG_COLOR_DAY = 0xb8d4f0;

async function init() {
  const canvasContainer = document.getElementById('canvas-container');
  const canvas = document.createElement('canvas');
  canvasContainer.appendChild(canvas);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 100, 900);

  renderer = new Renderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Lighting: sun (directional) + ambient.
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(60, 80, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 250;
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  scene.add(sun);

  window.sun = sun;
  window.ambient = ambient;

  cameraSystem = new CameraSystem({ domElement: canvas });
  cameraSystem.setSize(window.innerWidth, window.innerHeight);

  input = new Input(canvas);
  timeSystem = new TimeSystem({ speed: 4, startMinute: 6 * 60 });

  city = new City();
  scene.add(city.scene);
  // Wait for the procedural base + downloaded GLB assets to load.
  await city.ready;

  player = new Player({ cameraSystem, input });
  scene.add(player.mesh);

  // Replace the procedural placeholder with the downloaded character model
  // when it is available (gobkit CC0 minion).
  await applyCharacterModel();

  needsSystem = new NeedsSystem({ timeSystem });
  bankingSystem = new BankingSystem();
  businessSystem = new BankingSystem && new BusinessSystem({ bankingSystem });

  ui = new UI();
  saveSystem = new SaveSystem();

  // --- UI wiring ---
  ui.onNewGame = () => startNewGame();
  ui.onLoadGame = () => showLoadMenu();
  ui.onSave = () => saveGame('Slot 1');
  ui.onMainMenu = () => returnToMainMenu();

  ui.onJoystick((x, y) => {
    input.move.x = x;
    input.move.z = y;
  });
  ui.onRun((v) => { input.run = v; });
  ui.onJump(() => { input.jump = true; });
  ui.onInteract(() => {
    input.interact = true;
    input.interactJustPressed = true;
  });

  // Click to start / pointer lock.
  canvas.addEventListener('click', () => {
    if (!gameStarted) return;
    if (ui.state === 'pause') return;
    if (!ui._isMobile()) input.requestPointerLock();
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      if (gameStarted && ui.state === 'hud') { pauseGame(); }
      else if (gameStarted && ui.state === 'pause') { resumeGame(); }
    }
  });

  window.addEventListener('resize', onResize);

  // Expose for debugging / console.
  window.game = { player, timeSystem, needsSystem, bankingSystem, businessSystem, city, saveSystem, ui };

  // Start at main menu.
  showMainMenu();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cameraSystem.setSize(w, h);
  cameraSystem.camera.aspect = w / h;
  cameraSystem.camera.updateProjectionMatrix();
}

function showMainMenu() {
  paused = true;
  ui._showMainMenu();
  // Render one frame so the menu is visible over the scene.
  renderFrame(0);
}

function startNewGame() {
  paused = false;
  gameStarted = true;
  // Fresh state.
  player.money = 30000; // ₹300
  player.position.set(0, 1.2, 0);
  player.mesh.position.copy(player.position);
  timeSystem.time = 6 * 60;
  timeSystem.paused = false;
  needsSystem.hunger = 80;
  needsSystem.thirst = 80;
  needsSystem.energy = 100;
  needsSystem.health = 100;
  needsSystem.hygiene = 80;
  bankingSystem.banks.forEach((b) => { b.balance = 0; });
  bankingSystem.loans = [];
  bankingSystem.transactions = [];
  bankingSystem.creditScore = 700;
  businessSystem.businesses = [];
  businessSystem.nextId = 1;
  needsSystem.lastTickTime = timeSystem.time;
  ui.showHUD();
  input.requestPointerLock();
}

async function showLoadMenu() {
  const slots = await saveSystem.listSlots();
  let html = '<div style="width:90%;max-width:360px"><div class="title">Load Game</div>' +
    '<div class="slot-list">';
  for (const slot of SLOT_NAMES) {
    const s = slots[slot];
    if (s) {
      html += `<button class="btn slot-item" data-slot="${slot}">
        <span><strong>${slot}</strong> — Day ${s.day}</span>
        <span class="slot-meta">${formatRupees(s.money)} • saved ${relativeTime(s.savedAt)}</span>
      </button>`;
    } else {
      html += `<button class="btn slot-item empty" data-slot="${slot}" disabled>
        <span>${slot} — Empty</span>
      </button>`;
    }
  }
  html += '</div><button class="btn row" id="btn-load-back">Back</button></div>';
  ui.menu.innerHTML = html;
  for (const slot of SLOT_NAMEsSafe()) {
    const btn = ui.menu.querySelector(`[data-slot="${slot}"]`);
    if (btn && !btn.disabled) btn.onclick = () => loadGame(slot);
  }
  const back = ui.menu.querySelector('#btn-load-back');
  if (back) back.onclick = showMainMenu;
}

function SLOT_NAMEsSafe() { return SLOT_NAMES; }

async function loadGame(slot) {
  const record = await saveSystem.load(slot);
  if (!record) { ui.notify('Save not found', 'error'); return; }

  gameStarted = true;
  paused = false;

  if (record.player) player.fromJSON(record.player);
  if (record.time) timeSystem.fromJSON(record.time);
  if (record.needs) needsSystem.fromJSON(record.needs);
  if (record.banking) bankingSystem.fromJSON(record.banking);
  if (record.businesses) businessSystem.fromJSON(record.businesses);
  needsSystem.lastTickTime = timeSystem.time;

  ui.showHUD();
  input.requestPointerLock();
  ui.notify(`Loaded ${slot}`);
}

function saveGame(slot) {
  const state = {
    player: player.toJSON(),
    time: timeSystem.toJSON(),
    needs: needsSystem.toJSON(),
    banking: bankingSystem.toJSON(),
    businesses: businessSystem.toJSON(),
    playTime: 0,
  };
  saveSystem.save(slot, state).then(() => {
    ui.notify(`Saved to ${slot}`);
  }).catch((err) => {
    ui.notify('Save failed: ' + err.message, 'error');
    console.error(err);
  });
}

function pauseGame() { paused = true; timeSystem.pause(); ui.pauseMenu(); }
function resumeGame() { paused = false; timeSystem.resume(); ui.resume(); if (!ui._isMobile()) input.requestPointerLock(); }
function returnToMainMenu() { paused = true; gameStarted = false; showMainMenu(); }

function updateSimulation(deltaSeconds) {
  if (paused || !gameStarted) return;

  timeSystem.tick(deltaSeconds);

  // Advance needs by simulated minutes.
  const simMinutes = deltaSeconds * timeSystem.speed;
  needsSystem.tick(simMinutes);

  player.update(deltaSeconds, city);

  // Camera vs building colliders.
  cameraSystem.update(city.colliders);

  // Update lights by time of day.
  updateLighting();

  // Auto-save every ~2 minutes of real time.
  autoSaveTimer += deltaSeconds;
  if (autoSaveTimer > 120) {
    autoSaveTimer = 0;
    saveGame('Slot 1').catch(() => {});
  }
}

function updateLighting() {
  const sun = window.sun;
  const ambient = window.ambient;
  const lf = Math.max(0, timeSystem.lightFactor);
  const isNight = timeSystem.isNight;

  ambient.intensity = 0.35 + 0.45 * lf;
  sun.intensity = 1.4 * lf + 0.1;
  sun.position.x = Math.sin((timeSystem.time % (24 * 60)) / (24 * 60) * Math.PI * 2 - Math.PI / 2) * 100;
  sun.position.y = Math.max(5, 60 * lf + 10);
  sun.position.z = 40;

  const fogColor = isNight ? FOG_COLOR_NIGHT : FOG_COLOR_DAY;
  scene.fog.color.setHex(fogColor);
  scene.background.color.setHex(isNight ? 0x0b1020 : 0x87ceeb);
}

function renderFrame(deltaSeconds) {
  renderer.render(scene, cameraSystem.camera);
}

function loop(now) {
  const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!paused && gameStarted) {
    updateSimulation(deltaSeconds);

    // Consume one-shot interaction after systems have read it.
    if (input.interactJustPressed) {
      input.interactJustPressed = false;
      ui.notify('Interaction: approach an object and press E / tap Interact.', 'info');
    }
  }

  input.update();
  renderFrame(deltaSeconds);
  requestAnimationFrame(loop);
}

function relativeTime(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

async function applyCharacterModel() {
  const url = 'assets/models/characters/npc_minion.glb';
  let model;
  try {
    model = await loadModel(url);
  } catch (e) {
    console.warn('Could not load character model, using procedural placeholder', e);
    return;
  }
  if (!model) return;
  const char = model.clone();
  const box = new THREE.Box3().setFromObject(char);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = 1.6 / Math.max(size.y, 0.1);
  char.scale.set(s, s, s);
  // Center vertically so the pivot is at the feet.
  char.position.y = -box.min.y * s;
  char.castShadow = true;
  scene.remove(player.mesh);
  player.mesh = char;
  player.mesh.position.copy(player.position);
  player.mesh.rotation.y = player.rotation;
  scene.add(player.mesh);
}

init().catch((err) => {
  console.error('Failed to initialize the game', err);
  uiNotifyFatal('Failed to initialize the game. See console for details.');
});

function uiNotifyFatal(message) {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#8b1a1a;color:#fff;padding:16px 24px;border-radius:8px;z-index:100;';
  el.textContent = message;
  document.body.appendChild(el);
}
