/**
 * Smartphone — in-game smartphone overlay with apps:
 * Banking, Jobs, Businesses, Stock Market, Properties, Map, News, Settings.
 * Full-screen, mobile-friendly, toggleable.
 */

export class Smartphone {
  constructor({ player, bankingSystem, businessSystem, jobSystem, stockMarketSystem, ui, uiNotify } = {}) {
    this.player = player;
    this.bankingSystem = bankingSystem;
    this.businessSystem = businessSystem;
    this.jobSystem = jobSystem;
    this.stockMarketSystem = stockMarketSystem;
    this.ui = ui;
    this.uiNotify = uiNotify;

    this.el = document.createElement('div');
    this.el.id = 'smartphone';
    this.el.style.cssText = `
      position: absolute; inset: 0; pointer-events: auto;
      background: #0b0c10; color: #e5e7eb; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      display: none; flex-direction: column; z-index: 200;
    `;
    this.el.innerHTML = `
      <div style="height:34px;background:#1a1a2e;border-bottom:1px solid #2a2a4e;display:flex;align-items:center;justify-content:space-between;padding:0 14px;">
        <div style="font-weight:700;letter-spacing:1px;">FROM ₹300</div>
        <div style="font-size:12px;color:#9aa0a6;" id="phone-time">06:00</div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:16px;" id="phone-content"></div>
      <div style="display:flex;justify-content:space-around;padding:10px 0;border-top:1px solid #2a2a4e;background:#141428;">
        <button class="phone-nav" data-app="banking" style="flex:1;padding:8px 4px;background:#2a2a4e;color:#fff;border:none;border-radius:8px;font-size:12px;">Banking</button>
        <button class="phone-nav" data-app="jobs" style="flex:1;padding:8px 4px:background:#2a2a4e;color:#fff;border:none;border-radius:8px;font-size:12px;">Jobs</button>
        <button class="phone-nav" data-app="businesses" style="flex:1;padding:8px 4px;background:#2a2a4e;color:#fff;border:none;border-radius:8px;font-size:12px;">Business</button>
        <button class="phone-nav" data-app="stocks" style="flex:1;padding:8px 4px;background:#2a2a4e;color:#fff;border:none;border-radius:8px;font-size:12px;">Stocks</button>
        <button class="phone-nav" data-app="close" style="flex:1;padding:8px 4px;background:#8b1a1a;color:#fff;border:none;border-radius:8px;font-size:12px;">Close</button>
      </div>
    `;
    document.body.appendChild(this.el);

    this.content = this.el.querySelector('#phone-content');
    this.timeEl = this.el.querySelector('#phone-time');

    this.el.querySelectorAll('.phone-nav').forEach((btn) => {
      btn.addEventListener('click', () => this.openApp(btn.dataset.app));
    });

    this.currentApp = null;
    this.openApp('banking');
  }

  openApp(app) {
    if (app === 'close') { this.close(); return; }
    this.currentApp = app;
    if (app === 'banking') this._renderBanking();
    else if (app === 'jobs') this._renderJobs();
    else if (app === 'businesses') this._renderBusinesses();
    else if (app === 'stocks') this._renderStocks();
    else this.content.innerHTML = '<div style="padding:24px;color:#9aa0a6;">App coming soon</div>';
  }

  close() {
    this.el.style.display = 'none';
    if (this.ui) this.ui.showHUD();
  }

  show() {
    this.el.style.display = 'flex';
    if (this.ui) {
      this.ui.hud.classList.add('hidden');
      this.ui.mobile.classList.add('hidden');
    }
    this.updateTime();
    this.openApp(this.currentApp || 'banking');
  }

  updateTime() {
    if (this.timeEl) this.timeEl.textContent = '06:00'; // updated by main loop
  }

  setTimeString(s) {
    if (this.timeEl) this.timeEl.textContent = s;
  }

  _renderBanking() {
    const b = this.bankingSystem;
    const bank = b.bank;
    let html = '<div style="padding:8px 0;font-weight:700;">Banking</div>';
    html += `<div style="background:#141428;padding:16px;border-radius:10px;margin-bottom:14px;border:1px solid #2a2a4e;">
      <div style="color:#9aa0a6;font-size:12px;">${bank.name}</div>
      <div style="font-size:28px;font-weight:800;color:#6ee7b7;">₹${(bank.balance / 100).toLocaleString('en-IN')}</div>
    </div>`;
    html += '<div style="display:flex;gap:8px;margin-bottom:10px;">';
    html += `<button class="phone-btn" onclick="window.phoneApp.deposit()">Deposit</button>`;
    html += `<button class="phone-btn" onclick="window.phoneApp.withdraw()">Withdraw</button>`;
    html += `</div>`;
    html += '<div style="color:#9aa0a6;font-size:12px;">Credit score: ' + b.creditScore + '</div>';
    if (b.loans.length) {
      html += '<div style="margin-top:10px;color:#ff6b6b;">Active loans: ' + b.loans.length + '</div>';
    }
    this.content.innerHTML = html;
  }

  _renderJobs() {
    const j = this.jobSystem;
    let html = '<div style="padding:8px 0;font-weight:700;">Jobs</div>';
    html += `<div style="background:#141428;padding:14px;border-radius:10px;margin-bottom:10px;border:1px solid #2a2a4e;">
      <div style="color:#9aa0a6;font-size:12px;">Current</div>
      <div style="font-size:18px;font-weight:700;">${j.statusText}</div>
    </div>`;
    html += '<div style="font-weight:600;margin-bottom:8px;">Available</div>';
    for (const job of j.availableJobs) {
      const ok = j.canTake(job.id);
      html += `<div style="background:#141428;padding:10px;border-radius:8px;margin-bottom:8px;border:1px solid #2a2a4e;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:700;">${job.title}</div>
          <div style="font-size:12px;color:#9aa0a6;">₹${(job.salaryPerDay/100).toLocaleString('en-IN')}/day • ${job.hoursPerDay}h</div>
        </div>
        <button class="phone-btn" ${!ok ? 'disabled' : ''} onclick="window.phoneApp.takeJob('${job.id}')">${ok ? 'Apply' : 'Locked'}</button>
      </div>`;
    }
    if (j.playerJob.id !== 'unemployed') {
      html += `<div style="margin-top:8px;"><button class="phone-btn" onclick="window.phoneApp.quitJob()">Quit Job</button></div>`;
    }
    this.content.innerHTML = html;
  }

  _renderBusinesses() {
    const bs = this.businessSystem;
    let html = '<div style="padding:8px 0;font-weight:700;">Businesses</div>';
    if (bs.businesses.length === 0) {
      html += '<div style="color:#9aa0a6;">No businesses yet. Start one in the city.</div>';
    } else {
      for (const biz of bs.businesses) {
        html += `<div style="background:#141428;padding:12px;border-radius:8px;margin-bottom:8px;border:1px solid #2a2a4e;">
          <div style="font-weight:700;">${biz.name}</div>
          <div style="font-size:12px;color:#9aa0a6;">${biz.categoryName} • ${biz.location}</div>
          <div style="font-size:13px;color:#6ee7b7;">Cash: ₹${(biz.cash/100).toLocaleString('en-IN')}</div>
          <div style="font-size:13px;color:#ffd54f;">Rep: ${biz.reputation}</div>
        </div>`;
      }
    }
    this.content.innerHTML = html;
  }

  _renderStocks() {
    const sm = this.stockMarketSystem;
    let html = '<div style="padding:8px 0;font-weight:700;">Stock Market</div>';
    html += `<div style="color:#9aa0a6;">Phase: <b>${sm.marketPhase}</b> • Portfolio: ₹${(sm.getPortfolioValue()/100).toLocaleString('en-IN')}</div>`;
    if (sm.companies.length === 0) {
      html += '<div style="color:#9aa0a6;margin-top:10px;">No public companies yet.</div>';
    } else {
      for (const c of sm.companies) {
        if (!c.isPublic) continue;
        html += `<div style="background:#141428;padding:10px;border-radius:8px;margin-bottom:8px;border:1px solid #2a2a4e;display:flex;justify-content:space-between;">
          <div>
            <div style="font-weight:700;">${c.symbol}</div>
            <div style="font-size:12px;color:#9aa0a6;">${c.name}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:#6ee7b7;">₹${(c.sharePricePaise/100).toLocaleString('en-IN')}</div>
          </div>
        </div>`;
      }
    }
    this.content.innerHTML = html;
  }

  // Exposed for inline handlers.
  deposit() {
    const amt = prompt('Deposit amount (₹)');
    const v = parseFloat(amt);
    if (!isNaN(v) && v > 0) {
      const r = this.bankingSystem.deposit('state_bank', Math.round(v * 100));
      if (r.ok) { this.uiNotify(`Deposited ₹${v.toLocaleString('en-IN')}`); this.openApp('banking'); }
      else this.uiNotify(r.error, 'error');
    }
  }

  withdraw() {
    const amt = prompt('Withdraw amount (₹)');
    const v = parseFloat(amt);
    if (!isNaN(v) && v > 0) {
      const r = this.bankingSystem.withdraw('state_bank', Math.round(v * 100));
      if (r.ok) { this.uiNotify(`Withdrew ₹${v.toLocaleString('en-IN')}`); this.openApp('banking'); }
      else this.uiNotify(r.error, 'error');
    }
  }

  takeJob(jobId) {
    const r = this.jobSystem.takeJob(jobId);
    if (r.ok) { this.uiNotify(`Hired: ${r.job.title}`); this.openApp('jobs'); }
    else this.uiNotify(r.error, 'error');
  }

  quitJob() {
    this.jobSystem.quit();
    this.uiNotify('Job quit');
    this.openApp('jobs');
  }

  destroy() {
    this.el.remove();
  }
}
