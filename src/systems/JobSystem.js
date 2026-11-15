/**
 * JobSystem — employment, salary, skills and promotions.
 *
 * Jobs are the legitimate source of income early game. Salary is paid per
 * simulated work day based on the job's working hours and performance.
 */

const JOBS = {
  unemployed: {
    id: 'unemployed',
    title: 'Unemployed',
    salaryPerDay: 0,
    hoursPerDay: 0,
    requirements: {},
    skill: 'none',
    level: 0,
    description: 'Looking for work.',
  },
  shop_worker: {
    id: 'shop_worker',
    title: 'Shop Worker',
    salaryPerDay: 120000, // ₹1,200
    hoursPerDay: 8,
    requirements: { education: 0 },
    skill: 'retail',
    level: 1,
    description: 'Stock shelves and serve customers at the marketplace.',
  },
  delivery_worker: {
    id: 'delivery_worker',
    title: 'Delivery Worker',
    salaryPerDay: 160000, // ₹1,600
    hoursPerDay: 8,
    requirements: { vehicle: false },
    skill: 'logistics',
    level: 1,
    description: 'Deliver packages across the city.',
  },
  restaurant_employee: {
    id: 'restaurant_employee',
    title: 'Restaurant Employee',
    salaryPerDay: 140000, // ₹1,400
    hoursPerDay: 8,
    requirements: {},
    skill: 'hospitality',
    level: 1,
    description: 'Cook and serve food at a local restaurant.',
  },
  office_employee: {
    id: 'office_employee',
    title: 'Office Employee',
    salaryPerDay: 240000, // ₹2,400
    hoursPerDay: 8,
    requirements: { education: 1 },
    skill: 'admin',
    level: 1,
    description: 'Administrative work in the commercial district.',
  },
  factory_worker: {
    id: 'factory_worker',
    title: 'Factory Worker',
    salaryPerDay: 180000, // ₹1,800
    hoursPerDay: 9,
    requirements: {},
    skill: 'manufacturing',
    level: 1,
    description: 'Assembly line work in the industrial district.',
  },
  driver: {
    id: 'driver',
    title: 'Driver',
    salaryPerDay: 200000, // ₹2,000
    hoursPerDay: 10,
    requirements: { vehicle: true },
    skill: 'driving',
    level: 1,
    description: 'Drive trucks and buses for transport companies.',
  },
  security_guard: {
    id: 'security_guard',
    title: 'Security Guard',
    salaryPerDay: 170000, // ₹1,700
    hoursPerDay: 10,
    requirements: {},
    skill: 'security',
    level: 1,
    description: 'Guard shops and offices at night.',
  },
  salesperson: {
    id: 'salesperson',
    title: 'Salesperson',
    salaryPerDay: 220000, // ₹2,200
    hoursPerDay: 8,
    requirements: { skill: 'retail', level: 2 },
    skill: 'sales',
    level: 2,
    description: 'Sell goods and manage customer relationships.',
  },
  technician: {
    id: 'technician',
    title: 'Technician',
    salaryPerDay: 260000, // ₹2,600
    hoursPerDay: 8,
    requirements: { education: 1 },
    skill: 'technology',
    level: 2,
    description: 'Maintain equipment and systems.',
  },
  manager: {
    id: 'manager',
    title: 'Manager',
    salaryPerDay: 400000, // ₹4,000
    hoursPerDay: 9,
    requirements: { skill: 'admin', level: 3 },
    skill: 'management',
    level: 3,
    description: 'Manage a business or department.',
  },
};

const PROMOTIONS = {
  shop_worker: 'salesperson',
  salesperson: 'manager',
  restaurant_employee: 'manager',
  factory_worker: 'technician',
  technician: 'manager',
  delivery_worker: 'driver',
  driver: 'manager',
  office_employee: 'manager',
  security_guard: 'manager',
};

export class JobSystem {
  constructor({ bankingSystem, timeSystem, needsSystem } = {}) {
    this.bankingSystem = bankingSystem;
    this.timeSystem = timeSystem;
    this.needsSystem = needsSystem;

    this.playerJob = JOBS.unemployed;
    this.playerSkills = { retail: 0, logistics: 0, hospitality: 0, admin: 0, manufacturing: 0, driving: 0, security: 0, sales: 0, technology: 0, management: 0 };
    this.education = 0; // 0 = none, 1 = basic, 2 = advanced
    this.ownedVehicle = false;
    this.workSecondsToday = 0;
    this.lastPayDay = 0; // simulation day last paid
    this.employer = null;
  }

  get availableJobs() {
    return Object.values(JOBS).filter((j) => j.id !== 'unemployed');
  }

  getJob(id) {
    return JOBS[id] || JOBS.unemployed;
  }

  canTake(jobId) {
    const job = this.getJob(jobId);
    const req = job.requirements;
    if (req.education !== undefined && this.education < req.education) return false;
    if (req.vehicle !== undefined && this.ownedVehicle !== req.vehicle) return false;
    if (req.skill !== undefined) {
      const lvl = this.playerSkills[req.skill] || 0;
      if (lvl < (req.level || 1)) return false;
    }
    return true;
  }

  takeJob(jobId, employer = null) {
    const job = this.getJob(jobId);
    if (!this.canTake(jobId)) {
      return { ok: false, error: 'Requirements not met' };
    }
    this.playerJob = job;
    this.employer = employer;
    this.workSecondsToday = 0;
    return { ok: true, job };
  }

  quit() {
    this.playerJob = JOBS.unemployed;
    this.employer = null;
    this.workSecondsToday = 0;
    return { ok: true };
  }

  // Work one simulated minute. Returns earnings accrued this minute.
  workMinute() {
    const job = this.playerJob;
    if (job.id === 'unemployed') return 0;

    this.workSecondsToday += 60;
    const dailyMinutes = job.hoursPerDay * 60;
    const fraction = Math.min(1, this.workSecondsToday / 60 / dailyMinutes);
    const payThisMinute = (job.salaryPerDay / dailyMinutes) * fraction;

    // Skill gain while working.
    if (job.skill !== 'none') {
      this.playerSkills[job.skill] = Math.min(10, (this.playerSkills[job.skill] || 0) + 0.02);
    }

    // Needs drain while working.
    if (this.needsSystem) {
      this.needsSystem.hunger = Math.max(0, this.needsSystem.hunger - 0.03);
      this.needsSystem.thirst = Math.max(0, this.needsSystem.thirst - 0.04);
      this.needsSystem.energy = Math.max(0, this.needsSystem.energy - 0.05);
    }

    return Math.floor(payThisMinute * 100) / 100; // paise fraction
  }

  // Pay accumulated wages into bank/cash at end of work day.
  payDay(playerMoney) {
    const job = this.playerJob;
    if (job.id === 'unemployed') return { paid: 0 };

    const earned = Math.floor((this.workSecondsToday / 60 / (job.hoursPerDay * 60)) * job.salaryPerDay);
    this.workSecondsToday = 0;
    if (this.bankingSystem && earned > 0) {
      this.bankingSystem.deposit('state_bank', earned);
    }
    return { paid: earned, job: job.title };
  }

  promote() {
    const nextId = PROMOTIONS[this.playerJob.id];
    if (!nextId) return { ok: false, error: 'No promotion path' };
    const next = this.getJob(nextId);
    if (!this.canTake(nextId)) {
      return { ok: false, error: 'Requirements not met for promotion' };
    }
    this.playerJob = next;
    return { ok: true, job: next };
  }

  get statusText() {
    const j = this.playerJob;
    if (j.id === 'unemployed') return 'Unemployed';
    return `${j.title} • ₹${(j.salaryPerDay / 100).toLocaleString('en-IN')}/day`;
  }

  toJSON() {
    return {
      playerJob: this.playerJob.id,
      playerSkills: this.playerSkills,
      education: this.education,
      ownedVehicle: this.ownedVehicle,
      workSecondsToday: this.workSecondsToday,
      lastPayDay: this.lastPayDay,
      employer: this.employer,
    };
  }

  fromJSON(data) {
    if (data.playerJob) this.playerJob = this.getJob(data.playerJob);
    if (data.playerSkills) this.playerSkills = { ...this.playerSkills, ...data.playerSkills };
    if (data.education !== undefined) this.education = data.education;
    if (data.ownedVehicle !== undefined) this.ownedVehicle = data.ownedVehicle;
    if (data.workSecondsToday !== undefined) this.workSecondsToday = data.workSecondsToday;
    if (data.lastPayDay !== undefined) this.lastPayDay = data.lastPayDay;
    if (data.employer !== undefined) this.employer = data.employer;
  }
}
