/**
 * main.js — From ₹300 game entry point (full integration).
 *
 * Wires together: Three.js rendering, city, player, input, time, needs,
 * money, banking, business, jobs, corporations, stock market, rivals, NPCs,
 * traffic, interaction/interiors, smartphone UI and IndexedDB saves.
 */

import * as THREE from 'three';
import { Input } from './core/Input.js';
import { CameraSystem } from './core/CameraSystem.js';
import { Renderer } from './core/Renderer.js';
import { TimeSystem } from './core/TimeSystem.js';
import { Player } from './player/Player.js';
import { City } from './world/City.js';
import { Interior } from './world/Interior.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { NeedsSystem } from './systems/NeedsSystem.js';
import { BankingSystem } from './systems/BankingSystem.js';
import { BusinessSystem } from './systems/BusinessSystem.js';
import { JobSystem } from './systems/JobSystem.js';
import { CorporationSystem } from './systems/CorporationSystem.js';
import { StockMarketSystem } from './systems/StockMarketSystem.js';
import { RivalSystem } from './systems/RivalSystem.js';
import { NPCSystem } from './systems/NPCSystem.js';
import { TrafficSystem } from './systems/TrafficSystem.js';
import { loadModel } from './core/AssetLoader.js';
import { UI } from './ui/UI.js';
import { Smartphone } from './ui/Smartphone.js';
import { CampaignSelect } from './ui/CampaignSelect.js';
import { SaveSystem, SLOT_NAMES } from './save/SaveSystem.js';
import { formatRupees } from './systems/BankingSystem.js';

let renderer, cameraSystem, scene, city, interior, player, input, timeSystem, needsSystem,
  bankingSystem, businessSystem, jobSystem, corporationSystem, stockMarketSystem, rivalSystem,
  npcSystem, trafficSystem, interactionSystem, ui, smartphone, campaignSelect, saveSystem;

let lastTime = performance.now();
let paused = false;
let gameStarted = false;
let gameMode = 'sandbox';
let interiorActive = false;
let autoSaveTimer = 0;
let smartphoneOpen = false;

function init() {
  const canvasContainer = document.getElementById('canvas-container');
  const canvas = document.createElement('canvas');
  canvasContainer.appendChild(canvas);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 100, 900);

  renderer = new Renderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

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

  ui = new UI();
  saveSystem = new SaveSystem();

  smartphone = new Smartphone({
    player: null,
    bankingSystem: null,
    businessSystem: null,
    jobSystem: null,
    stockMarketSystem: null,
    ui,
    uiNotify: (text, type) => ui.notify(text, type),
  });
  window.phoneApp = smartphone;

  campaignSelect = new CampaignSelect({ onStart: (mode) => startNewGame(mode) });

  // --- UI wiring ---
  ui.onNewGame = () => campaignSelect.show(() => ui._showMainMenu());
  ui.onLoadGame = () => showLoadMenu();
  ui.onSave = () => saveGame('Slot 1');
  ui.onMainMenu = () => returnToMainMenu();

  ui.onJoystick((x, y) => { input.move.x = x; input.move.z = y; });
  ui.onRun((v) => { input.run = v; });
  ui.onJump(() => { input.jump = true; });
  ui.onInteract(() => {
    input.interact = true;
    input.interactJustPressed = true;
  });

  canvas.addEventListener('click', () => {
    if (!gameStarted || smartphoneOpen || interiorActive) return;
    if (!ui._isMobile()) input.requestPointerLock();
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      if (smartphoneOpen) { smartphone.close(); smartphoneOpen = false; return; }
      if (interiorActive) { exitInterior(); return; }
      if (gameStarted && ui.state === 'hud') { pauseGame(); }
      else if (gameStarted && ui.state === 'pause') { resumeGame(); }
    }
    if (event.code === 'Tab' && gameStarted) {
      event.preventDefault();
      toggleSmartphone();
    }
  });

  window.addEventListener('resize', onResize);

  awaitCityAndStart();
}

async function awaitCityAndStart() {
  try {
    await city.ready;
    await applyCharacterModel();
    setupSystems();
    showMainMenu();
  } catch (err) {
    console.error('Failed to initialize the game', err);
    uiNotifyFatal('Failed to initialize the game. See console for details.');
  }
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function setupSystems() {
  player = new Player({ cameraSystem, input });
  scene.add(player.mesh);

  needsSystem = new NeedsSystem({ timeSystem });
  bankingSystem = new BankingSystem();
  businessSystem = new BusinessSystem({ bankingSystem });
  jobSystem = new JobSystem({ bankingSystem, timeSystem, needsSystem });
  corporationSystem = new CorporationSystem({ businessSystem, bankingSystem });
  stockMarketSystem = new StockMarketSystem({ businessSystem, corporationSystem });
  rivalSystem = new RivalSystem({ businessSystem, bankingSystem, stockMarketSystem });

  smartphone.player = player;
  smartphone.bankingSystem = bankingSystem;
  smartphone.businessSystem = businessSystem;
  smartphone.jobSystem = jobSystem;
  smartphone.stockMarketSystem = stockMarketSystem;

  npcSystem = new NPCSystem({ city, timeSystem });
  npcSystem.spawn(10);

  trafficSystem = new TrafficSystem({ city, assets: city.assets, timeSystem });
  trafficSystem.spawn();

  interactionSystem = new InteractionSystem({
    player, cameraSystem, colliders: city.colliders, ui,
    onEnterBuilding: enterInterior,
    onExitBuilding: exitInterior,
  });

  // Expose for debugging.
  window.game = {
    player, timeSystem, needsSystem, bankingSystem, businessSystem,
    jobSystem, corporationSystem, stockMarketSystem, rivalSystem,
    city, saveSystem, ui, smartphone, interactionSystem,
  };
}

function applyCharacterModel() {
  const url = 'assets/models/characters/npc_minion.glb';
  return loadModel(url).then((model) => {
    if (!model) return;
    const char = model.clone();
    const box = new THREE.Box3().setFromObject(char);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 1.6 / Math.max(size.y, 0.1);
    char.scale.set(s, s, s);
    char.position.y = -box.min.y * s;
    char.castShadow = true;
    scene.remove(player ? player.mesh : null);
    if (player) {
      player.mesh = char;
      player.mesh.position.copy(player.position);
      player.mesh.rotation.y = player.rotation;
    }
    scene.add(char);
  }).catch((err) => {
    console.warn('Character model load failed, using procedural placeholder', err);
  });
}

/* ---------- interior / exterior ---------- */

function enterInterior(collider) {
  interiorActive = true;
  paused = true;
  timeSystem.pause();
  city.scene.visible = false;
  interactionSystem.setPromptVisible(false);

  interior = new Interior({ buildingName: 'City Building' });
  interior.group.position.set(0, 0, 0);
  scene.add(interior.group);

  // Place player just inside.
  player.position.set(0, 1.2, -2);
  player.velocity.set(0, 0, 0);
  player.mesh.position.copy(player.position);
  cameraSystem.setTarget(player.position.clone().add(new THREE.Vector3(0, 1.4, 0)));

  ui.hud.classList.add('hidden');
  ui.mobile.classList.add('hidden');

  // Exit prompt.
  const prompt = document.createElement('div');
  prompt.id = 'exit-prompt';
  prompt.style.cssText = `
    position:absolute;left:50%;top:55%;transform:translateX(-50%);pointer-events:none;
    background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:6px;
    border:1px solid rgba(255,255,255,0.3);font-size:15px;font-weight:600;z-index:60;
  `;
  prompt.textContent = 'Esc — Exit building';
  document.body.appendChild(prompt);
  interior._exitPromptEl = prompt;
}

function exitInterior() {
  interiorActive = false;
  paused = false;
  timeSystem.resume();
  if (interior && interior.group && interior.group.parent) {
    scene.remove(interior.group);
  }
  interior = null;
  city.scene.visible = true;

  // Place player at a city spot.
  player.position.set(0, 1.2, 30);
  player.velocity.set(0, 0, 0);
  player.mesh.position.copy(player.position);
  cameraSystem.setTarget(player.position.clone().add(new THREE.Vector3(0, 1.4, 0)));

  const el = document.getElementById('exit-prompt');
  if (el) el.remove();

  if (gameStarted) {
    ui.showHUD();
    if (!ui._isMobile()) input.requestPointerLock();
  } else {
    showMainMenu();
  }
}

/* ---------- game flow ---------- */

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  cameraSystem.setSize(w, h);
  cameraSystem.camera.aspect = w / h;
  cameraSystem.camera.updateProjectionMatrix();
}

function showMainMenu() {
  paused = true;
  gameStarted = false;
  timeSystem.pause();
  ui._showMainMenu();
  renderFrame(0);
}

function startNewGame(mode) {
  gameMode = mode || 'sandbox';
  paused = false;
  gameStarted = true;
  smartphoneOpen = false;
  interiorActive = false;

  // Fresh state.
  player.money = 30000; // ₹300 in paise
  player.position.set(0, 1.2, 0);
  player.velocity.set(0, 0, 0);
  player.mesh.position.copy(player.position);

  timeSystem.time = 6 * 60;
  timeSystem.paused = false;

  needsSystem.hunger = 80; needsSystem.thirst = 80; needsSystem.energy = 100;
  needsSystem.health = 100; needsSystem.hygiene = 80;
  needsSystem.lastTickTime = timeSystem.time;

  bankingSystem.banks.forEach((b) => { b.balance = 0; });
  bankingSystem.loans = []; bankingSystem.transactions = [];
  bankingSystem.creditScore = 700;

  businessSystem.businesses = []; businessSystem.nextId = 1;
  jobSystem.playerJob = jobSystem.getJob('unemployed');
  jobSystem.education = 0; jobSystem.ownedVehicle = false;
  jobSystem.workSecondsToday = 0;

  corporationSystem.companies = []; corporationSystem.supplyContracts = [];
  stockMarketSystem.companies = []; stockMarketSystem.playerPortfolio = [];
  stockMarketSystem.tradeHistory = []; stockMarketSystem.dayCounter = 0;

  rivalSystem.rivals = []; rivalSystem._seedRivals(); rivalSystem.dayCounter = 0;

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
  for (const slot of SLOT_NAMES) {
    const btn = ui.menu.querySelector(`[data-slot="${slot}"]`);
    if (btn && !btn.disabled) btn.onclick = () => loadGame(slot);
  }
  const back = ui.menu.querySelector('#btn-load-back');
  if (back) back.onclick = showMainMenu;
}

async function loadGame(slot) {
  const record = await saveSystem.load(slot);
  if (!record) { ui.notify('Save not found', 'error'); return; }

  gameStarted = true; paused = false; smartphoneOpen = false;

  if (record.player) player.fromJSON(record.player);
  if (record.time) timeSystem.fromJSON(record.time);
  if (record.needs) needsSystem.fromJSON(record.needs);
  if (record.banking) bankingSystem.fromJSON(record.banking);
  if (record.businesses) businessSystem.fromJSON(record.businesses);
  if (record.job) jobSystem.fromJSON(record.job);
  if (record.corporation) corporationSystem.fromJSON(record.corporation);
  if (record.stockMarket) stockMarketSystem.fromJSON(record.stockMarket);
  if (record.rival) rivalSystem.fromJSON(record.rival);
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
    job: jobSystem.toJSON(),
    corporation: corporationSystem.toJSON(),
    stockMarket: stockMarketSystem.toJSON(),
    rival: rivalSystem.toJSON(),
    playTime: 0,
  };
  return saveSystem.save(slot, state).then(() => {
    ui.notify(`Saved to ${slot}`);
  }).catch((err) => {
    ui.notify('Save failed: ' + err.message, 'error');
    console.error(err);
  });
}

function toggleSmartphone() {
  if (interiorActive) return;
  smartphoneOpen = !smartphoneOpen;
  if (smartphoneOpen) {
    paused = true; timeSystem.pause();
    ui.hud.classList.add('hidden');
    ui.mobile.classList.add('hidden');
    smartphone.show();
  } else {
    paused = false; timeSystem.resume();
    ui.showHUD();
    if (!ui._isMobile()) input.requestPointerLock();
  }
}

function pauseGame() { paused = true; timeSystem.pause(); ui.pauseMenu(); }
function resumeGame() { paused = false; timeSystem.resume(); ui.resume(); if (!ui._isMobile()) input.requestPointerLock(); }
function returnToMainMenu() { paused = true; gameStarted = false; showMainMenu(); }

/* ---------- simulation ---------- */

function updateSimulation(deltaSeconds) {
  if (paused || !gameStarted || interiorActive) return;

  timeSystem.tick(deltaSeconds);
  const simMinutes = deltaSeconds * timeSystem.speed;
  needsSystem.tick(simMinutes);

  player.update(deltaSeconds, city);
  interactionSystem.update(deltaSeconds, input);
  cameraSystem.update(city.colliders);

  if (npcSystem) npcSystem.tick(deltaSeconds);
  if (trafficSystem) trafficSystem.tick(deltaSeconds);

  // Work & pay: pay once per simulated day.
  const day = Math.floor(timeSystem.time / (24 * 60));
  if (jobSystem.lastPayDay !== day && jobSystem.playerJob.id !== 'unemployed') {
    const pay = jobSystem.payDay(player);
    if (pay.paid > 0) {
      ui.notify(`Salary paid: ${formatRupees(pay.paid)}`);
    }
    jobSystem.lastPayDay = day;
  }

  // Rival tick once per simulated day (use a marker).
  const rivalDay = Math.floor(timeSystem.time / (24 * 60));
  if (rivalSystem.lastActionDay !== rivalDay) {
    // handled in RivalSystem.tickDay internally via its own counter; call here
    const acts = rivalSystem.tickDay();
    for (const a of acts) {
      if (a.type === 'price_war') ui.notify(`${a.rival} started a price war`, 'warn');
      if (a.type === 'expand') ui.notify(`${a.ceo} opened ${a.business}`);
    }
  }

  updateLighting();

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

  const fogColor = isNight ? 0x05070f : 0xb8d4f0;
  scene.fog.color.setHex(fogColor);
  scene.background.color.setHex(isNight ? 0x0b1020 : 0x87ceeb);

  if (interior) interior.setTimeOfDay(isNight);
}

function renderFrame() {
  renderer.render(scene, cameraSystem.camera);
}

function loop(now) {
  const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!paused && gameStarted && !smartphoneOpen && !interiorActive) {
    input.update();
    updateSimulation(deltaSeconds);

    if (input.interactJustPressed) {
      input.interactJustPressed = false;
    }
  } else if (!paused && gameStarted && interiorActive) {
    // Player can move inside interior too.
    player.update(deltaSeconds, { colliders: interior ? interior.colliders : [] });
    cameraSystem.update(interior ? interior.colliders : []);
    input.update();
  }

  renderFrame();
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

function uiNotifyFatal(message) {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#8b1a1a;color:#fff;padding:16px 24px;border-radius:8px;z-index:100;';
  el.textContent = message;
  document.body.appendChild(el);
}

init();
