/**
 * CampaignSelect — mode selector shown before starting a new game.
 * Campaign vs Sandbox. Configurable, no forced ending.
 */

export class CampaignSelect {
  constructor({ onStart } = {}) {
    this.onStart = onStart;
    this.el = document.createElement('div');
    this.el.className = 'panel';
    this.el.id = 'campaign-select';
    this.el.style.display = 'none';
    this.el.innerHTML = `
      <div>
        <div class="title">Choose a Mode</div>
        <div class="subtitle" style="margin-bottom:24px;">Campaign missions progress through business milestones; Sandbox lets you expand indefinitely.</div>
        <button class="btn row" id="btn-campaign">Story Campaign</button>
        <button class="btn row" id="btn-sandbox">Unlimited Sandbox</button>
        <button class="btn row" id="btn-back" style="background:#8b1a1a;border-color:#8b1a1a;">Back</button>
      </div>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('#btn-campaign').onclick = () => this._start('campaign');
    this.el.querySelector('#btn-sandbox').onclick = () => this._start('sandbox');
    this.el.querySelector('#btn-back').onclick = () => this._back();
    this._onBack = null;
  }

  show(onBack) {
    this._onBack = onBack;
    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
  }

  _start(mode) {
    this.hide();
    if (this.onStart) this.onStart(mode);
  }

  _back() {
    this.hide();
    if (this._onBack) this._onBack();
  }

  destroy() {
    this.el.remove();
  }
}
