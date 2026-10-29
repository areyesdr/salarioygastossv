import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPayroll,
  calcISR,
  calcVacation,
  calcAguinaldo,
  calcQuincena25,
  calcHourlyAndOvertime,
  calcSeniorityFromHireDate,
  calcIncapacity,
  calcIncapacitySplitQuincenas,
  calcLiquidacion,
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
    const ordinaryNight = hr.overtimeRates.find((r) => r.id === 'ordinary_night');
    const extraDay = hr.overtimeRates.find((r) => r.id === 'extra_day');
    const extraNight = hr.overtimeRates.find((r) => r.id === 'extra_night');
    assert.equal(ordinaryNight?.hourlyRateUsd, 6.25); // 5.0 * 1.25 = 6.25 (Art. 168 CT)
    assert.equal(extraDay?.hourlyRateUsd, 10.0);
    assert.equal(extraNight?.hourlyRateUsd, 11.25);
  });

  it('enforces RBAC route permissions and ID Matching ownership on financial records', () => {
    const anonUser: SessionUser | null = null;
    const regularUser: SessionUser = {
      id: 'usr-sv-01',
      name: 'Usuario SV',
      email: 'usuario@salariosv.com',
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

  it('synchronizes biweekly and monthly calculations with zero cent discrepancy (odd-cent legal adjustment)', () => {
    // Para $944.19 mensual: Neto mensual debe ser $800.00 y neto quincenal debe ser $400.00 exacto
    const monthly = calcPayroll(944.19, 'monthly');
    const biweekly = calcPayroll(944.19, 'biweekly');

    assert.equal(monthly.netPay, 800.0);
    assert.equal(biweekly.netPay, 400.0);

    const details = biweekly.quincenaDetails;
    assert.ok(details);
    assert.equal(details.hasOddCentAdjustment, true);

    // Q1 = $472.09 bruto, $72.09 deds, $400.00 neto
    assert.equal(details.q1.grossTotal, 472.09);
    assert.equal(details.q1.netPay, 400.0);

    // Q2 = $472.10 bruto (absorbe centavo), $72.10 deds, $400.00 neto
    assert.equal(details.q2.grossTotal, 472.1);
    assert.equal(details.q2.netPay, 400.0);

    // Q1 + Q2 cuadra exactamente con el consolidado mensual
    assert.equal(details.q1.grossTotal + details.q2.grossTotal, 944.19);
    assert.equal(details.q1.netPay + details.q2.netPay, 800.0);
    assert.equal(details.q1.totalEmployeeDeductions + details.q2.totalEmployeeDeductions, monthly.totalEmployeeDeductions);
  });

  it('calculates exact seniority, aguinaldo bracket and proportional days from hire date', () => {
    // Caso 1: Trabajador con más de 3 años al 12 dic 2026
    const res3Years = calcSeniorityFromHireDate('2023-01-15', '2026-10-26');
    assert.equal(res3Years.years, 3);
    assert.equal(res3Years.months, 9);
    assert.equal(res3Years.currentSeniorityBracket, '3-to-10');
    assert.equal(res3Years.aguinaldoSeniorityBracket, '3-to-10');
    assert.equal(res3Years.aguinaldoDaysWorked, 365);
    assert.equal(res3Years.isEligibleForRenunciaVoluntaria, true);

    // Caso 2: Trabajador que ingresó el 1 de julio de 2026 (menos de 1 año)
    const resUnder1 = calcSeniorityFromHireDate('2026-07-01', '2026-10-26');
    assert.equal(resUnder1.years, 0);
    assert.equal(resUnder1.months, 3);
    assert.equal(resUnder1.currentSeniorityBracket, 'under-1');
    assert.equal(resUnder1.aguinaldoSeniorityBracket, 'under-1');
    // Días desde 2026-07-01 hasta 2026-12-12 = 31 (jul) + 31 (ago) + 30 (sep) + 31 (oct) + 30 (nov) + 12 (dic) = 165 días
    assert.equal(resUnder1.aguinaldoDaysWorked, 165);
    assert.equal(resUnder1.isEligibleForRenunciaVoluntaria, false);

    // Caso 3: Trabajador con más de 10 años
    const res10Plus = calcSeniorityFromHireDate('2014-03-01', '2026-10-26');
    assert.equal(res10Plus.years, 12);
    assert.equal(res10Plus.currentSeniorityBracket, '10-plus');
    assert.equal(res10Plus.aguinaldoSeniorityBracket, '10-plus');
    assert.equal(res10Plus.isEligibleForVacation, true);
  });

  it('calculates medical incapacities according to ISSS and Labor Code', () => {
    // Caso 1: Enfermedad común de 3 días con salario de $600/mes ($20/día)
    // Días 1 a 3 a cargo del patrono al 75% ($15/día). ISSS = $0
    const res3Days = calcIncapacity({
      monthlySalary: 600,
      days: 3,
      type: 'common_illness',
    });
    assert.equal(res3Days.employerDays, 3);
    assert.equal(res3Days.isssDays, 0);
    assert.equal(res3Days.employerDailyAmount, 15.0);
    assert.equal(res3Days.employerTotalPay, 45.0);
    assert.equal(res3Days.isssTotalSubsidio, 0.0);
    assert.equal(res3Days.totalIncapacityPay, 45.0);
    assert.equal(res3Days.regularEquivalentGross, 60.0);
    assert.equal(res3Days.wageLoss, 15.0);

    // Caso 2: Enfermedad común de 10 días con salario de $600/mes ($20/día)
    // Días 1 a 3 patrono al 75% = 3 * $15 = $45
    // Días 4 a 10 (7 días) ISSS al 75% = 7 * $15 = $105
    const res10Days = calcIncapacity({
      monthlySalary: 600,
      days: 10,
      type: 'common_illness',
    });
    assert.equal(res10Days.employerDays, 3);
    assert.equal(res10Days.isssDays, 7);
    assert.equal(res10Days.employerTotalPay, 45.0);
    assert.equal(res10Days.isssDailySubsidio, 15.0);
    assert.equal(res10Days.isssTotalSubsidio, 105.0);
    assert.equal(res10Days.totalIncapacityPay, 150.0);

    // Caso 3: Salario alto ($1,500/mes) que supera el tope del ISSS ($1,000/mes)
    // Salario diario real = $50.00. Salario diario cotizable ISSS = $33.33
    // 5 días de enfermedad común: 3 días patrono al 75% de $50 = 3 * $37.50 = $112.50
    // 2 días ISSS al 75% de $33.33 = $25.00/día (tope máximo) -> 2 * $25 = $50.00
    const resHigh = calcIncapacity({
      monthlySalary: 1500,
      days: 5,
      type: 'common_illness',
    });
    assert.equal(resHigh.isSalaryCappedByISSS, true);
    assert.equal(resHigh.dailyRealSalary, 50.0);
    assert.equal(resHigh.dailyCotizableSalary, 33.33);
    assert.equal(resHigh.employerDays, 3);
    assert.equal(resHigh.isssDays, 2);
    assert.equal(resHigh.employerDailyAmount, 37.5);
    assert.equal(resHigh.employerTotalPay, 112.5);
    assert.equal(resHigh.isssDailySubsidio, 25.0);
    assert.equal(resHigh.isssTotalSubsidio, 50.0);
    assert.equal(resHigh.totalIncapacityPay, 162.5);

    // Caso 4: Accidente de trabajo (Riesgo profesional) de 6 días con salario de $600
    // Desde el día 1 cubierto por ISSS al 75% = 6 * $15 = $90. Patrono = 0 días
    const resAccident = calcIncapacity({
      monthlySalary: 600,
      days: 6,
      type: 'work_accident',
    });
    assert.equal(resAccident.employerDays, 0);
    assert.equal(resAccident.isssDays, 6);
    assert.equal(resAccident.isssTotalSubsidio, 90.0);
    assert.equal(resAccident.totalIncapacityPay, 90.0);

    // Caso 5: Maternidad (112 días) con salario de $800
    // ISSS cubre el 100% del salario cotizable ($800 / 30 = $26.67/día)
    const resMaternity = calcIncapacity({
      monthlySalary: 800,
      days: 112,
      type: 'maternity',
    });
    assert.equal(resMaternity.employerDays, 0);
    assert.equal(resMaternity.isssDays, 112);
    assert.equal(resMaternity.isssRate, 1.0);
    assert.equal(resMaternity.isssDailySubsidio, 26.67);
    assert.equal(resMaternity.isssTotalSubsidio, 2987.04);
  });

  it('calculates severance and termination settlements (liquidaciones y finiquitos) accurately', () => {
    // Caso 1: Despido injustificado (Art. 58 CT) - 2 años exactos, salario de $800
    // 2 años = 60 días de salario indemnizatorio. Sin topar porque $800 < $1,635.20 (4 salarios mín.)
    const resDespido = calcLiquidacion({
      monthlySalary: 800,
      hireDate: '2024-01-01',
      endDate: '2026-01-01',
      motivo: 'despido_injustificado',
      salarioPendienteDias: 5,
    });
    assert.equal(resDespido.seniority.years, 2);
    assert.equal(resDespido.indemnizacion.applies, true);
    assert.equal(resDespido.indemnizacion.isCapped, false);
    assert.equal(resDespido.indemnizacion.daysComputed >= 60, true);
    assert.equal(resDespido.indemnizacion.amount > 1500, true);
    assert.equal(resDespido.derechosAdquiridos.salarioPendienteDias, 5);
    assert.equal(resDespido.derechosAdquiridos.salarioPendienteAmount, 133.35); // 5 * 26.67
    assert.equal(resDespido.totalExentoISR >= resDespido.indemnizacion.amount, true);

    // Caso 2: Despido injustificado con salario alto ($2,500) y tope de 4 salarios mínimos
    // Base se topa a 4 * 408.80 = $1,635.20
    const resHigh = calcLiquidacion({
      monthlySalary: 2500,
      hireDate: '2024-01-01',
      endDate: '2025-01-01',
      motivo: 'despido_injustificado',
    });
    assert.equal(resHigh.indemnizacion.isCapped, true);
    assert.equal(resHigh.indemnizacion.baseMonthlySalary, 1635.2);
    assert.equal(resHigh.indemnizacion.amount, 1635.2); // 30 días con base topada exacta (4 * $408.80)

    // Caso 3: Despido injustificado con antigüedad corta (3 meses) - garantía mínima 15 días (Art. 58 inc. 2)
    const resShort = calcLiquidacion({
      monthlySalary: 600,
      hireDate: '2026-01-01',
      endDate: '2026-03-31',
      motivo: 'despido_injustificado',
    });
    assert.equal(resShort.indemnizacion.daysComputed, 15);
    assert.equal(resShort.indemnizacion.amount, 300); // 15 * 20.00

    // Caso 4: Renuncia voluntaria (D.L. 592) con menos de 2 años de servicio (< 2 años = $0 prestación)
    const resRenunciaCorta = calcLiquidacion({
      monthlySalary: 700,
      hireDate: '2024-06-01',
      endDate: '2025-11-01', // 1 año y 5 meses
      motivo: 'renuncia_voluntaria',
    });
    assert.equal(resRenunciaCorta.indemnizacion.applies, false);
    assert.equal(resRenunciaCorta.indemnizacion.amount, 0);
    // Pero conserva derechos adquiridos (vacaciones y aguinaldo)
    assert.equal(resRenunciaCorta.derechosAdquiridos.vacacionTotal > 0, true);
    assert.equal(resRenunciaCorta.totalLiquidacion > 0, true);

    // Caso 5: Renuncia voluntaria con 3 años de servicio y salario de $600
    // 3 años * 15 días = 45 días. Salario diario = $20.00 <= $27.26 (tope 2 salarios mínimos diarios)
    const resRenunciaValida = calcLiquidacion({
      monthlySalary: 600,
      hireDate: '2023-01-01',
      endDate: '2026-01-01',
      motivo: 'renuncia_voluntaria',
    });
    assert.equal(resRenunciaValida.indemnizacion.applies, true);
    assert.equal(resRenunciaValida.indemnizacion.isCapped, false);
    assert.equal(resRenunciaValida.indemnizacion.daysComputed >= 45, true);
    assert.equal(resRenunciaValida.indemnizacion.amount >= 900, true);

    // Caso 6: Despido justificado (Art. 50 CT)
    const resJustificado = calcLiquidacion({
      monthlySalary: 900,
      hireDate: '2023-01-01',
      endDate: '2026-01-01',
      motivo: 'despido_justificado',
    });
    assert.equal(resJustificado.indemnizacion.applies, false);
    assert.equal(resJustificado.indemnizacion.amount, 0);
    assert.equal(resJustificado.derechosAdquiridos.total > 0, true);
    assert.equal(resJustificado.totalLiquidacion, resJustificado.derechosAdquiridos.total);

    // Caso 7: Liquidación anual regular (1 año completo)
    const resAnual = calcLiquidacion({
      monthlySalary: 1000,
      hireDate: '2025-01-01',
      endDate: '2025-12-31',
      motivo: 'liquidacion_anual',
    });
    assert.equal(resAnual.indemnizacion.applies, true);
    assert.equal(resAnual.indemnizacion.amount, 1000.0); // 1 mes completo
    assert.equal(resAnual.derechosAdquiridos.vacacionDays, 15);
    assert.equal(resAnual.derechosAdquiridos.vacacionTotal, 650.0); // 15 * 33.33 * 1.30 = 650
    assert.equal(resAnual.derechosAdquiridos.aguinaldoAmount, 500.0); // 15 días al 12 dic = 15 * 33.33
  });

  it('calculates incapacities spanning across two consecutive biweekly periods (quincenas) accurately', () => {
    // Caso 1: Salario $800, Enfermedad común de 10 días: 4 días en Q1 y 6 días en Q2
    // Empresa paga 100% primeros 3 días
    // En Q1: 4 días de incapacidad (3 carencia patronal, 1 día ISSS), 11 días trabajados (15 - 4)
    // En Q2: 6 días de incapacidad (0 carencia porque ya se cumplió en Q1, 6 días ISSS), 9 días trabajados (15 - 6)
    const split1 = calcIncapacitySplitQuincenas({
      monthlySalary: 800,
      type: 'common_illness',
      q1IncapacityDays: 4,
      q2IncapacityDays: 6,
      employerPays100FirstDays: true,
    });

    assert.equal(split1.totalIncapacityDays, 10);
    // Q1
    assert.equal(split1.q1.workedDays, 11);
    assert.equal(split1.q1.employerIncapacityDays, 3);
    assert.equal(split1.q1.isssIncapacityDays, 1);
    assert.equal(split1.q1.isssTotalSubsidio, 20.0); // 1 día * $20.00
    assert.equal(split1.q1.employerDiscountAmount > 0, true);

    // Q2
    assert.equal(split1.q2.workedDays, 9);
    assert.equal(split1.q2.employerIncapacityDays, 0); // carencia completada en Q1
    assert.equal(split1.q2.isssIncapacityDays, 6);
    assert.equal(split1.q2.isssTotalSubsidio, 120.0); // 6 días * $20.00

    // Caso 2: Carencia partida entre Q1 y Q2
    // Ejemplo: Incapacidad de 5 días que empezó en el día 14 (2 días en Q1 y 3 días en Q2)
    // En Q1: 2 días de incapacidad -> los 2 son carencia patronal. ISSS = 0 días.
    // En Q2: 3 días de incapacidad -> 1 día restante de carencia patronal y 2 días para el ISSS.
    const split2 = calcIncapacitySplitQuincenas({
      monthlySalary: 600,
      type: 'common_illness',
      q1IncapacityDays: 2,
      q2IncapacityDays: 3,
      employerPays100FirstDays: false,
    });

    assert.equal(split2.q1.employerIncapacityDays, 2);
    assert.equal(split2.q1.isssIncapacityDays, 0);
    assert.equal(split2.q1.isssTotalSubsidio, 0.0);

    assert.equal(split2.q2.employerIncapacityDays, 1);
    assert.equal(split2.q2.isssIncapacityDays, 2);
    assert.equal(split2.q2.isssTotalSubsidio, 30.0); // 2 * ($20 * 0.75) = 2 * 15 = 30.0

    // Caso 3: Accidente de trabajo (sin carencia patronal)
    // 5 días en Q1 y 5 días en Q2 -> Todo corre a cargo del ISSS desde el día 1
    const splitAccident = calcIncapacitySplitQuincenas({
      monthlySalary: 800,
      type: 'work_accident',
      q1IncapacityDays: 5,
      q2IncapacityDays: 5,
    });
    assert.equal(splitAccident.q1.employerIncapacityDays, 0);
    assert.equal(splitAccident.q1.isssIncapacityDays, 5);
    assert.equal(splitAccident.q2.employerIncapacityDays, 0);
    assert.equal(splitAccident.q2.isssIncapacityDays, 5);
    assert.equal(splitAccident.q1.isssTotalSubsidio, 100.0);
    assert.equal(splitAccident.q2.isssTotalSubsidio, 100.0);
  });
});


