/**
 * RivalSystem — independent rival companies with personalities.
 *
 * Rivals make deterministic, personality-driven decisions: expand, take loans,
 * change prices, acquire, go bankrupt. They never copy the player; their
 * strategy depends on resources, personality and opportunity.
 */

const PERSONALITIES = {
  aggressive: { risk: 0.8, expansion: 0.9, priceWar: 0.7, merger: 0.4 },
  cautious: { risk: 0.2, expansion: 0.3, priceWar: 0.1, merger: 0.6 },
  balanced: { risk: 0.5, expansion: 0.5, priceWar: 0.3, merger: 0.5 },
  opportunist: { risk: 0.7, expansion: 0.6, priceWar: 0.5, merger: 0.8 },
};

const RIVAL_NAMES = [
  { company: 'Hindustan Merchants', ceo: 'Arjun Mehta' },
  { company: 'Southern Trade Co.', ceo: 'Priya Nair' },
  { company: 'Northern Industries', ceo: 'Vikram Singh' },
  { company: 'Eastern Logistics', ceo: 'Ananya Das' },
  { company: 'Capital Ventures', ceo: 'Rohan Kapoor' },
  { company: 'Pacific Exports', ceo: 'Kavya Reddy' },
];

export class RivalSystem {
  constructor({ businessSystem, bankingSystem, stockMarketSystem } = {}) {
    this.businessSystem = businessSystem;
    this.bankingSystem = bankingSystem;
    this.stockMarketSystem = stockMarketSystem;

    this.rivals = [];
    this.dayCounter = 0;
    this._seedRivals();
  }

  _seedRivals() {
    let i = 0;
    for (const r of RIVAL_NAMES) {
      const personality = Object.keys(PERSONALITIES)[i % Object.keys(PERSONALITIES).length];
      i++;
      this.rivals.push({
        id: `rival_${Date.now()}_${i}`,
        company: r.company,
        ceo: r.ceo,
        personality,
        traits: PERSONALITIES[personality],
        cash: 2000000 + Math.floor(Math.random() * 5000000), // ₹20-70L
        debt: 0,
        businesses: [],
        properties: [],
        marketShare: Math.random() * 0.2,
        strategy: 'expand',
        loans: [],
        bankrupt: false,
        lastActionDay: 0,
      });
    }
  }

  // Advance one simulated day. Each rival acts based on personality + situation.
  tickDay() {
    this.dayCounter++;
    const results = [];
    for (const rival of this.rivals) {
      if (rival.bankrupt) continue;
      const action = this._decideAction(rival);
      if (action) results.push({ rival: rival.company, ceo: rival.ceo, ...action });
      this._checkBankruptcy(rival);
    }
    return results;
  }

  _decideAction(rival) {
    const t = rival.traits;
    const now = this.dayCounter;
    if (now - rival.lastActionDay < 2) return null; // act every few days
    rival.lastActionDay = now;

    // Roll by personality.
    const roll = Math.random();

    // Loan behavior.
    if (rival.cash < 500000 && roll < t.risk) {
      return this._takeLoan(rival);
    }

    // Expansion.
    if (rival.cash > 1500000 && roll < t.expansion) {
      return this._expand(rival);
    }

    // Price war / competition.
    if (roll < t.priceWar && rival.businesses.length > 0) {
      return { type: 'price_war', target: 'player', impact: 'reduced_profit' };
    }

    // Merger/acquisition.
    if (rival.cash > 5000000 && roll < t.merger) {
      return { type: 'acquire', target: 'small_business', impact: 'market_share_up' };
    }

    // Passive: earn from businesses.
    const earnings = Math.floor(rival.businesses.length * 30000 * (0.8 + Math.random() * 0.4));
    rival.cash += earnings;
    return null;
  }

  _takeLoan(rival) {
    const amount = 1000000 + Math.floor(Math.random() * 3000000);
    rival.cash += amount;
    rival.debt += Math.floor(amount * 1.15);
    rival.loans.push({ amount, remaining: amount, interest: 0.15 });
    return { type: 'loan', amount, impact: 'cash_up_debt_up' };
  }

  _expand(rival) {
    const cost = 1200000 + Math.floor(Math.random() * 2000000);
    if (rival.cash < cost) return null;
    rival.cash -= cost;
    const biz = { name: `Branch ${rival.businesses.length + 1}`, type: 'retail', value: cost };
    rival.businesses.push(biz);
    rival.marketShare = Math.min(0.95, rival.marketShare + 0.02);
    return { type: 'expand', cost, business: biz.name, impact: 'market_share_up' };
  }

  _checkBankruptcy(rival) {
    if (rival.cash < 0 && rival.debt > rival.cash + 1000000) {
      rival.bankrupt = true;
    }
  }

  getRivalDialogue(rivalId) {
    const rival = this.rivals.find((r) => r.id === rivalId);
    if (!rival) return null;
    const p = rival.traits;
    const lines = {
      aggressive: [`"The market belongs to the bold, ${rival.ceo} speaks."`, `"I'll buy out your entire street."`],
      cautious: [`"Slow and steady builds empires."`, `"Debt is a trap I avoid."`],
      balanced: [`"Opportunity favors the prepared."`, `"We grow where it makes sense."`],
      opportunist: [`"When others panic, I buy."`, `"Every crisis is a deal waiting."`],
    };
    const pool = lines[rival.personality] || lines.balanced;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  toJSON() {
    return { rivals: this.rivals, dayCounter: this.dayCounter };
  }

  fromJSON(data) {
    if (data.rivals) this.rivals = data.rivals;
    if (data.dayCounter !== undefined) this.dayCounter = data.dayCounter;
  }
}
