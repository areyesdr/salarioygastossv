import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPayroll,
  calcISR,
  calcVacation,
  calcAguinaldo,
  calcQuincena25,
  calcHourlyAndOvertime,
  MINIMUM_WAGES_2026,
} from './svLaborLaw.ts';
import {
  canAccessPrivateRoute,
  canAccessAdminRoute,
  verifyResourceOwnership,
  filterOwnedResources,
  type SessionUser,
} from './security.ts';

describe('El Salvador Labor & Tax Law Calculations (2026-2027)', () => {
  it('calculates minimum wage ($408.80 comercio) deductions with Tramo I (Exento ISR)', () => {
    const res = calcPayroll(MINIMUM_WAGES_2026.comercio.monthly, 'monthly');
    // AFP = 408.80 * 0.0725 = 29.64
    assert.equal(res.afpEmployee, 29.64);
    // ISSS = 408.80 * 0.03 = 12.26
    assert.equal(res.isssEmployee, 12.26);
    // Gravada = 408.80 - 29.64 - 12.26 = 366.90 (<= 550.00 -> Exento)
    assert.equal(res.taxableIncome, 366.9);
    assert.equal(res.isrDetail.bracketId, 'I');
    assert.equal(res.isr, 0);
    assert.equal(res.netPay, 366.9);
  });

  it('calculates $800.00 monthly salary in Tramo II (10%)', () => {
    const res = calcPayroll(800, 'monthly');
    // AFP = 58.00, ISSS = 24.00, Gravada = 718.00
    assert.equal(res.afpEmployee, 58.0);
    assert.equal(res.isssEmployee, 24.0);
    assert.equal(res.taxableIncome, 718.0);
    // ISR = 17.67 + (718.00 - 550.00) * 0.10 = 17.67 + 16.80 = 34.47
    assert.equal(res.isrDetail.bracketId, 'II');
    assert.equal(res.isr, 34.47);
    assert.equal(res.netPay, 683.53);
  });

  it('caps ISSS at $30.00 monthly ($1,000 ceiling) and calculates Tramo III / IV ISR', () => {
    const res1200 = calcPayroll(1200, 'monthly');
    assert.equal(res1200.isssEmployee, 30.0);
    assert.equal(res1200.isssCapped, true);
    assert.equal(res1200.isssEmployer, 75.0);
    // AFP = 87.00, ISSS = 30.00 -> Gravada = 1083.00 (Tramo III: 60 + (1083 - 895.24)*0.20 = 97.55)
    assert.equal(res1200.taxableIncome, 1083.0);
    assert.equal(res1200.isrDetail.bracketId, 'III');
    assert.equal(res1200.isr, 97.55);
    assert.equal(res1200.netPay, 985.45);

    const res3000 = calcISR(2500, 'monthly');
    assert.equal(res3000.bracketId, 'IV');
    // 288.57 + (2500 - 2038.10) * 0.30 = 288.57 + 138.57 = 427.14
    assert.equal(res3000.isr, 427.14);
  });

  it('calculates Vacation 15 days + 30% bonus accurately', () => {
    const vac = calcVacation(1000, 30);
    // 15 days = 500.00, 30% bonus = 150.00, total complete = 650.00
    assert.equal(vac.base15DaysGross, 500.0);
    assert.equal(vac.bonus30Gross, 150.0);
    assert.equal(vac.completeVacationGross, 650.0);
    assert.equal(vac.splits.length, 3);
    assert.equal(vac.splits[0].bonus30Part, 50.0);
  });

  it('calculates Aguinaldo by seniority and proportional days, applying $1,500 ISR exemption', () => {
    const ag1to3 = calcAguinaldo({ monthlySalary: 900, seniorityBracket: '1-to-3' });
    assert.equal(ag1to3.grossAguinaldo, 450.0);
    assert.equal(ag1to3.isrWithheld, 0);
    assert.equal(ag1to3.netAguinaldo, 450.0);

    const ag3to10 = calcAguinaldo({ monthlySalary: 900, seniorityBracket: '3-to-10' });
    // 900 / 30 * 19 = 570
    assert.equal(ag3to10.grossAguinaldo, 570.0);

    const ag10Plus = calcAguinaldo({ monthlySalary: 3000, seniorityBracket: '10-plus' });
    // 3000 / 30 * 21 = 2100 -> 1500 exempt, 600 taxable excess
    assert.equal(ag10Plus.grossAguinaldo, 2100.0);
    assert.equal(ag10Plus.exemptAmount, 1500.0);
    assert.equal(ag10Plus.taxableExcess, 600.0);
    assert.ok(ag10Plus.isrWithheld > 0);
  });

  it('calculates Quincena 25 (Decreto 499, mandatory 2027) with $1,500 cap and 0 deductions', () => {
    const qEligible = calcQuincena25({ monthlySalary: 1200, isFullYear: true });
    assert.equal(qEligible.eligibleByLaw, true);
    assert.equal(qEligible.grossQuincena25, 600.0);
    assert.equal(qEligible.afp, 0);
    assert.equal(qEligible.isss, 0);
    assert.equal(qEligible.isr, 0);
    assert.equal(qEligible.netQuincena25, 600.0);

    const qAboveCap = calcQuincena25({ monthlySalary: 1600, isFullYear: true });
    assert.equal(qAboveCap.eligibleByLaw, false);
    assert.equal(qAboveCap.netQuincena25, 0);

    const qProportional = calcQuincena25({
      monthlySalary: 1000,
      isFullYear: false,
      daysWorkedToJan25: 183,
    });
    assert.equal(qProportional.eligibleByLaw, true);
    assert.equal(qProportional.netQuincena25, 250.68);
  });

  it('calculates hourly cost and overtime multipliers accurately', () => {
    const hr = calcHourlyAndOvertime(1200, 985.45, 30, 8);
    assert.equal(hr.grossDaily, 40.0);
    assert.equal(hr.grossHourly, 5.0);
    const extraDay = hr.overtimeRates.find((r) => r.id === 'extra_day');
    const extraNight = hr.overtimeRates.find((r) => r.id === 'extra_night');
    assert.equal(extraDay?.hourlyRateUsd, 10.0);
    assert.equal(extraNight?.hourlyRateUsd, 11.25);
  });

  it('enforces RBAC route permissions and ID Matching ownership on financial records', () => {
    const anonUser: SessionUser | null = null;
    const regularUser: SessionUser = {
      id: 'usr-sv-01',
      name: 'Axel Reyes',
      email: 'axel.f.reyes.a@gmail.com',
      loggedIn: true,
      role: 'user',
      acceptedTermsAt: '2026-10-26T18:00:00Z',
    };
    const adminUser: SessionUser = {
      id: 'usr-admin-01',
      name: 'Admin',
      email: 'admin@salarioygastossv.com',
      loggedIn: true,
      role: 'admin',
      acceptedTermsAt: '2026-10-26T18:00:00Z',
    };

    assert.equal(canAccessPrivateRoute(anonUser), false);
    assert.equal(canAccessPrivateRoute(regularUser), true);
    assert.equal(canAccessAdminRoute(regularUser), false);
    assert.equal(canAccessAdminRoute(adminUser), true);

    const sampleRecords = [
      { id: 'exp-101', ownerId: 'usr-sv-01', amount: 150 },
      { id: 'exp-102', ownerId: 'usr-other-99', amount: 500 },
    ];

    assert.equal(verifyResourceOwnership(sampleRecords[0], regularUser), true);
    assert.equal(verifyResourceOwnership(sampleRecords[1], regularUser), false);
    const visibleToRegular = filterOwnedResources(sampleRecords, regularUser);
    assert.equal(visibleToRegular.length, 1);
    assert.equal(visibleToRegular[0].id, 'exp-101');
  });
});
