/**
 * Input — unified keyboard, pointer-lock and touch controls.
 *
 * Desktop: WASD + shift (run) + space (jump) + E (interact), pointer-lock mouse look.
 * Mobile: on-screen virtual joystick + run/jump/interact buttons + touch-drag look.
 */

export class Input {
  constructor(domElement) {
    this.domElement = domElement;

    this.move = { x: 0, z: 0 }; // normalized -1..1
    this.look = { x: 0, y: 0 }; // delta
    this.run = false;
    this.jump = false;
    this.interact = false;
    this.interactJustPressed = false;

    this._pointerLocked = false;
    this._joystick = { active: false, start: { x: 0, y: 0 }, position: { x: 0, y: 0 }, delta: { x: 0, y: 0 } };
    this._touchLook = { active: false, start: { x: 0, y: 0 } };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerChange = this._onPointerChange.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onPointerChange);

    this._setupTouch();
  }

  _onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.move.z = -1; break;
      case 'KeyS': this.move.z = 1; break;
      case 'KeyA': this.move.x = -1; break;
      case 'KeyD': this.move.x = 1; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.run = true; break;
      case 'Space': this.jump = true; break;
      case 'KeyE':
        if (!this.interact) {
          this.interact = true;
          this.interactJustPressed = true;
        }
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'KeyS': if (this.move.z !== 0) this.move.z = 0; break;
      case 'KeyA':
      case 'KeyD': if (this.move.x !== 0) this.move.x = 0; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.run = false; break;
      case 'Space': this.jump = false; break;
      case 'KeyE': this.interact = false; break;
    }
  }

  _onPointerChange() {
    this._pointerLocked = !!document.pointerLockElement;
  }

  requestPointerLock() {
    this.domElement.requestPointerLock();
  }

  _setupTouch() {
    // Passive listeners to avoid scrolling while playing.
    this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.domElement.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
  }

  _onTouchStart(event) {
    const touch = event.changedTouches[0];
    const { clientX, clientY } = touch;
    const rect = this.domElement.getBoundingClientRect();

    // Left half of screen -> joystick, right half -> look.
    if (clientX < rect.width / 2) {
      this._joystick.active = true;
      this._joystick.start = { x: clientX, y: clientY };
      this._joystick.position = { x: 0, y: 0 };
    } else {
      this._touchLook.active = true;
      this._touchLook.start = { x: clientX, y: clientY };
    }
  }

  _onTouchMove(event) {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const { clientX, clientY } = touch;
    const rect = this.domElement.getBoundingClientRect();

    if (this._joystick.active) {
      const dx = clientX - this._joystick.start.x;
      const dy = clientY - this._joystick.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 60;
      const clamped = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      this._joystick.position.x = (Math.cos(angle) * clamped) / maxDist;
      this._joystick.position.y = (Math.sin(angle) * clamped) / maxDist;
      this.move.x = this._joystick.position.x;
      this.move.z = this._joystick.position.y; // inverted so forward is up on screen
    }

    if (this._touchLook.active) {
      this.look.x += (clientX - this._touchLook.start.x) * 0.004;
      this.look.y += (clientY - this._touchLook.start.y) * 0.004;
      this._touchLook.start = { x: clientX, y: clientY };
    }
  }

  _onTouchEnd() {
    this._joystick.active = false;
    this.move.x = 0;
    this.move.z = 0;
    this._touchLook.active = false;
  }

  // Call once per frame AFTER readers have consumed one-shot inputs.
  // Zeroes per-frame deltas and clears consumed flags.
  update() {
    this.interactJustPressed = false;
    this.look.x = 0;
    this.look.y = 0;
  }

  isPointerLocked() {
    return this._pointerLocked;
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onPointerChange);
    this.domElement.removeEventListener('touchstart', this._onTouchStart);
    this.domElement.removeEventListener('touchmove', this._onTouchMove);
    this.domElement.removeEventListener('touchend', this._onTouchEnd);
    this.domElement.removeEventListener('touchcancel', this._onTouchEnd);
  }
}
