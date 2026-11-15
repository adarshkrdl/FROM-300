/**
 * StockMarketSystem — public companies, shares, trading and market events.
 *
 * Share prices respond to company performance, demand and market trends.
 * All share quantities and prices are integer-safe (paise per share).
 */

const MARKET_EVENTS = ['bull', 'bear', 'crash', 'stable'];

export class StockMarketSystem {
  constructor({ businessSystem, corporationSystem } = {}) {
    this.businessSystem = businessSystem;
    this.corporationSystem = corporationSystem;

    this.companies = []; // { id, symbol, name, totalShares, sharePricePaise, ownerShares, ipoPrice, public: bool, sector, performance }
    this.playerPortfolio = []; // { companyId, shares, averagePricePaise }
    this.tradeHistory = [];
    this.marketPhase = 'stable'; // bull | bear | crash | stable
    this.dayCounter = 0;
    this.nextCompanyId = 1;
  }

  registerCompany({ id, symbol, name, totalShares, ipoPricePaise, sector = 'general', isPublic = true }) {
    if (this.companies.find((c) => c.id === id)) return { ok: false, error: 'Company exists' };
    if (!Number.isInteger(totalShares) || totalShares <= 0) return { ok: false, error: 'Invalid shares' };
    if (!Number.isInteger(ipoPricePaise) || ipoPricePaise <= 0) return { ok: false, error: 'Invalid IPO price' };

    const company = {
      id,
      symbol,
      name,
      totalShares,
      sharePricePaise: ipoPricePaise,
      ipoPricePaise,
      ownerShares: totalShares, // initially owned by the company/founder
      isPublic,
      sector,
      performance: 1.0, // 0.5..2.0 multiplier
      marketCap: totalShares * ipoPricePaise,
    };
    this.companies.push(company);
    return { ok: true, company };
  }

  ipo({ companyId, founder, sharesToPublic, pricePaise, bankingSystem }) {
    const company = this.companies.find((c) => c.id === companyId);
    if (!company) return { ok: false, error: 'Company not found' };
    if (!company.isPublic) return { ok: false, error: 'Not a public company' };
    if (!Number.isInteger(sharesToPublic) || sharesToPublic <= 0 || sharesToPublic > company.totalShares) {
      return { ok: false, error: 'Invalid shares to public' };
    }
    if (!Number.isInteger(pricePaise) || pricePaise <= 0) return { ok: false, error: 'Invalid price' };

    const proceeds = sharesToPublic * pricePaise;
    // Founder receives proceeds (legitimate source of money).
    if (bankingSystem) bankingSystem.deposit('state_bank', proceeds);

    company.sharePricePaise = pricePaise;
    company.ipoPricePaise = pricePaise;
    company.ownerShares -= sharesToPublic;
    company.marketCap = company.totalShares * pricePaise;

    this.tradeHistory.push({
      type: 'ipo',
      companyId,
      shares: sharesToPublic,
      pricePaise,
      proceeds,
      timestamp: Date.now(),
    });
    return { ok: true, proceeds, company };
  }

  buyShares({ companyId, shares, playerMoneyPaise, bankingSystem }) {
    if (!Number.isInteger(shares) || shares <= 0) return { ok: false, error: 'Invalid shares' };
    const company = this.companies.find((c) => c.id === companyId);
    if (!company) return { ok: false, error: 'Company not found' };
    if (!company.isPublic) return { ok: false, error: 'Not publicly traded' };

    const cost = company.sharePricePaise * shares;
    if (playerMoneyPaise < cost) return { ok: false, error: 'Insufficient funds' };

    const holding = this.playerPortfolio.find((p) => p.companyId === companyId);
    if (holding) {
      const totalCost = holding.averagePricePaise * holding.shares + cost;
      holding.shares += shares;
      holding.averagePricePaise = Math.floor(totalCost / holding.shares);
    } else {
      this.playerPortfolio.push({ companyId, shares, averagePricePaise: company.sharePricePaise });
    }

    company.ownerShares -= shares;
    this.tradeHistory.push({ type: 'buy', companyId, shares, pricePaise: company.sharePricePaise, cost, timestamp: Date.now() });
    return { ok: true, cost, remaining: playerMoneyPaise - cost };
  }

  sellShares({ companyId, shares }) {
    if (!Number.isInteger(shares) || shares <= 0) return { ok: false, error: 'Invalid shares' };
    const holding = this.playerPortfolio.find((p) => p.companyId === companyId);
    if (!holding || holding.shares < shares) return { ok: false, error: 'Not enough shares' };

    const company = this.companies.find((c) => c.id === companyId);
    const price = company ? company.sharePricePaise : 0;
    const proceeds = price * shares;

    holding.shares -= shares;
    if (holding.shares <= 0) {
      this.playerPortfolio = this.playerPortfolio.filter((p) => p.companyId !== companyId);
    }
    if (company) company.ownerShares += shares;

    this.tradeHistory.push({ type: 'sell', companyId, shares, pricePaise: price, proceeds, timestamp: Date.now() });
    return { ok: true, proceeds };
  }

  getPortfolioValue() {
    let value = 0;
    for (const h of this.playerPortfolio) {
      const c = this.companies.find((x) => x.id === h.companyId);
      if (c) value += c.sharePricePaise * h.shares;
    }
    return value;
  }

  // Advance one simulated day: apply market phase + company performance to prices.
  tickDay() {
    this.dayCounter++;
    const phase = this.marketPhase;
    const phaseMultiplier = { bull: 1.02, bear: 0.98, crash: 0.88, stable: 1.0 }[phase] || 1.0;

    const results = [];
    for (const company of this.companies) {
      if (!company.isPublic) continue;

      // Performance drift based on business results if linked.
      let perfDelta = (Math.random() - 0.5) * 0.06; // -3%..+3%
      perfDelta *= phaseMultiplier;

      company.performance = Math.max(0.3, Math.min(3.0, company.performance + perfDelta));
      const newPrice = Math.max(10, Math.floor(company.sharePricePaise * (1 + perfDelta * company.performance)));
      const oldPrice = company.sharePricePaise;
      company.sharePricePaise = newPrice;
      company.marketCap = company.totalShares * newPrice;

      results.push({ companyId: company.id, symbol: company.symbol, oldPrice, newPrice });
    }

    // Occasionally shift market phase.
    if (this.dayCounter % 7 === 0) {
      const roll = Math.random();
      if (roll < 0.1) this.marketPhase = 'crash';
      else if (roll < 0.3) this.marketPhase = 'bear';
      else if (roll < 0.7) this.marketPhase = 'bull';
      else this.marketPhase = 'stable';
    }

    return { phase: this.marketPhase, results };
  }

  setMarketPhase(phase) {
    if (MARKET_EVENTS.includes(phase)) this.marketPhase = phase;
  }

  toJSON() {
    return {
      companies: this.companies,
      playerPortfolio: this.playerPortfolio,
      tradeHistory: this.tradeHistory.slice(-300),
      marketPhase: this.marketPhase,
      dayCounter: this.dayCounter,
      nextCompanyId: this.nextCompanyId,
    };
  }

  fromJSON(data) {
    if (data.companies) this.companies = data.companies;
    if (data.playerPortfolio) this.playerPortfolio = data.playerPortfolio;
    if (data.tradeHistory) this.tradeHistory = data.tradeHistory;
    if (data.marketPhase) this.marketPhase = data.marketPhase;
    if (data.dayCounter !== undefined) this.dayCounter = data.dayCounter;
    if (data.nextCompanyId !== undefined) this.nextCompanyId = data.nextCompanyId;
  }
}
