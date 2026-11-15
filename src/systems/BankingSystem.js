/**
 * BankingSystem — player bank accounts, deposits, withdrawals, loans.
 *
 * All amounts are stored in integer paise to avoid floating-point errors.
 * Every transaction is validated and recorded in a statement ledger.
 */

export class BankingSystem {
  constructor() {
    this.banks = [
      { id: 'state_bank', name: 'State Bank of Hindustan', balance: 0, type: 'savings', interestRate: 0.03 },
      { id: 'united_bank', name: 'United Commercial Bank', balance: 0, type: 'current', interestRate: 0.0 },
    ];
    this.loans = [];
    this.transactions = [];
    this.creditScore = 700; // 300-850
    this.nextTransactionId = 1;
  }

  get bank() {
    return this.banks[0]; // primary account
  }

  deposit(bankId, amountPaise) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return { ok: false, error: 'Invalid deposit amount' };
    }
    const bank = this.banks.find((b) => b.id === bankId);
    if (!bank) return { ok: false, error: 'Bank not found' };

    bank.balance += amountPaise;
    this._recordTransaction(bankId, 'deposit', amountPaise);
    return { ok: true, balance: bank.balance };
  }

  withdraw(bankId, amountPaise) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return { ok: false, error: 'Invalid withdrawal amount' };
    }
    const bank = this.banks.find((b) => b.id === bankId);
    if (!bank) return { ok: false, error: 'Bank not found' };
    if (bank.balance < amountPaise) {
      return { ok: false, error: 'Insufficient funds' };
    }

    bank.balance -= amountPaise;
    this._recordTransaction(bankId, 'withdrawal', -amountPaise);
    return { ok: true, balance: bank.balance };
  }

  transfer(fromBankId, toBankId, amountPaise) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return { ok: false, error: 'Invalid transfer amount' };
    }
    const from = this.banks.find((b) => b.id === fromBankId);
    const to = this.banks.find((b) => b.id === toBankId);
    if (!from || !to) return { ok: false, error: 'Bank not found' };
    if (from.balance < amountPaise) return { ok: false, error: 'Insufficient funds' };

    from.balance -= amountPaise;
    to.balance += amountPaise;
    this._recordTransaction(fromBankId, 'transfer_out', -amountPaise, toBankId);
    this._recordTransaction(toBankId, 'transfer_in', amountPaise, fromBankId);
    return { ok: true, fromBalance: from.balance, toBalance: to.balance };
  }

  takeLoan(bankId, amountPaise, months, interestRate = 0.12) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return { ok: false, error: 'Invalid loan amount' };
    }
    // Credit-score based limit.
    const maxLoan = this.creditScore * 1500;
    if (amountPaise > maxLoan) {
      return { ok: false, error: `Loan exceeds credit limit (max ${formatRupees(maxLoan)})` };
    }

    const emi = Math.ceil((amountPaise * (1 + interestRate)) / months);
    const loan = {
      id: Date.now().toString(),
      bankId,
      principal: amountPaise,
      remaining: amountPaise,
      emi,
      monthsRemaining: months,
      interestRate,
    };
    this.loans.push(loan);

    const bank = this.banks.find((b) => b.id === bankId);
    bank.balance += amountPaise;
    this._recordTransaction(bankId, 'loan_disbursal', amountPaise);
    return { ok: true, loan, emi };
  }

  payEMI(loanId, amountPaise) {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, error: 'Loan not found' };
    const bank = this.banks.find((b) => b.id === loan.bankId);
    if (!bank) return { ok: false, error: 'Bank not found' };
    if (bank.balance < amountPaise) return { ok: false, error: 'Insufficient funds' };

    bank.balance -= amountPaise;
    loan.remaining = Math.max(0, loan.remaining - amountPaise);
    loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
    this._recordTransaction(loan.bankId, 'emi_payment', -amountPaise);

    if (loan.remaining <= 0) {
      this.loans = this.loans.filter((l) => l.id !== loanId);
    }
    return { ok: true, loan };
  }

  // Monthly interest + EMI processing. Call once per simulated month.
  tickMonth() {
    const results = [];
    for (const bank of this.banks) {
      if (bank.balance > 0 && bank.interestRate > 0) {
        const interest = Math.floor(bank.balance * (bank.interestRate / 12));
        bank.balance += interest;
        this._recordTransaction(bank.id, 'interest', interest);
        results.push({ bank: bank.id, interest });
      }
    }
    for (const loan of this.loans) {
      const bank = this.banks.find((b) => b.id === loan.bankId);
      if (bank && bank.balance >= loan.emi) {
        bank.balance -= loan.emi;
        loan.remaining = Math.max(0, loan.remaining - loan.emi);
        loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
        this._recordTransaction(loan.bankId, 'emi_auto', -loan.emi);
        if (loan.remaining <= 0) {
          this.loans = this.loans.filter((l) => l.id !== loan.id);
        }
        results.push({ loan: loan.id, emi: loan.emi, auto: true });
      } else {
        // Missed payment hurts credit score.
        this.creditScore = Math.max(300, this.creditScore - 10);
        results.push({ loan: loan.id, missed: true });
      }
    }
    return results;
  }

  _recordTransaction(bankId, type, amount, counterparty = null) {
    this.transactions.push({
      id: this.nextTransactionId++,
      bankId,
      type,
      amount,
      counterparty,
      timestamp: Date.now(),
    });
    if (this.transactions.length > 500) this.transactions.shift();
  }

  getTotalBalance() {
    return this.banks.reduce((sum, b) => sum + b.balance, 0);
  }

  toJSON() {
    return {
      banks: this.banks,
      loans: this.loans,
      transactions: this.transactions.slice(-200),
      creditScore: this.creditScore,
      nextTransactionId: this.nextTransactionId,
    };
  }

  fromJSON(data) {
    if (data.banks) this.banks = data.banks;
    if (data.loans) this.loans = data.loans;
    if (data.transactions) this.transactions = data.transactions;
    if (data.creditScore !== undefined) this.creditScore = data.creditScore;
    if (data.nextTransactionId !== undefined) this.nextTransactionId = data.nextTransactionId;
  }
}

/**
 * Format rupees from integer paise.
 */
export function formatRupees(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}
