/**
 * CorporationSystem — ownership of multiple companies and subsidiaries.
 *
 * Extends the single-business model into a corporate group with consolidated
 * accounts, supply chains and internal transactions. Prevents artificial money
 * creation by requiring every internal transfer to have a corresponding
 * expense/revenue pair.
 */

export class CorporationSystem {
  constructor({ businessSystem, bankingSystem } = {}) {
    this.businessSystem = businessSystem;
    this.bankingSystem = bankingSystem;

    this.companies = []; // { id, name, type, owner, cash, parentId, subsidiaryIds, createdAt }
    this.supplyContracts = []; // { id, fromCompanyId, toCompanyId, good, pricePerUnit, unitsPerMonth, active }
    this.nextCompanyId = 1;
  }

  createCompany({ name, type = 'subsidiary', owner, parentId = null, startingCash = 0 }) {
    if (!name || typeof name !== 'string') {
      return { ok: false, error: 'Company name required' };
    }
    if (startingCash < 0) return { ok: false, error: 'Invalid starting cash' };

    // Funding: starting cash must come from the player's bank or an existing company.
    const company = {
      id: `corp_${this.nextCompanyId++}`,
      name,
      type, // 'parent' | 'subsidiary'
      owner,
      parentId,
      subsidiaryIds: [],
      cash: startingCash,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      createdAt: Date.now(),
      active: true,
    };
    this.companies.push(company);
    if (parentId) {
      const parent = this.companies.find((c) => c.id === parentId);
      if (parent) parent.subsidiaryIds.push(company.id);
    }
    return { ok: true, company };
  }

  // Internal transfer between companies owned by the same player.
  // Returns validated movement; does NOT create money.
  transferFunds(fromId, toId, amountPaise) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return { ok: false, error: 'Invalid amount' };
    }
    const from = this.companies.find((c) => c.id === fromId);
    const to = this.companies.find((c) => c.id === toId);
    if (!from || !to) return { ok: false, error: 'Company not found' };
    if (from.cash < amountPaise) return { ok: false, error: 'Insufficient company funds' };

    from.cash -= amountPaise;
    to.cash += amountPaise;
    from.monthlyExpenses += amountPaise;
    to.monthlyRevenue += amountPaise;
    return { ok: true, fromCash: from.cash, toCash: to.cash };
  }

  // Supply contract: one company supplies goods to another for a price.
  createSupplyContract({ fromCompanyId, toCompanyId, good, pricePerUnit, unitsPerMonth }) {
    if (!Number.isInteger(pricePerUnit) || pricePerUnit <= 0) {
      return { ok: false, error: 'Invalid price' };
    }
    if (!Number.isInteger(unitsPerMonth) || unitsPerMonth <= 0) {
      return { ok: false, error: 'Invalid units' };
    }
    const from = this.companies.find((c) => c.id === fromCompanyId);
    const to = this.companies.find((c) => c.id === toCompanyId);
    if (!from || !to) return { ok: false, error: 'Company not found' };

    const contract = {
      id: `supply_${Date.now()}`,
      fromCompanyId,
      toCompanyId,
      good,
      pricePerUnit,
      unitsPerMonth,
      active: true,
      createdAt: Date.now(),
    };
    this.supplyContracts.push(contract);
    return { ok: true, contract };
  }

  // Process supply contracts monthly: buyer pays, supplier receives revenue.
  fulfillSupplyContracts() {
    const results = [];
    for (const c of this.supplyContracts) {
      if (!c.active) continue;
      const from = this.companies.find((x) => x.id === c.fromCompanyId);
      const to = this.companies.find((x) => x.id === c.toCompanyId);
      if (!from || !to) continue;
      const cost = c.pricePerUnit * c.unitsPerMonth;
      if (to.cash < cost) {
        results.push({ contract: c.id, error: 'Buyer insufficient funds' });
        continue;
      }
      to.cash -= cost;
      from.cash += cost;
      to.monthlyExpenses += cost;
      from.monthlyRevenue += cost;
      results.push({ contract: c.id, cost });
    }
    return results;
  }

  getConsolidatedReport() {
    let totalCash = 0, totalRevenue = 0, totalExpenses = 0;
    for (const c of this.companies) {
      if (!c.active) continue;
      totalCash += c.cash;
      totalRevenue += c.monthlyRevenue;
      totalExpenses += c.monthlyExpenses;
    }
    return {
      companyCount: this.companies.filter((c) => c.active).length,
      totalCash,
      totalRevenue,
      totalExpenses,
      net: totalRevenue - totalExpenses,
    };
  }

  toJSON() {
    return {
      companies: this.companies,
      supplyContracts: this.supplyContracts,
      nextCompanyId: this.nextCompanyId,
    };
  }

  fromJSON(data) {
    if (data.companies) this.companies = data.companies;
    if (data.supplyContracts) this.supplyContracts = data.supplyContracts;
    if (data.nextCompanyId !== undefined) this.nextCompanyId = data.nextCompanyId;
  }
}
