/**
 * BusinessSystem — business creation, employees, inventory, revenue & expenses.
 *
 * Businesses run on actual simulation logic: they buy stock, pay salaries,
 * generate revenue based on reputation and customers, and pay taxes/maintenance.
 * Money is only created via legitimate revenue sources (jobs, business profit).
 */

const CATEGORIES = {
  retail: { name: 'Retail', setupCost: 1500000 },
  food: { name: 'Food & Restaurant', setupCost: 2000000 },
  manufacturing: { name: 'Manufacturing', setupCost: 5000000 },
  transport: { name: 'Transport', setupCost: 3000000 },
};

export class BusinessSystem {
  constructor({ bankingSystem } = {}) {
    this.bankingSystem = bankingSystem;
    this.businesses = [];
    this.nextId = 1;
  }

  createBusiness({ name, category, location, owner, setupCostPaise }) {
    if (!Number.isInteger(setupCostPaise) || setupCostPaise <= 0) {
      return { ok: false, error: 'Invalid setup cost' };
    }

    const cat = CATEGORIES[category] || CATEGORIES.retail;
    const business = {
      id: `biz_${this.nextId++}`,
      name,
      category,
      categoryName: cat.name,
      location,
      owner,
      setupCost: setupCostPaise,
      cash: 0,
      inventory: 0,
      inventoryValue: 0,
      employees: [],
      salaries: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      reputation: 50,
      taxRate: 0.18,
      maintenancePerMonth: setupCostPaise * 0.02,
      createdAt: Date.now(),
      active: true,
    };
    this.businesses.push(business);
    return { ok: true, business };
  }

  // Pay employee salaries from business cash.
  paySalaries() {
    const results = [];
    for (const biz of this.businesses) {
      if (!biz.active) continue;
      const total = biz.salaries;
      if (total <= 0) continue;
      if (biz.cash < total) {
        biz.active = false;
        results.push({ id: biz.id, name: biz.name, error: 'Insufficient funds - business closed' });
        continue;
      }
      biz.cash -= total;
      biz.monthlyExpenses += total;
      results.push({ id: biz.id, name: biz.name, paid: total });
    }
    return results;
  }

  // Simulate one month of business operations.
  tickMonth() {
    const results = [];
    for (const biz of this.businesses) {
      if (!biz.active) continue;

      // Revenue depends on reputation, inventory and a demand factor.
      const demandFactor = 0.6 + Math.random() * 0.8;
      const revenue = Math.floor(
        biz.reputation * 250 * demandFactor * (1 + biz.employees.length * 0.2)
      );

      // Cost of goods sold from inventory.
      const cogs = Math.floor(revenue * 0.55);
      biz.inventoryValue = Math.max(0, biz.inventoryValue - cogs);
      biz.inventory = Math.max(0, biz.inventory - cogs / 1000);

      // Expenses: salaries + maintenance.
      const maintenance = Math.floor(biz.maintenancePerMonth);
      const taxes = Math.floor(revenue * biz.taxRate);
      const expenses = biz.salaries + maintenance + taxes;

      const profit = revenue - expenses;
      biz.cash += profit;
      biz.monthlyRevenue = revenue;
      biz.monthlyExpenses = expenses;

      // Reputation drifts slightly based on profit.
      biz.reputation = Math.min(100, Math.max(0, biz.reputation + (profit > 0 ? 1 : -2)));

      results.push({
        id: biz.id,
        name: biz.name,
        revenue,
        expenses,
        profit,
        cash: biz.cash,
        reputation: biz.reputation,
      });
    }
    return results;
  }

  restock(bizId, amountPaise) {
    const biz = this.businesses.find((b) => b.id === bizId);
    if (!biz) return { ok: false, error: 'Business not found' };
    if (biz.cash < amountPaise) return { ok: false, error: 'Insufficient business cash' };
    biz.cash -= amountPaise;
    biz.inventoryValue += amountPaise;
    biz.inventory += amountPaise / 1000;
    return { ok: true, cash: biz.cash, inventoryValue: biz.inventoryValue };
  }

  hire(bizId, salaryPerMonth) {
    const biz = this.businesses.find((b) => b.id === bizId);
    if (!biz) return { ok: false, error: 'Business not found' };
    if (!Number.isInteger(salaryPerMonth) || salaryPerMonth <= 0) {
      return { ok: false, error: 'Invalid salary' };
    }
    biz.employees.push({ salaryPerMonth, hiredAt: Date.now() });
    biz.salaries += salaryPerMonth;
    return { ok: true, employees: biz.employees.length, salaries: biz.salaries };
  }

  toJSON() {
    return { businesses: this.businesses, nextId: this.nextId };
  }

  fromJSON(data) {
    if (data.businesses) this.businesses = data.businesses;
    if (data.nextId !== undefined) this.nextId = data.nextId;
  }
}
