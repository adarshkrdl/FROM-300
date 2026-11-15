/**
 * UI — HTML/CSS overlay: main menu, HUD, pause menu, mobile controls,
 * notifications and simple modals.
 */

export class UI {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ui';
    this.container.style.cssText = `
      position: absolute; inset: 0; pointer-events: none;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      z-index: 50;
    `;
    document.body.appendChild(this.container);

    this._injectStyles();
    this._buildHUD();
    this._buildMainMenu();
    this._buildPauseMenu();
    this._buildMobileControls();
    this._buildNotifications();

    this.state = 'menu'; // menu | hud | pause
    this._showMainMenu();
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #ui { font-size: 14px; }
      .panel {
        pointer-events: auto;
        position: absolute; inset: 0;
        background: rgba(8, 9, 12, 0.75);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: #fff;
      }
      .panel.hidden { display: none !important; }
      .btn {
        pointer-events: auto;
        margin: 8px 0; padding: 12px 26px;
        font-size: 16px; background: #1a1a2e; color: #fff;
        border: 2px solid #c0c0c0; border-radius: 8px; cursor: pointer;
        min-width: 220px;
      }
      .btn:hover { background: #2a2a4e; border-color: #fff; }
      .btn:active { background: #3a3a6e; }
      .btn.row { width: 90%; max-width: 320px; }
      .title { font-size: 34px; font-weight: 800; letter-spacing: 2px; margin-bottom: 6px;
        background: linear-gradient(90deg, #ffd54f, #ff8a65); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .subtitle { font-size: 15px; color: #b9c0cc; margin-bottom: 30px; }

      /* HUD */
      #hud { pointer-events: none; }
      .hud-bar { pointer-events: auto; position: absolute; top: 16px; left: 16px;
        display: flex; flex-direction: column; gap: 8px; gap: 10px; }
      .hud-row { display: flex; align-items: baseline; gap: 10px; background: rgba(0,0,0,0.55);
        padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); }
      .hud-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9aa0a6; min-width: 78px; }
      .hud-value { font-size: 17px; font-weight: 700; color: #ffffff; }
      .money { color: #6ee7b7; }
      .time { color: #ffd54f; }
      .day { color: #8ab4f8; }
      .status-wrap { position: absolute; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 6px; }
      .status-pill { pointer-events: auto; background: rgba(0,0,0,0.55); padding: 6px 12px; border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.12); font-size: 13px; color: #e5e7eb; min-width: 130px; text-align: center; }
      .status-critical { color: #ff6b6b; border-color: rgba(255,107,107,0.45); }
      .status-poor { color: #ffd54f; border-color: rgba(255,213,79,0.45); }

      /* Mobile controls */
      #mobile-controls { pointer-events: none; position: absolute; bottom: 20px; left: 0; right: 0;
        display: flex; justify-content: space-between; padding: 0 16px; }
      #mobile-controls.hidden { display: none !important; }
      .joystick-wrap { pointer-events: auto; position: relative; width: 110px; height: 110px;
        background: rgba(255,255,255,0.12); border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); }
      .joystick-knob { pointer-events: none; position: absolute; left: 50%; top: 50%;
        width: 52px; height: 52px; background: rgba(255,255,255,0.35); border-radius: 50%;
        transform: translate(-50%, -50%); border: 1px solid rgba(255,255,255,0.5); }
      .action-btns { pointer-events: auto; display: flex; gap: 14px; align-items: flex-end; }
      .act-btn { width: 66px; height: 66px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 16px; color: #fff; font-size: 12px; font-weight: 700; display: flex;
        flex-direction: column; align-items: center; justify-content: center; user-select: none; -webkit-tap-highlight-color: transparent; }
      .act-btn:active { background: rgba(255,255,255,0.35); }
      .act-k { font-size: 11px; opacity: 0.7; margin-top: 4px; }

      /* Save slot list */
      .slot-list { display: flex; flex-direction: column; gap: 8px; width: 90%; max-width: 340px; }
      .slot-item { pointer-events: auto; display: flex; justify-content: space-between; align-items: center;
        width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px; color: #fff; text-align: left; cursor: pointer; }
      .slot-item:hover { background: rgba(255,255,255,0.14); }
      .slot-item.empty { opacity: 0.6; cursor: default; }
      .slot-item.empty:hover { background: rgba(255,255,255,0.06); }
      .slot-meta { font-size: 12px; color: #9aa0a6; }

      .hint { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
        color: #8a93a0; font-size: 12.5px; pointer-events: none; }
      .notifications { position: absolute; bottom: 80px; left: 16px; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
      .notif { pointer-events: auto; background: rgba(0,0,0,0.8); color: #fff; padding: 8px 14px; border-radius: 8px;
        border-left: 4px solid #6ee7b7; font-size: 13px; white-space: nowrap; }
    `;
    document.head.appendChild(style);
  }

  _buildHUD() {
    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.hud.className = 'hidden';
    this.hud.innerHTML = `
      <div class="hud-bar">
        <div class="hud-row"><span class="hud-label money">₹ Balance</span><span class="hud-value money" id="hud-money">₹0</span></div>
        <div class="hud-row"><span class="hud-label time">Time</span><span class="hud-value time" id="hud-time">06:00</span></div>
        <div class="hud-row"><span class="hud-label day">Day</span><span class="hud-value day" id="hud-day">Day 1</span></div>
      </div>
      <div class="status-wrap">
        <div class="status-pill" id="hud-status">Status: fine</div>
      </div>
    `;
    this.container.appendChild(this.hud);

    this.el = {
      money: this.hud.querySelector('#hud-money'),
      time: this.hud.querySelector('#hud-time'),
      day: this.hud.querySelector('#hud-day'),
      status: this.hud.querySelector('#hud-status'),
    };
  }

  _buildMainMenu() {
    this.menu = document.createElement('div');
    this.menu.className = 'panel';
    this.menu.id = 'main-menu';
    this.menu.innerHTML = `
      <div>
        <div class="title">FROM ₹300</div>
        <div class="subtitle">Rise of a Business Empire</div>
        <button class="btn row" id="btn-new-game">New Game</button>
        <button class="btn row" id="btn-load-game">Load Game</button>
        <button class="btn row" id="btn-settings">Settings</button>
        <div class="hint">Desktop: WASD to move • Shift to run • Space to jump • E to interact • Drag to look</div>
      </div>
    `;
    this.container.appendChild(this.menu);

    this.menu.querySelector('#btn-new-game').onclick = () => this._onNewGame();
    this.menu.querySelector('#btn-load-game').onclick = () => this._onLoadGame();
    this.menu.querySelector('#btn-settings').onclick = () => this._onSettings();
  }

  _buildPauseMenu() {
    this.pause = document.createElement('div');
    this.pause.className = 'panel hidden';
    this.pause.id = 'pause-menu';
    this.pause.innerHTML = `
      <div>
        <div class="title">Paused</div>
        <button class="btn row" id="btn-resume">Resume</button>
        <button class="btn row" id="btn-save">Save Game</button>
        <button class="btn row" id="btn-main-menu">Main Menu</button>
      </div>
    `;
    this.container.appendChild(this.pause);

    this.pause.querySelector('#btn-resume').onclick = () => this.resume();
    this.pause.querySelector('#btn-save').onclick = () => this._onSave();
    this.pause.querySelector('#btn-main-menu').onclick = () => this._onMainMenu();
  }

  _buildMobileControls() {
    this.mobile = document.createElement('div');
    this.mobile.id = 'mobile-controls';
    this.mobile.className = 'hidden';
    this.mobile.innerHTML = `
      <div class="joystick-wrap">
        <div class="joystick-knob" id="joystick-knob"></div>
      </div>
      <div class="action-btns">
        <div class="act-btn" id="btn-run">Run<span class="act-k">SHIFT</span></div>
        <div class="act-btn" id="btn-jump">Jump<span class="act-k">SPACE</span></div>
        <div class="act-btn" id="btn-interact">Interact<span class="act-k">E</span></div>
      </div>
    `;
    this.container.appendChild(this.mobile);

    this._wireMobile();
  }

  _wireMobile() {
    const knob = this.mobile.querySelector('#joystick-knob');
    const wrap = this.mobile.querySelector('.joystick-wrap');

    let activeTouch = null;
    const getPos = (e) => {
      const t = e.changedTouches[0];
      const r = wrap.getBoundingClientRect();
      return { x: t.clientX - r.left - r.width / 2, y: t.clientY - r.top - r.height / 2 };
    };

    const onStart = (e) => {
      e.preventDefault();
      activeTouch = e.changedTouches[0].identifier;
      const p = getPos(e);
      this._moveKnob(p.x, p.y);
    };
    const onMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          e.preventDefault();
          const p = getPos(e);
          const dist = Math.hypot(p.x, p.y);
          const max = 44;
          const d = Math.min(dist, max);
          const angle = Math.atan2(p.y, p.x);
          this._moveKnob(Math.cos(angle) * d, Math.sin(angle) * d);
          this._onJoystick(Math.cos(angle) * (d / max), Math.sin(angle) * (d / max));
          break;
        }
      }
    };
    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          activeTouch = null;
          this._moveKnob(0, 0);
          this._onJoystick(0, 0);
          break;
        }
      }
    };

    wrap.addEventListener('touchstart', onStart, { passive: false });
    wrap.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    const press = (id, on) => {
      const btn = this.mobile.querySelector('#' + id);
      const down = () => { e => { e.preventDefault(); on(true); }; };
      const up = () => { e => { e.preventDefault(); on(false); }; };
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); on(true); }, { passive: false });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); on(false); }, { passive: false });
    };

    this._mobileCallbacks = {};
    this.mobile.querySelector('#btn-run').addEventListener('touchstart', (e) => { e.preventDefault(); this._onRun && this._onRun(true); }, { passive: false });
    this.mobile.querySelector('#btn-run').addEventListener('touchend', (e) => { e.preventDefault(); this._onRun && this._onRun(false); }, { passive: false });
    this.mobile.querySelector('#btn-jump').addEventListener('touchstart', (e) => { e.preventDefault(); this._onJump && this._onJump(); }, { passive: false });
    this.mobile.querySelector('#btn-interact').addEventListener('touchstart', (e) => { e.preventDefault(); this._onInteract && this._onInteract(); }, { passive: false });
  }

  _moveKnob(x, y) {
    const knob = this.mobile.querySelector('#joystick-knob');
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  _onJoystick = null;
  _onRun = null;
  _onJump = null;
  _onInteract = null;

  onJoystick(cb) { this._onJoystick = cb; }
  onRun(cb) { this._onRun = cb; }
  onJump(cb) { this._onJump = cb; }
  onInteract(cb) { this._onInteract = cb; }

  _buildNotifications() {
    this.notifs = document.createElement('div');
    this.notifs.className = 'notifications';
    this.container.appendChild(this.notifs);
  }

  notify(text, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'notif';
    el.style.borderLeftColor = type === 'ok' ? '#6ee7b7' : type === 'warn' ? '#ffd54f' : '#ff6b6b';
    el.textContent = text;
    this.notifs.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  _showMainMenu() {
    this.state = 'menu';
    this.menu.classList.remove('hidden');
    this.pause.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.mobile.classList.add('hidden');
  }

  showHUD() {
    this.state = 'hud';
    this.menu.classList.add('hidden');
    this.pause.classList.add('hidden');
    this.hud.classList.remove('hidden');
    if (this._isMobile()) this.mobile.classList.remove('hidden');
  }

  pauseMenu() {
    this.state = 'pause';
    this.menu.classList.add('hidden');
    this.pause.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.mobile.classList.add('hidden');
  }

  resume() {
    this.state = 'hud';
    this.pause.classList.add('hidden');
    this.hud.classList.remove('hidden');
    if (this._isMobile()) this.mobile.classList.remove('hidden');
  }

  _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  updateHUD({ money, timeString, dayString, status }) {
    if (this.el.money) this.el.money.textContent = money;
    if (this.el.time) this.el.time.textContent = timeString;
    if (this.el.day) this.el.day.textContent = dayString;
    if (this.el.status) {
      this.el.status.textContent = `Status: ${status}`;
      this.el.status.className = 'status-pill' +
        (status === 'critical' ? ' status-critical' : status === 'poor' ? ' status-poor' : '');
    }
  }

  _onNewGame() {
    if (this.onNewGame) this.onNewGame();
  }
  _onLoadGame() {
    if (this.onLoadGame) this.onLoadGame();
  }
  _onSave() {
    if (this.onSave) this.onSave();
  }
  _onMainMenu() {
    if (this.onMainMenu) this.onMainMenu();
  }
  _onSettings() {
    this.notify('Settings coming soon', 'info');
  }

  destroy() {
    this.container.remove();
  }
}
