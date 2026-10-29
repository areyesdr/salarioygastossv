/**
 * Motor de cálculos laborales y tributarios de El Salvador (2026 - 2027)
 *
 * Referencias normativas y técnicas verificadas:
 * - Código de Trabajo de El Salvador:
 *   - Art. 161-169: Jornada laboral y recargos por horas extraordinarias y nocturnidad.
 *   - Art. 177: Vacación anual remunerada (15 días + 30% de recargo).
 *   - Art. 190-192: Remuneración en días de asueto y descanso semanal.
 *   - Art. 196-202: Aguinaldo por tramos de antigüedad al 12 de diciembre (15, 19 y 21 días).
 * - Ley del ISSS y Reglamento: Cotización laboral 3% (tope $1,000 = $30.00/mes) y patronal 7.5% (tope $75.00/mes).
 * - Ley SAP (AFP): Cotización laboral 7.25% y patronal 8.75%.
 * - Tablas de Retención del Impuesto sobre la Renta (ISR): Decreto Legislativo N.º 254 (Ministerio de Hacienda).
 * - Decretos Legislativos N.º 669 y 670: Ventana de pago de aguinaldo del 1 de octubre al 20 de diciembre.
 * - Decreto Legislativo N.º 673: Exención de ISR en aguinaldo hasta $1,500.00.
 * - Decreto Legislativo N.º 499 (Ley Quincena 25): Pago del 50% del salario mensual en enero (entre el 15 y 25 de enero)
 *   para salarios <= $1,500.00, 100% exento de ISSS, AFP e ISR, obligatorio en enero de 2027 para todo empleador.
 */

export const RATES = {
  AFP_EE: 0.0725,
  AFP_ER: 0.0875,
  ISSS_EE: 0.03,
  ISSS_ER: 0.075,
  INSAFORP_ER: 0.01,
  ISSS_CAP_MONTHLY: 1000.0,
  ISSS_CAP_BIWEEKLY: 500.0,
  ISSS_MAX_EE_MONTHLY: 30.0,
  ISSS_MAX_EE_BIWEEKLY: 15.0,
  ISSS_MAX_ER_MONTHLY: 75.0,
  ISSS_MAX_ER_BIWEEKLY: 37.5,
  QUINCENA_25_CAP: 1500.0,
  AGUINALDO_DECREE_EXEMPTION: 1500.0,
} as const;

export interface MinimumWageSector {
  id: 'comercio' | 'maquila' | 'beneficios_cafe' | 'agropecuario';
  name: string;
  monthly: number;
  daily: number;
}

export const MINIMUM_WAGES_2026: Record<MinimumWageSector['id'], MinimumWageSector> = {
  comercio: {
    id: 'comercio',
    name: 'Comercio, Servicios, Industria e Ingenios',
    monthly: 408.8,
    daily: 13.63,
  },
  maquila: {
    id: 'maquila',
    name: 'Maquila Textil y Confección',
    monthly: 402.32,
    daily: 13.41,
  },
  beneficios_cafe: {
    id: 'beneficios_cafe',
    name: 'Beneficios de Café y Recolección de Caña',
    monthly: 305.23,
    daily: 10.17,
  },
  agropecuario: {
    id: 'agropecuario',
    name: 'Agropecuario, Pesca y Recolección de Café',
    monthly: 272.53,
    daily: 9.08,
  },
};

export type PayPeriod = 'monthly' | 'biweekly';
export type ISRBracketId = 'I' | 'II' | 'III' | 'IV';

export interface ISRBracketRule {
  id: ISRBracketId;
  label: string;
  from: number;
  to: number | null;
  rate: number;
  fixedFee: number;
  excessOver: number;
}

export const ISR_TABLES: Record<PayPeriod, ISRBracketRule[]> = {
  monthly: [
    { id: 'I', label: 'Tramo I (Exento)', from: 0, to: 550.0, rate: 0, fixedFee: 0, excessOver: 0 },
    { id: 'II', label: 'Tramo II (10%)', from: 550.01, to: 895.24, rate: 0.1, fixedFee: 17.67, excessOver: 550.0 },
    { id: 'III', label: 'Tramo III (20%)', from: 895.25, to: 2038.1, rate: 0.2, fixedFee: 60.0, excessOver: 895.24 },
    { id: 'IV', label: 'Tramo IV (30%)', from: 2038.11, to: null, rate: 0.3, fixedFee: 288.57, excessOver: 2038.1 },
  ],
  biweekly: [
    { id: 'I', label: 'Tramo I (Exento)', from: 0, to: 275.0, rate: 0, fixedFee: 0, excessOver: 0 },
    { id: 'II', label: 'Tramo II (10%)', from: 275.01, to: 447.62, rate: 0.1, fixedFee: 8.83, excessOver: 275.0 },
    { id: 'III', label: 'Tramo III (20%)', from: 447.63, to: 1019.05, rate: 0.2, fixedFee: 30.0, excessOver: 447.62 },
    { id: 'IV', label: 'Tramo IV (30%)', from: 1019.06, to: null, rate: 0.3, fixedFee: 144.28, excessOver: 1019.05 },
  ],
};

export interface ISRCalculationResult {
  bracketId: ISRBracketId;
  bracketLabel: string;
  taxableIncome: number;
  fixedFee: number;
  rate: number;
  excessOver: number;
  excessAmount: number;
  variableTax: number;
  isr: number;
  effectiveTaxRateOnTaxable: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula la retención de Impuesto sobre la Renta (ISR) según la tabla mensual o quincenal.
 */
export function calcISR(taxableIncome: number, period: PayPeriod = 'monthly'): ISRCalculationResult {
  const taxable = Math.max(0, taxableIncome);
  const rules = ISR_TABLES[period];

  let matched = rules[0];
  for (const rule of rules) {
    if (rule.to === null) {
      if (taxable > rules[rules.length - 2].to!) {
        matched = rule;
      }
    } else if (taxable <= rule.to) {
      matched = rule;
      break;
    }
  }

  if (matched.id === 'I' || taxable <= rules[0].to!) {
    return {
      bracketId: 'I',
      bracketLabel: rules[0].label,
      taxableIncome: round2(taxable),
      fixedFee: 0,
      rate: 0,
      excessOver: 0,
      excessAmount: 0,
      variableTax: 0,
      isr: 0,
      effectiveTaxRateOnTaxable: 0,
    };
  }

  const excessAmount = Math.max(0, taxable - matched.excessOver);
  const variableTax = excessAmount * matched.rate;
  const isr = round2(matched.fixedFee + variableTax);

  return {
    bracketId: matched.id,
    bracketLabel: matched.label,
    taxableIncome: round2(taxable),
    fixedFee: matched.fixedFee,
    rate: matched.rate,
    excessOver: matched.excessOver,
    excessAmount: round2(excessAmount),
    variableTax: round2(variableTax),
    isr,
    effectiveTaxRateOnTaxable: taxable > 0 ? round2((isr / taxable) * 100) : 0,
  };
}

/**
 * Estima el ISR adicional de un ingreso extraordinario gravado (como el 30% vacacional o exceso de aguinaldo)
 * distribuyendo su impacto anualizado (1/12 mensual), mismo método que utiliza salariosv.com (`extraISRApprox`).
 */
export function calcExtraISRAnnualized(baseMonthlyTaxable: number, extraTaxableAmount: number): number {
  const extra = Math.max(0, extraTaxableAmount);
  if (extra <= 0) return 0;
  const monthlyEquivalent = extra / 12;
  const baseTax = calcISR(baseMonthlyTaxable, 'monthly').isr;
  const newTax = calcISR(baseMonthlyTaxable + monthlyEquivalent, 'monthly').isr;
  return Math.max(0, round2((newTax - baseTax) * 12));
}

export interface PayrollBreakdown {
  period: PayPeriod;
  grossBase: number;
  bonuses: number;
  grossTotal: number;
  afpEmployee: number;
  isssEmployee: number;
  isssCapped: boolean;
  taxableIncome: number;
  isrDetail: ISRCalculationResult;
  isr: number;
  totalEmployeeDeductions: number;
  netPay: number;
  effectiveDeductionPct: number;
  afpEmployer: number;
  isssEmployer: number;
  insaforpEmployer: number;
  totalEmployerContributions: number;
  totalEmployerCost: number;
  quincenaDetails?: {
    q1: QuincenaDetail;
    q2: QuincenaDetail;
    hasOddCentAdjustment: boolean;
  };
}

export interface QuincenaDetail {
  grossBase: number;
  bonuses: number;
  grossTotal: number;
  afpEmployee: number;
  isssEmployee: number;
  taxableIncome: number;
  isr: number;
  totalEmployeeDeductions: number;
  netPay: number;
  afpEmployer: number;
  isssEmployer: number;
  insaforpEmployer: number;
  totalEmployerContributions: number;
  totalEmployerCost: number;
}

function calcMonthlyPayrollInternal(
  safeBaseMonthly: number,
  safeBonusesMonthly: number
): PayrollBreakdown {
  const grossBase = round2(safeBaseMonthly);
  const bonuses = round2(safeBonusesMonthly);
  const grossTotal = round2(grossBase + bonuses);

  const afpEmployee = round2(grossTotal * RATES.AFP_EE);
  const isssEmployee = round2(Math.min(grossTotal * RATES.ISSS_EE, RATES.ISSS_MAX_EE_MONTHLY));
  const isssCapped = grossTotal >= RATES.ISSS_CAP_MONTHLY;

  const taxableIncome = Math.max(0, round2(grossTotal - afpEmployee - isssEmployee));
  const isrDetail = calcISR(taxableIncome, 'monthly');
  const isr = isrDetail.isr;

  const totalEmployeeDeductions = round2(afpEmployee + isssEmployee + isr);
  const netPay = Math.max(0, round2(grossTotal - totalEmployeeDeductions));
  const effectiveDeductionPct = grossTotal > 0 ? round2((totalEmployeeDeductions / grossTotal) * 100) : 0;

  const afpEmployer = round2(grossTotal * RATES.AFP_ER);
  const isssEmployer = round2(Math.min(grossTotal * RATES.ISSS_ER, RATES.ISSS_MAX_ER_MONTHLY));
  const insaforpEmployer = round2(grossTotal * RATES.INSAFORP_ER);
  const totalEmployerContributions = round2(afpEmployer + isssEmployer + insaforpEmployer);
  const totalEmployerCost = round2(grossTotal + totalEmployerContributions);

  return {
    period: 'monthly',
    grossBase,
    bonuses,
    grossTotal,
    afpEmployee,
    isssEmployee,
    isssCapped,
    taxableIncome,
    isrDetail,
    isr,
    totalEmployeeDeductions,
    netPay,
    effectiveDeductionPct,
    afpEmployer,
    isssEmployer,
    insaforpEmployer,
    totalEmployerContributions,
    totalEmployerCost,
  };
}

function computeQuincenaPair(monthly: PayrollBreakdown): {
  q1: QuincenaDetail;
  q2: QuincenaDetail;
  hasOddCentAdjustment: boolean;
} {
  const q1GrossBase = Math.floor((monthly.grossBase * 100) / 2) / 100;
  const q2GrossBase = round2(monthly.grossBase - q1GrossBase);

  const q1Bonuses = Math.floor((monthly.bonuses * 100) / 2) / 100;
  const q2Bonuses = round2(monthly.bonuses - q1Bonuses);

  const q1GrossTotal = round2(q1GrossBase + q1Bonuses);
  const q2GrossTotal = round2(q2GrossBase + q2Bonuses);

  const q1AfpEmployee = round2(q1GrossTotal * RATES.AFP_EE);
  const q2AfpEmployee = round2(monthly.afpEmployee - q1AfpEmployee);

  const q1IsssEmployee = round2(Math.min(q1GrossTotal * RATES.ISSS_EE, RATES.ISSS_MAX_EE_BIWEEKLY));
  const q2IsssEmployee = round2(monthly.isssEmployee - q1IsssEmployee);

  const q1TaxableIncome = Math.max(0, round2(q1GrossTotal - q1AfpEmployee - q1IsssEmployee));
  const q1Isr = calcISR(q1TaxableIncome, 'biweekly').isr;
  const q2Isr = round2(monthly.isr - q1Isr);

  const q1TotalEmployeeDeductions = round2(q1AfpEmployee + q1IsssEmployee + q1Isr);
  const q2TotalEmployeeDeductions = round2(q2AfpEmployee + q2IsssEmployee + q2Isr);

  const q1NetPay = round2(q1GrossTotal - q1TotalEmployeeDeductions);
  const q2NetPay = round2(q2GrossTotal - q2TotalEmployeeDeductions);

  const q1AfpEmployer = round2(q1GrossTotal * RATES.AFP_ER);
  const q2AfpEmployer = round2(monthly.afpEmployer - q1AfpEmployer);

  const q1IsssEmployer = round2(Math.min(q1GrossTotal * RATES.ISSS_ER, RATES.ISSS_MAX_ER_BIWEEKLY));
  const q2IsssEmployer = round2(monthly.isssEmployer - q1IsssEmployer);

  const q1InsaforpEmployer = round2(q1GrossTotal * RATES.INSAFORP_ER);
  const q2InsaforpEmployer = round2(monthly.insaforpEmployer - q1InsaforpEmployer);

  const q1TotalEmployerContribs = round2(q1AfpEmployer + q1IsssEmployer + q1InsaforpEmployer);
  const q2TotalEmployerContribs = round2(q2AfpEmployer + q2IsssEmployer + q2InsaforpEmployer);

  const q1TotalEmployerCost = round2(q1GrossTotal + q1TotalEmployerContribs);
  const q2TotalEmployerCost = round2(q2GrossTotal + q2TotalEmployerContribs);

  const hasOddCentAdjustment =
    q1GrossTotal !== q2GrossTotal ||
    q1TotalEmployeeDeductions !== q2TotalEmployeeDeductions ||
    q1NetPay !== q2NetPay;

  return {
    q1: {
      grossBase: q1GrossBase,
      bonuses: q1Bonuses,
      grossTotal: q1GrossTotal,
      afpEmployee: q1AfpEmployee,
      isssEmployee: q1IsssEmployee,
      taxableIncome: q1TaxableIncome,
      isr: q1Isr,
      totalEmployeeDeductions: q1TotalEmployeeDeductions,
      netPay: q1NetPay,
      afpEmployer: q1AfpEmployer,
      isssEmployer: q1IsssEmployer,
      insaforpEmployer: q1InsaforpEmployer,
      totalEmployerContributions: q1TotalEmployerContribs,
      totalEmployerCost: q1TotalEmployerCost,
    },
    q2: {
      grossBase: q2GrossBase,
      bonuses: q2Bonuses,
      grossTotal: q2GrossTotal,
      afpEmployee: q2AfpEmployee,
      isssEmployee: q2IsssEmployee,
      taxableIncome: Math.max(0, round2(q2GrossTotal - q2AfpEmployee - q2IsssEmployee)),
      isr: q2Isr,
      totalEmployeeDeductions: q2TotalEmployeeDeductions,
      netPay: q2NetPay,
      afpEmployer: q2AfpEmployer,
      isssEmployer: q2IsssEmployer,
      insaforpEmployer: q2InsaforpEmployer,
      totalEmployerContributions: q2TotalEmployerContribs,
      totalEmployerCost: q2TotalEmployerCost,
    },
    hasOddCentAdjustment,
  };
}

/**
 * Calcula el desglose exacto de planilla mensual o quincenal conforme a la
 * práctica laboral y tributaria de El Salvador (liquidación mensual consolidada).
 */
export function calcPayroll(
  monthlyBaseSalary: number,
  period: PayPeriod = 'monthly',
  monthlyExtraBonuses: number = 0
): PayrollBreakdown {
  const safeBaseMonthly = Math.max(0, monthlyBaseSalary);
  const safeBonusesMonthly = Math.max(0, monthlyExtraBonuses);

  const monthly = calcMonthlyPayrollInternal(safeBaseMonthly, safeBonusesMonthly);
  const pair = computeQuincenaPair(monthly);

  if (period === 'monthly') {
    return {
      ...monthly,
      quincenaDetails: pair,
    };
  }

  // Si period === 'biweekly', devolvemos la 1.ª quincena (anticipo quincenal oficial)
  // sincronizado con la liquidación mensual consolidada:
  const q1 = pair.q1;
  const isssCapped = q1.grossTotal >= RATES.ISSS_CAP_BIWEEKLY;
  const isrDetail = calcISR(q1.taxableIncome, 'biweekly');
  const effectiveDeductionPct =
    q1.grossTotal > 0 ? round2((q1.totalEmployeeDeductions / q1.grossTotal) * 100) : 0;

  return {
    period: 'biweekly',
    grossBase: q1.grossBase,
    bonuses: q1.bonuses,
    grossTotal: q1.grossTotal,
    afpEmployee: q1.afpEmployee,
    isssEmployee: q1.isssEmployee,
    isssCapped,
    taxableIncome: q1.taxableIncome,
    isrDetail,
    isr: q1.isr,
    totalEmployeeDeductions: q1.totalEmployeeDeductions,
    netPay: q1.netPay,
    effectiveDeductionPct,
    afpEmployer: q1.afpEmployer,
    isssEmployer: q1.isssEmployer,
    insaforpEmployer: q1.insaforpEmployer,
    totalEmployerContributions: q1.totalEmployerContributions,
    totalEmployerCost: q1.totalEmployerCost,
    quincenaDetails: pair,
  };
}

export interface VacationTramo {
  name: string;
  days: number;
  gross15Part: number;
  bonus30Part: number;
  totalGrossPart: number;
  netBonusPart: number;
}

export interface VacationCalculationResult {
  monthlySalary: number;
  dailySalary: number;
  vacationDays: number;
  bonusPercentage: number;
  base15DaysGross: number;
  bonus30Gross: number;
  completeVacationGross: number;
  /**
   * Modalidad 1: Pago únicamente del recargo del 30% (el salario quincenal ordinario se cobra normal en planilla).
   * Incluye tanto el valor bruto directo (como muestra misalariosv.com) como el neto con deducciones de ley (como muestra salariosv.com).
   */
  bonusOnlyMode: {
    grossBonus: number;
    afp: number;
    isss: number;
    taxableBonus: number;
    isrEstimated: number;
    netBonusAfterDeductions: number;
  };
  /**
   * Modalidad 2: Pago adelantado completo (15 días de salario + 30% de recargo vacacional en un solo pago).
   */
  fullAdvanceMode: {
    grossTotal: number;
    afp: number;
    isss: number;
    taxable: number;
    isr: number;
    totalDeductions: number;
    netTotal: number;
  };
  splits: VacationTramo[];
}

export function calcVacation(
  monthlySalary: number,
  bonusPercentage: number = 30,
  splitDays: [number, number, number] = [5, 5, 5]
): VacationCalculationResult {
  const salary = Math.max(0, monthlySalary);
  const pct = Math.max(0, bonusPercentage);
  const vacationDays = 15;
  const dailySalary = round2(salary / 30);

  // 15 días equivalen a una quincena (salario / 2)
  const base15DaysGross = round2((salary / 30) * vacationDays);
  const bonus30Gross = round2(base15DaysGross * (pct / 100));
  const completeVacationGross = round2(base15DaysGross + bonus30Gross);

  // Renta gravada mensual ordinaria para estimar impacto marginal de ISR
  const baseMonthlyPayroll = calcPayroll(salary, 'monthly');

  // Modalidad 1: Solo el bono 30%
  const afpBonusOnly = round2(bonus30Gross * RATES.AFP_EE);
  // Si el salario mensual ya alcanza el tope de $1,000, el ISSS mensual de $30 ya está cubierto por el salario ordinario;
  // sin embargo, mostramos la cotización directa sobre el bono si aún hay margen bajo $1,000 o según criterio de planilla.
  const remainingIsssRoom = Math.max(0, RATES.ISSS_CAP_MONTHLY - salary);
  const isssBonusOnly = round2(Math.min(bonus30Gross, remainingIsssRoom) * RATES.ISSS_EE);
  const taxableBonusOnly = Math.max(0, round2(bonus30Gross - afpBonusOnly - isssBonusOnly));
  const isrBonusOnly = calcExtraISRAnnualized(baseMonthlyPayroll.taxableIncome, taxableBonusOnly);
  const netBonusAfterDeductions = Math.max(0, round2(bonus30Gross - afpBonusOnly - isssBonusOnly - isrBonusOnly));

  // Modalidad 2: Pago completo adelantado (15 días + 30%)
  const afpFull = round2(completeVacationGross * RATES.AFP_EE);
  const isssFull = round2(Math.min(completeVacationGross, RATES.ISSS_CAP_BIWEEKLY) * RATES.ISSS_EE);
  const taxableFull = Math.max(0, round2(completeVacationGross - afpFull - isssFull));
  const baseQuincenaTaxable = Math.max(
    0,
    round2(base15DaysGross - base15DaysGross * RATES.AFP_EE - Math.min(base15DaysGross, RATES.ISSS_CAP_BIWEEKLY) * RATES.ISSS_EE)
  );
  const isrQuincenaNormal = calcISR(baseQuincenaTaxable, 'biweekly').isr;
  const isrFull = round2(isrQuincenaNormal + isrBonusOnly);
  const totalDeductionsFull = round2(afpFull + isssFull + isrFull);
  const netFull = Math.max(0, round2(completeVacationGross - totalDeductionsFull));

  const labels = ['Semana Santa', 'Fiestas Agostinas', 'Fin de Año'];
  const splits: VacationTramo[] = splitDays.map((days, idx) => {
    const safeDays = Math.max(0, days);
    const ratio = safeDays / 15;
    return {
      name: labels[idx] || `Tramo ${idx + 1}`,
      days: safeDays,
      gross15Part: round2(base15DaysGross * ratio),
      bonus30Part: round2(bonus30Gross * ratio),
      totalGrossPart: round2(completeVacationGross * ratio),
      netBonusPart: round2(netBonusAfterDeductions * ratio),
    };
  });

  return {
    monthlySalary: salary,
    dailySalary,
    vacationDays,
    bonusPercentage: pct,
    base15DaysGross,
    bonus30Gross,
    completeVacationGross,
    bonusOnlyMode: {
      grossBonus: bonus30Gross,
      afp: afpBonusOnly,
      isss: isssBonusOnly,
      taxableBonus: taxableBonusOnly,
      isrEstimated: isrBonusOnly,
      netBonusAfterDeductions,
    },
    fullAdvanceMode: {
      grossTotal: completeVacationGross,
      afp: afpFull,
      isss: isssFull,
      taxable: taxableFull,
      isr: isrFull,
      totalDeductions: totalDeductionsFull,
      netTotal: netFull,
    },
    splits,
  };
}

export type SeniorityBracket = 'under-1' | '1-to-3' | '3-to-10' | '10-plus';
export type AguinaldoExemptionRule = 'decreto_1500' | 'dos_minimos';

export interface AguinaldoCalculationOptions {
  monthlySalary: number;
  seniorityBracket: SeniorityBracket;
  /** Días trabajados hasta el 12 de diciembre cuando seniorityBracket === 'under-1' (1..365) */
  daysWorkedUnderOneYear?: number;
  exemptionRule?: AguinaldoExemptionRule;
}

export interface AguinaldoCalculationResult {
  monthlySalary: number;
  dailySalary: number;
  seniorityBracket: SeniorityBracket;
  seniorityLabel: string;
  equivalentDays: number;
  isProportional: boolean;
  daysWorked: number;
  proportionFactor: number;
  grossAguinaldo: number;
  exemptionLimit: number;
  exemptAmount: number;
  taxableExcess: number;
  isrWithheld: number;
  netAguinaldo: number;
  paymentWindowLabel: string;
}

/**
 * Calcula los días transcurridos entre una fecha de ingreso y una fecha de corte (ambos inclusive),
 * limitado a [0, 365], mismo algoritmo que misalariosv.com y salariosv.com.
 */
export function calcDaysBetweenInclusive(startDateStr: string, cutoffDateStr: string): number {
  const start = new Date(`${startDateStr}T00:00:00`);
  const cutoff = new Date(`${cutoffDateStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(cutoff.getTime()) || start > cutoff) {
    return 0;
  }
  const diffDays = Math.floor((cutoff.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(365, Math.max(0, diffDays));
}

export interface SeniorityCalculationResult {
  hireDate: string;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formattedSeniority: string;
  currentSeniorityBracket: SeniorityBracket;
  aguinaldoCutoffDate: string;
  aguinaldoSeniorityBracket: SeniorityBracket;
  aguinaldoDaysWorked: number;
  aguinaldoLabel: string;
  aguinaldoShortBadge: string;
  q25CutoffDate: string;
  q25IsFullYear: boolean;
  q25DaysWorked: number;
  isEligibleForVacation: boolean;
  isEligibleForRenunciaVoluntaria: boolean;
  indemnizacionYearsEquivalent: number;
}

/**
 * Calcula la antigüedad exacta (años, meses y días) y determina automáticamente
 * los tramos y proporcionales legales de Aguinaldo, Quincena 25 y Vacaciones.
 */
export function calcSeniorityFromHireDate(
  hireDateStr: string,
  referenceDateStr?: string
): SeniorityCalculationResult {
  const defaultYear = 2026;
  if (!hireDateStr || !hireDateStr.trim()) {
    return {
      hireDate: '',
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formattedSeniority: 'Sin fecha registrada',
      currentSeniorityBracket: '1-to-3',
      aguinaldoCutoffDate: `${defaultYear}-12-12`,
      aguinaldoSeniorityBracket: '1-to-3',
      aguinaldoDaysWorked: 365,
      aguinaldoLabel: '1 a menos de 3 años (15 días)',
      aguinaldoShortBadge: '15 días',
      q25CutoffDate: '2027-01-25',
      q25IsFullYear: true,
      q25DaysWorked: 365,
      isEligibleForVacation: true,
      isEligibleForRenunciaVoluntaria: true,
      indemnizacionYearsEquivalent: 1,
    };
  }

  const hire = new Date(`${hireDateStr}T00:00:00`);
  const ref = referenceDateStr ? new Date(`${referenceDateStr}T00:00:00`) : new Date();

  if (Number.isNaN(hire.getTime()) || hire > ref) {
    return {
      hireDate: hireDateStr,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formattedSeniority: 'Fecha no válida o futura',
      currentSeniorityBracket: 'under-1',
      aguinaldoCutoffDate: `${ref.getFullYear()}-12-12`,
      aguinaldoSeniorityBracket: 'under-1',
      aguinaldoDaysWorked: 0,
      aguinaldoLabel: 'Menos de 1 año (0 días)',
      aguinaldoShortBadge: '0 días',
      q25CutoffDate: '2027-01-25',
      q25IsFullYear: false,
      q25DaysWorked: 0,
      isEligibleForVacation: false,
      isEligibleForRenunciaVoluntaria: false,
      indemnizacionYearsEquivalent: 0,
    };
  }

  let y = ref.getFullYear() - hire.getFullYear();
  let m = ref.getMonth() - hire.getMonth();
  let d = ref.getDate() - hire.getDate();

  if (d < 0) {
    const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    d += prevMonthLastDay;
    m -= 1;
  }
  if (m < 0) {
    m += 12;
    y -= 1;
  }

  const diffMs = ref.getTime() - hire.getTime();
  const totalDays = Math.max(0, Math.floor(diffMs / 86_400_000));

  const parts: string[] = [];
  if (y > 0) parts.push(`${y} ${y === 1 ? 'año' : 'años'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  if (d > 0 || parts.length === 0) parts.push(`${d} ${d === 1 ? 'día' : 'días'}`);
  const formattedSeniority = parts.join(', ');

  let currentSeniorityBracket: SeniorityBracket = 'under-1';
  if (y >= 10) currentSeniorityBracket = '10-plus';
  else if (y >= 3) currentSeniorityBracket = '3-to-10';
  else if (y >= 1) currentSeniorityBracket = '1-to-3';

  // Aguinaldo computation at December 12 of reference year
  const agYear = ref.getFullYear();
  const agCutoff = new Date(`${agYear}-12-12T00:00:00`);
  let agBracket: SeniorityBracket = 'under-1';
  let agDays = 365;
  let agLabel = 'Menos de 1 año (proporcional)';
  let agShort = 'Proporcional';

  if (hire > agCutoff) {
    agBracket = 'under-1';
    agDays = 0;
    agLabel = 'Menos de 1 año (0 días al 12 dic.)';
    agShort = '0 días';
  } else {
    let agY = agCutoff.getFullYear() - hire.getFullYear();
    let agM = agCutoff.getMonth() - hire.getMonth();
    let agD = agCutoff.getDate() - hire.getDate();
    if (agD < 0) {
      const prev = new Date(agCutoff.getFullYear(), agCutoff.getMonth(), 0).getDate();
      agD += prev;
      agM -= 1;
    }
    if (agM < 0) {
      agM += 12;
      agY -= 1;
    }

    if (agY >= 10) {
      agBracket = '10-plus';
      agDays = 365;
      agLabel = '10 años o más (21 días de salario)';
      agShort = '21 días';
    } else if (agY >= 3) {
      agBracket = '3-to-10';
      agDays = 365;
      agLabel = '3 a menos de 10 años (19 días de salario)';
      agShort = '19 días';
    } else if (agY >= 1) {
      agBracket = '1-to-3';
      agDays = 365;
      agLabel = '1 a menos de 3 años (15 días de salario)';
      agShort = '15 días';
    } else {
      agBracket = 'under-1';
      const daysWorked = Math.floor((agCutoff.getTime() - hire.getTime()) / 86_400_000) + 1;
      agDays = Math.min(365, Math.max(0, daysWorked));
      agLabel = `Menos de 1 año (${agDays} días al 12 dic.)`;
      agShort = 'Proporcional';
    }
  }

  // Quincena 25 al 25 de enero
  const q25Year = agYear >= 2027 ? agYear : 2027;
  const q25Cutoff = new Date(`${q25Year}-01-25T00:00:00`);
  let q25IsFullYear = false;
  let q25DaysWorked = 365;

  if (hire <= q25Cutoff) {
    const qDiff = Math.floor((q25Cutoff.getTime() - hire.getTime()) / 86_400_000) + 1;
    if (qDiff >= 365) {
      q25IsFullYear = true;
      q25DaysWorked = 365;
    } else {
      q25IsFullYear = false;
      q25DaysWorked = Math.max(0, qDiff);
    }
  } else {
    q25IsFullYear = false;
    q25DaysWorked = 0;
  }

  const isEligibleForVacation = totalDays >= 200 || y >= 1;
  const isEligibleForRenunciaVoluntaria = y >= 2;
  const indemnizacionYearsEquivalent = round2(y + (m * 30 + d) / 365);

  return {
    hireDate: hireDateStr,
    years: y,
    months: m,
    days: d,
    totalDays,
    formattedSeniority,
    currentSeniorityBracket,
    aguinaldoCutoffDate: `${agYear}-12-12`,
    aguinaldoSeniorityBracket: agBracket,
    aguinaldoDaysWorked: agDays,
    aguinaldoLabel: agLabel,
    aguinaldoShortBadge: agShort,
    q25CutoffDate: `${q25Year}-01-25`,
    q25IsFullYear,
    q25DaysWorked,
    isEligibleForVacation,
    isEligibleForRenunciaVoluntaria,
    indemnizacionYearsEquivalent,
  };
}

export function calcAguinaldo(options: AguinaldoCalculationOptions): AguinaldoCalculationResult {
  const salary = Math.max(0, options.monthlySalary);
  const dailySalary = salary / 30;
  const exemptionRule = options.exemptionRule ?? 'decreto_1500';
  const exemptionLimit =
    exemptionRule === 'decreto_1500'
      ? RATES.AGUINALDO_DECREE_EXEMPTION
      : round2(MINIMUM_WAGES_2026.comercio.monthly * 2); // $817.60

  let equivalentDays = 15;
  let seniorityLabel = '1 a menos de 3 años (15 días)';
  let isProportional = false;
  let daysWorked = 365;
  let proportionFactor = 1;

  switch (options.seniorityBracket) {
    case 'under-1': {
      equivalentDays = 15;
      isProportional = true;
      daysWorked = Math.min(365, Math.max(0, Math.round(options.daysWorkedUnderOneYear ?? 180)));
      proportionFactor = daysWorked / 365;
      seniorityLabel = `Menos de 1 año (${daysWorked} días proporcionales al 12 dic.)`;
      break;
    }
    case '1-to-3':
      equivalentDays = 15;
      seniorityLabel = '1 a menos de 3 años (15 días de salario)';
      break;
    case '3-to-10':
      equivalentDays = 19;
      seniorityLabel = '3 a menos de 10 años (19 días de salario)';
      break;
    case '10-plus':
      equivalentDays = 21;
      seniorityLabel = '10 años o más (21 días de salario)';
      break;
  }

  const baseFullAguinaldo = dailySalary * equivalentDays;
  const grossAguinaldo = round2(baseFullAguinaldo * proportionFactor);

  const exemptAmount = round2(Math.min(grossAguinaldo, exemptionLimit));
  const taxableExcess = round2(Math.max(0, grossAguinaldo - exemptionLimit));

  const baseMonthlyTaxable = calcPayroll(salary, 'monthly').taxableIncome;
  const isrWithheld = taxableExcess > 0 ? calcExtraISRAnnualized(baseMonthlyTaxable, taxableExcess) : 0;
  const netAguinaldo = Math.max(0, round2(grossAguinaldo - isrWithheld));

  return {
    monthlySalary: salary,
    dailySalary: round2(dailySalary),
    seniorityBracket: options.seniorityBracket,
    seniorityLabel,
    equivalentDays,
    isProportional,
    daysWorked,
    proportionFactor,
    grossAguinaldo,
    exemptionLimit,
    exemptAmount,
    taxableExcess,
    isrWithheld,
    netAguinaldo,
    paymentWindowLabel: '1 de octubre al 20 de diciembre (Decretos 669 y 670)',
  };
}

export interface Quincena25CalculationOptions {
  monthlySalary: number;
  isFullYear: boolean;
  /** Días trabajados en el año hasta el 25 de enero cuando isFullYear === false (1..365) */
  daysWorkedToJan25?: number;
  /** Si el salario supera $1,500, permite simular qué pasaría si el patrono lo otorga voluntariamente */
  simulateVoluntaryAboveCap?: boolean;
}

export interface Quincena25CalculationResult {
  monthlySalary: number;
  eligibleByLaw: boolean;
  capLimit: number;
  isFullYear: boolean;
  daysWorked: number;
  proportionFactor: number;
  grossQuincena25: number;
  afp: number;
  isss: number;
  isr: number;
  netQuincena25: number;
  paymentWindowLabel: string;
  legalNote: string;
}

/**
 * Calcula la Quincena 25 según el Decreto Legislativo N.º 499.
 * - Obligatoria en enero de 2027 para todo empleador.
 * - Aplica a trabajadores con salario mensual <= $1,500.00.
 * - Equivale al 50% del salario mensual nominal (o proporcional a los días trabajados si tiene < 1 año).
 * - 100% libre de ISSS, AFP y Renta (ISR).
 */
export function calcQuincena25(options: Quincena25CalculationOptions): Quincena25CalculationResult {
  const salary = Math.max(0, options.monthlySalary);
  const eligibleByLaw = salary > 0 && salary <= RATES.QUINCENA_25_CAP;
  const daysWorked = options.isFullYear
    ? 365
    : Math.min(365, Math.max(0, Math.round(options.daysWorkedToJan25 ?? 180)));
  const proportionFactor = options.isFullYear ? 1 : daysWorked / 365;

  const baseHalfSalary = salary * 0.5;
  const applies = eligibleByLaw || Boolean(options.simulateVoluntaryAboveCap);
  const grossQuincena25 = applies ? round2(baseHalfSalary * proportionFactor) : 0;

  let legalNote =
    'Aplica el 50% de tu salario mensual nominal, 100% libre de descuentos de ISSS, AFP y Renta (Decreto 499).';
  if (salary > RATES.QUINCENA_25_CAP && !options.simulateVoluntaryAboveCap) {
    legalNote =
      'El salario mensual supera el techo legal de $1,500.00 establecido en el Decreto 499, por lo que no es obligatoria por ley.';
  } else if (salary > RATES.QUINCENA_25_CAP && options.simulateVoluntaryAboveCap) {
    legalNote =
      'Simulación voluntaria activa: aunque supera el techo legal de $1,500.00, se muestra el 50% referencial.';
  } else if (!options.isFullYear) {
    legalNote = `Cálculo proporcional por ${daysWorked} días laborados al 25 de enero (${round2(proportionFactor * 100)}% de una quincena), libre de ISSS, AFP e ISR.`;
  }

  return {
    monthlySalary: salary,
    eligibleByLaw,
    capLimit: RATES.QUINCENA_25_CAP,
    isFullYear: options.isFullYear,
    daysWorked,
    proportionFactor,
    grossQuincena25,
    afp: 0,
    isss: 0,
    isr: 0,
    netQuincena25: grossQuincena25,
    paymentWindowLabel: '15 al 25 de enero (Obligatoria en 2027 · Decreto 499)',
    legalNote,
  };
}

export type OvertimeTypeId =
  | 'ordinary'
  | 'extra_day'
  | 'extra_night'
  | 'rest_day'
  | 'rest_night'
  | 'holiday_day'
  | 'holiday_night';

export interface OvertimeRateRule {
  id: OvertimeTypeId;
  label: string;
  legalBasis: string;
  multiplier: number;
}

export const OVERTIME_RULES: OvertimeRateRule[] = [
  {
    id: 'ordinary',
    label: 'Hora ordinaria diurna',
    legalBasis: 'Salario base por hora (100%)',
    multiplier: 1.0,
  },
  {
    id: 'extra_day',
    label: 'Hora extra diurna (6:00 a.m. - 7:00 p.m.)',
    legalBasis: 'Art. 169 C.T. · 100% de recargo (2.00x)',
    multiplier: 2.0,
  },
  {
    id: 'extra_night',
    label: 'Hora extra nocturna (7:00 p.m. - 6:00 a.m.)',
    legalBasis: 'Art. 168-169 C.T. · 100% recargo + 25% nocturnidad (2.25x)',
    multiplier: 2.25,
  },
  {
    id: 'rest_day',
    label: 'Trabajo en día de descanso (diurno)',
    legalBasis: 'Art. 175 C.T. · Recargo del 50% adicional (1.50x)',
    multiplier: 1.5,
  },
  {
    id: 'rest_night',
    label: 'Trabajo en día de descanso (nocturno)',
    legalBasis: 'Art. 168 y 175 C.T. · 50% descanso + 25% nocturnidad (1.75x)',
    multiplier: 1.75,
  },
  {
    id: 'holiday_day',
    label: 'Trabajo en día de asueto (diurno)',
    legalBasis: 'Art. 192 C.T. · Recargo del 100% adicional (2.00x)',
    multiplier: 2.0,
  },
  {
    id: 'holiday_night',
    label: 'Trabajo en día de asueto (nocturno)',
    legalBasis: 'Art. 168 y 192 C.T. · 100% asueto + 25% nocturnidad (2.25x)',
    multiplier: 2.25,
  },
];

export interface HourlyAndOvertimeResult {
  monthlyGross: number;
  monthlyNet: number;
  daysPerMonth: number;
  hoursPerDay: number;
  totalHoursPerMonth: number;
  grossDaily: number;
  netDaily: number;
  grossHourly: number;
  netHourly: number;
  legalBaseHourly: number; // Siempre sobre 30 días y 8 horas para cálculo legal de horas extra
  overtimeRates: Array<
    OvertimeRateRule & {
      hourlyRateUsd: number;
    }
  >;
}

export function calcHourlyAndOvertime(
  monthlyGross: number,
  monthlyNet: number,
  daysPerMonth: number = 30,
  hoursPerDay: number = 8
): HourlyAndOvertimeResult {
  const safeGross = Math.max(0, monthlyGross);
  const safeNet = Math.max(0, monthlyNet);
  const safeDays = Math.max(1, daysPerMonth);
  const safeHours = Math.max(1, hoursPerDay);
  const totalHoursPerMonth = safeDays * safeHours;

  const grossDaily = round2(safeGross / safeDays);
  const netDaily = round2(safeNet / safeDays);
  const grossHourly = round2(safeGross / totalHoursPerMonth);
  const netHourly = round2(safeNet / totalHoursPerMonth);

  // Para recargos de ley, el Código de Trabajo toma salario / 30 / horasJornada
  const legalBaseHourly = safeGross / 30 / safeHours;

  const overtimeRates = OVERTIME_RULES.map((rule) => ({
    ...rule,
    hourlyRateUsd: round2(legalBaseHourly * rule.multiplier),
  }));

  return {
    monthlyGross: safeGross,
    monthlyNet: safeNet,
    daysPerMonth: safeDays,
    hoursPerDay: safeHours,
    totalHoursPerMonth,
    grossDaily,
    netDaily,
    grossHourly,
    netHourly,
    legalBaseHourly: round2(legalBaseHourly),
    overtimeRates,
  };
}

// ============================================================================
// CÁLCULO DE INCAPACIDADES MÉDICAS Y SUBSIDIOS (ISSS Y CÓDIGO DE TRABAJO)
// ============================================================================

export type IncapacityType = 'common_illness' | 'work_accident' | 'maternity';

export interface IncapacityCalculationParams {
  monthlySalary: number;
  days: number;
  type: IncapacityType;
  /**
   * Si el patrono paga voluntariamente el 100% en los días a su cargo en vez del 75% de ley.
   */
  employerPays100FirstDays?: boolean;
}

export interface IncapacityCalculationResult {
  monthlySalary: number;
  dailyRealSalary: number;
  dailyCotizableSalary: number;
  isSalaryCappedByISSS: boolean;
  type: IncapacityType;
  totalDays: number;
  employerDays: number;
  isssDays: number;
  employerRate: number;
  isssRate: number;
  employerDailyAmount: number;
  employerTotalPay: number;
  isssDailySubsidio: number;
  isssTotalSubsidio: number;
  totalIncapacityPay: number;
  regularEquivalentGross: number;
  wageLoss: number;
  maxDailySubsidioCap: number;
}

/**
 * Calcula el desglose de pago de incapacidades según la Ley del ISSS y el Código de Trabajo de El Salvador:
 *
 * 1. Enfermedad Común:
 *    - Días 1 a 3 (período de espera del ISSS): corre por cuenta del patrono al 75% del salario básico (Art. 307 C.T.).
 *    - Día 4 en adelante: subsidio pagado por el ISSS al 75% del salario cotizable promedio (topado a $1,000/mes).
 * 2. Accidente de Trabajo o Enfermedad Profesional (Riesgos Profesionales):
 *    - Desde el día 1 corre a cargo del ISSS al 75% del salario cotizable diario (no hay período de espera de 3 días).
 * 3. Maternidad (16 semanas / 112 días):
 *    - Cubierto por el ISSS al 100% del salario cotizable diario (topado a $1,000/mes = $33.33/día).
 */
export function calcIncapacity({
  monthlySalary,
  days,
  type,
  employerPays100FirstDays = false,
}: IncapacityCalculationParams): IncapacityCalculationResult {
  const safeSalary = Math.max(0, monthlySalary);
  const totalDays = Math.max(0, Math.floor(days));

  const dailyRealSalary = round2(safeSalary / 30);
  const cappedMonthly = Math.min(safeSalary, RATES.ISSS_CAP_MONTHLY);
  const dailyCotizableSalary = round2(cappedMonthly / 30);
  const isSalaryCappedByISSS = safeSalary > RATES.ISSS_CAP_MONTHLY;

  let employerDays = 0;
  let isssDays = 0;
  let isssRate = 0.75;
  const employerRate = employerPays100FirstDays ? 1.0 : 0.75;

  if (type === 'common_illness') {
    employerDays = Math.min(totalDays, 3);
    isssDays = Math.max(0, totalDays - 3);
    isssRate = 0.75;
  } else if (type === 'work_accident') {
    employerDays = 0;
    isssDays = totalDays;
    isssRate = 0.75;
  } else if (type === 'maternity') {
    employerDays = 0;
    isssDays = totalDays;
    isssRate = 1.0;
  }

  const employerDailyAmount = round2(dailyRealSalary * employerRate);
  const employerTotalPay = round2(employerDailyAmount * employerDays);

  const isssDailySubsidio = round2(dailyCotizableSalary * isssRate);
  const isssTotalSubsidio = round2(isssDailySubsidio * isssDays);

  const totalIncapacityPay = round2(employerTotalPay + isssTotalSubsidio);
  const regularEquivalentGross = round2(dailyRealSalary * totalDays);
  const wageLoss = round2(Math.max(0, regularEquivalentGross - totalIncapacityPay));
  const maxDailySubsidioCap = round2((RATES.ISSS_CAP_MONTHLY / 30) * isssRate);

  return {
    monthlySalary: safeSalary,
    dailyRealSalary,
    dailyCotizableSalary,
    isSalaryCappedByISSS,
    type,
    totalDays,
    employerDays,
    isssDays,
    employerRate,
    isssRate,
    employerDailyAmount,
    employerTotalPay,
    isssDailySubsidio,
    isssTotalSubsidio,
    totalIncapacityPay,
    regularEquivalentGross,
    wageLoss,
    maxDailySubsidioCap,
  };
}

/**
 * Modos de terminación o cálculo de liquidación laboral en El Salvador
 */
export type LiquidacionMotivo =
  | 'despido_injustificado'
  | 'renuncia_voluntaria'
  | 'liquidacion_anual'
  | 'despido_indirecto'
  | 'despido_justificado'
  | 'mutuo_acuerdo'
  | 'fin_contrato';

export interface LiquidacionInput {
  monthlySalary: number;
  hireDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  motivo: LiquidacionMotivo;
  salarioPendienteDias?: number; // Días laborados adeudados en la quincena/mes
  sectorId?: MinimumWageSector['id']; // Sector económico para salarios mínimos (default: comercio)
  pactoPorcentajeMutuo?: number; // % acordado de indemnización en mutuo acuerdo (default: 100)
}

export interface LiquidacionResult {
  monthlySalary: number;
  dailyRealSalary: number;
  hireDate: string;
  endDate: string;
  motivo: LiquidacionMotivo;
  motivoLabel: string;
  motivoDescription: string;
  legalArticles: string[];
  seniority: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
    formattedSeniority: string;
    yearsEquivalent: number;
  };
  indemnizacion: {
    applies: boolean;
    daysComputed: number;
    baseMonthlySalary: number;
    dailyBaseSalary: number;
    isCapped: boolean;
    monthlyCap: number;
    dailyCap: number;
    amount: number;
    explanation: string;
    isExemptISR: boolean;
  };
  derechosAdquiridos: {
    vacacionDays: number;
    vacacionRawAmount: number;
    vacacionBonus30: number;
    vacacionTotal: number;
    vacacionDaysInPeriod: number;
    aguinaldoSeniorityDays: number;
    aguinaldoDaysInPeriod: number;
    aguinaldoAmount: number;
    aguinaldoIsExempt: boolean;
    salarioPendienteDias: number;
    salarioPendienteAmount: number;
    total: number;
  };
  totalLiquidacion: number;
  totalExentoISR: number;
  totalGravadoISR: number;
  notes: string[];
}

/**
 * Calcula la liquidación laboral y finiquito según el Código de Trabajo de El Salvador
 * y la Ley Reguladora de la Prestación Económica por Renuncia Voluntaria (D.L. 592).
 */
export function calcLiquidacion(input: LiquidacionInput): LiquidacionResult {
  const safeSalary = Math.max(0, Number.isFinite(input.monthlySalary) ? input.monthlySalary : 0);
  const dailyRealSalary = round2(safeSalary / 30);
  const sector = MINIMUM_WAGES_2026[input.sectorId ?? 'comercio'];
  const salarioPendienteDias = Math.max(0, Math.round(input.salarioPendienteDias ?? 0));

  const hire = new Date(`${input.hireDate}T00:00:00`);
  const end = new Date(`${input.endDate}T00:00:00`);

  const isValidDates =
    Boolean(input.hireDate) &&
    Boolean(input.endDate) &&
    !Number.isNaN(hire.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end >= hire;

  let y = 0;
  let m = 0;
  let d = 0;
  let totalDays = 0;

  if (isValidDates) {
    y = end.getFullYear() - hire.getFullYear();
    m = end.getMonth() - hire.getMonth();
    d = end.getDate() - hire.getDate();

    if (d < 0) {
      const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      d += prevMonthLastDay;
      m -= 1;
    }
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    const diffMs = end.getTime() - hire.getTime();
    totalDays = Math.max(0, Math.floor(diffMs / 86_400_000)) + 1; // inclusivo
  }

  const parts: string[] = [];
  if (y > 0) parts.push(`${y} ${y === 1 ? 'año' : 'años'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  if (d > 0 || parts.length === 0) parts.push(`${d} ${d === 1 ? 'día' : 'días'}`);
  const formattedSeniority = isValidDates ? parts.join(', ') : 'Fechas inválidas';
  const yearsEquivalent = isValidDates ? round2(totalDays / 365) : 0;

  // 1. Vacación Proporcional (Art. 177 y 187 Código de Trabajo)
  // Calcula días transcurridos desde el último aniversario de ingreso
  let vacacionDaysInPeriod = 0;
  let vacacionDays = 0;
  let vacacionRawAmount = 0;
  let vacacionBonus30 = 0;
  let vacacionTotal = 0;

  if (isValidDates && totalDays > 0) {
    const endYear = end.getFullYear();
    let lastAnniversary = new Date(endYear, hire.getMonth(), hire.getDate());
    if (lastAnniversary > end) {
      lastAnniversary = new Date(endYear - 1, hire.getMonth(), hire.getDate());
    }
    // Si aún no cumple 1 año, su inicio de cómputo es hireDate
    const vacPeriodStart = y >= 1 ? lastAnniversary : hire;
    const diffVac = Math.floor((end.getTime() - vacPeriodStart.getTime()) / 86_400_000) + 1;
    vacacionDaysInPeriod = Math.min(365, Math.max(1, diffVac));

    if (input.motivo === 'liquidacion_anual' && (y >= 1 || totalDays >= 360)) {
      // Liquidación anual regular completa (15 días)
      vacacionDays = 15;
    } else {
      vacacionDays = round2((vacacionDaysInPeriod / 365) * 15);
    }
    vacacionRawAmount = round2(vacacionDays * (safeSalary / 30));
    vacacionBonus30 = round2(vacacionRawAmount * 0.3);
    vacacionTotal = round2(vacacionRawAmount + vacacionBonus30);
  }

  // 2. Aguinaldo Proporcional (Art. 196-202 Código de Trabajo)
  // Periodo oficial: del 12 de diciembre del año anterior al 11 de diciembre del corriente
  let aguinaldoSeniorityDays = 15;
  if (y >= 10) aguinaldoSeniorityDays = 21;
  else if (y >= 3) aguinaldoSeniorityDays = 19;
  else aguinaldoSeniorityDays = 15;

  let aguinaldoDaysInPeriod = 0;
  let aguinaldoAmount = 0;

  if (isValidDates && totalDays > 0) {
    const endYear = end.getFullYear();
    let priorDec12 = new Date(endYear - 1, 11, 12); // 12 dic año anterior
    if (end.getMonth() === 11 && end.getDate() >= 12) {
      priorDec12 = new Date(endYear, 11, 12);
    }
    const agPeriodStart = hire > priorDec12 ? hire : priorDec12;
    const diffAg = Math.floor((end.getTime() - agPeriodStart.getTime()) / 86_400_000) + 1;
    aguinaldoDaysInPeriod = Math.min(365, Math.max(1, diffAg));

    if (input.motivo === 'liquidacion_anual' && (y >= 1 || totalDays >= 360)) {
      aguinaldoAmount = round2(aguinaldoSeniorityDays * (safeSalary / 30));
    } else {
      aguinaldoAmount = round2((aguinaldoDaysInPeriod / 365) * aguinaldoSeniorityDays * (safeSalary / 30));
    }
  }
  const aguinaldoIsExempt = aguinaldoAmount <= RATES.AGUINALDO_DECREE_EXEMPTION;

  // 3. Salario Pendiente Adeudado
  const salarioPendienteAmount = round2(salarioPendienteDias * dailyRealSalary);

  // 4. Indemnización o Compensación Económica según Motivo
  let appliesIndemnizacion = false;
  let daysComputed = 0;
  let isCapped = false;
  let baseMonthlySalary = safeSalary;
  let dailyBaseSalary = dailyRealSalary;
  let monthlyCap = 0;
  let dailyCap = 0;
  let indemnizacionAmount = 0;
  let explanation = '';
  let motivoLabel = '';
  let motivoDescription = '';
  const legalArticles: string[] = [];
  const notes: string[] = [];

  // Topes legales
  const cap4SalariosMinimos = round2(sector.monthly * 4); // Art. 58 Código de Trabajo
  const cap2SalariosMinimosDiarios = round2(sector.daily * 2); // Art. 8 Ley D.L. 592

  switch (input.motivo) {
    case 'despido_injustificado': {
      motivoLabel = 'Despido sin causa justificada (Injustificado)';
      motivoDescription = 'Terminación unilateral del contrato de trabajo por parte del empleador sin causal legal acreditada.';
      legalArticles.push('Art. 58 Código de Trabajo de El Salvador', 'Art. 4 num. 3 Ley de Impuesto sobre la Renta');
      notes.push('Exento de retención de Impuesto sobre la Renta (ISR), ISSS y AFP según la legislación vigente.');
      notes.push('En ningún caso la indemnización puede ser inferior a 15 días de salario básico (Art. 58 inc. 2).');

      if (isValidDates && totalDays > 0) {
        appliesIndemnizacion = true;
        // 30 días de salario por año completo más fracción proporcional
        const endYear = end.getFullYear();
        let lastAnniversary = new Date(endYear, hire.getMonth(), hire.getDate());
        if (lastAnniversary > end) {
          lastAnniversary = new Date(endYear - 1, hire.getMonth(), hire.getDate());
        }
        const fracDays = y >= 1 ? Math.max(0, Math.floor((end.getTime() - lastAnniversary.getTime()) / 86_400_000)) : totalDays;
        const rawDays = y * 30 + (fracDays / 365) * 30;
        daysComputed = round2(Math.max(15, rawDays));

        monthlyCap = cap4SalariosMinimos;
        dailyCap = round2(cap4SalariosMinimos / 30);
        isCapped = safeSalary > monthlyCap;
        baseMonthlySalary = isCapped ? monthlyCap : safeSalary;
        dailyBaseSalary = round2(baseMonthlySalary / 30);
        indemnizacionAmount = round2((daysComputed / 30) * baseMonthlySalary);

        explanation = isCapped
          ? `Calculado sobre 30 días/año (garantía mín. 15 días). Aplica tope de 4 salarios mínimos mensuales ($${monthlyCap.toFixed(2)}).`
          : 'Calculado sobre 30 días de salario básico por cada año laborado y proporcional por meses y días.';
      }
      break;
    }

    case 'despido_indirecto': {
      motivoLabel = 'Despido indirecto (Retiro por culpa del empleador)';
      motivoDescription = 'El trabajador se da por despedido debido a faltas graves del empleador (falta de pago, rebaja salarial, malos tratos o acoso).';
      legalArticles.push('Art. 53 y 58 Código de Trabajo de El Salvador', 'Art. 4 num. 3 Ley de ISR');
      notes.push('La ley reconoce el mismo derecho indemnizatorio que un despido sin justa causa.');
      notes.push('Exento de ISR, ISSS y AFP.');

      if (isValidDates && totalDays > 0) {
        appliesIndemnizacion = true;
        const endYear = end.getFullYear();
        let lastAnniversary = new Date(endYear, hire.getMonth(), hire.getDate());
        if (lastAnniversary > end) {
          lastAnniversary = new Date(endYear - 1, hire.getMonth(), hire.getDate());
        }
        const fracDays = y >= 1 ? Math.max(0, Math.floor((end.getTime() - lastAnniversary.getTime()) / 86_400_000)) : totalDays;
        const rawDays = y * 30 + (fracDays / 365) * 30;
        daysComputed = round2(Math.max(15, rawDays));

        monthlyCap = cap4SalariosMinimos;
        dailyCap = round2(cap4SalariosMinimos / 30);
        isCapped = safeSalary > monthlyCap;
        baseMonthlySalary = isCapped ? monthlyCap : safeSalary;
        dailyBaseSalary = round2(baseMonthlySalary / 30);
        indemnizacionAmount = round2((daysComputed / 30) * baseMonthlySalary);

        explanation = isCapped
          ? `Equivalente a despido injustificado (Art. 53 y 58). Aplica tope de 4 salarios mínimos ($${monthlyCap.toFixed(2)}).`
          : 'Equivalente a despido injustificado: 30 días por año y proporcional con garantía mínima de 15 días.';
      }
      break;
    }

    case 'renuncia_voluntaria': {
      motivoLabel = 'Renuncia voluntaria con prestación de ley';
      motivoDescription = 'Dimisión voluntaria del empleado amparada en la Ley Reguladora de la Prestación Económica por Renuncia Voluntaria (D.L. 592).';
      legalArticles.push('Ley Reguladora de la Prestación Económica por Renuncia Voluntaria (D.L. 592)', 'Art. 4 num. 3 Ley de ISR');

      if (!isValidDates || totalDays === 0) {
        appliesIndemnizacion = false;
        explanation = 'Fechas no válidas.';
      } else if (y < 2) {
        appliesIndemnizacion = false;
        daysComputed = 0;
        indemnizacionAmount = 0;
        explanation = `No genera prestación económica por renuncia: el D.L. 592 exige al menos 2 años cumplidos de servicio continuo en la empresa (antigüedad calculada: ${formattedSeniority}).`;
        notes.push('Al tener menos de 2 años de servicio, la renuncia solo liquida los derechos adquiridos (vacaciones, aguinaldo y salarios devengados).');
      } else {
        appliesIndemnizacion = true;
        const endYear = end.getFullYear();
        let lastAnniversary = new Date(endYear, hire.getMonth(), hire.getDate());
        if (lastAnniversary > end) {
          lastAnniversary = new Date(endYear - 1, hire.getMonth(), hire.getDate());
        }
        const fracDays = Math.max(0, Math.floor((end.getTime() - lastAnniversary.getTime()) / 86_400_000));
        daysComputed = round2(y * 15 + (fracDays / 365) * 15);
        dailyCap = cap2SalariosMinimosDiarios;
        monthlyCap = round2(dailyCap * 30);
        isCapped = dailyRealSalary > dailyCap;
        dailyBaseSalary = isCapped ? dailyCap : dailyRealSalary;
        baseMonthlySalary = round2(dailyBaseSalary * 30);
        indemnizacionAmount = round2((daysComputed / 30) * baseMonthlySalary);

        explanation = isCapped
          ? `15 días de salario por año laborado (D.L. 592). Aplica tope de 2 salarios mínimos diarios ($${dailyCap.toFixed(2)}/día o $${monthlyCap.toFixed(2)}/mes).`
          : '15 días de salario básico por cada año de servicio continuo y proporcional por fracciones de año.';
        notes.push('Exige preaviso formal por escrito: 15 días para empleados operativos o 30 días para cargos de jefatura o técnicos especializados.');
        notes.push('Prestación exenta de retención de Impuesto sobre la Renta (ISR), ISSS y AFP.');
      }
      break;
    }

    case 'liquidacion_anual': {
      motivoLabel = 'Liquidación anual / Finiquito de fin de año';
      motivoDescription = 'Corte periódico anual pactado por la empresa o convención colectiva para abonar pasivo laboral y derechos al 31 de diciembre.';
      legalArticles.push('Código de Trabajo de El Salvador', 'Práctica laboral empresarial y pactos colectivos');
      notes.push('Modalidad utilizada por empresas salvadoreñas para no acumular pasivo laboral plurianual.');
      notes.push('Comprende 1 mes de salario base o proporcional del año, más aguinaldo de diciembre y vacación anual completa.');

      if (isValidDates && totalDays > 0) {
        appliesIndemnizacion = true;
        const daysInCurrentYear = Math.min(365, totalDays);
        if (daysInCurrentYear >= 365 || y >= 1) {
          daysComputed = 30;
          indemnizacionAmount = safeSalary;
        } else {
          daysComputed = round2((daysInCurrentYear / 365) * 30);
          indemnizacionAmount = round2((daysInCurrentYear / 365) * safeSalary);
        }
        baseMonthlySalary = safeSalary;
        dailyBaseSalary = dailyRealSalary;
        isCapped = false;
        explanation = y >= 1
          ? 'Compensación/indemnización de 1 mes completo de salario pactado por el año laborado.'
          : `Compensación proporcional a ${totalDays} días laborados en el año en curso.`;
      }
      break;
    }

    case 'mutuo_acuerdo': {
      motivoLabel = 'Terminación por mutuo acuerdo';
      motivoDescription = 'Convenio bilateral de cese de labores con gratificación o indemnización pactada entre patrono y trabajador.';
      legalArticles.push('Art. 54 Código de Trabajo de El Salvador', 'Art. 4 num. 3 Ley de ISR');
      notes.push('Para tener plena validez jurídica debe formalizarse en acta ante el Ministerio de Trabajo (MTPS) o ante notario en documento privado autenticado.');

      if (isValidDates && totalDays > 0) {
        appliesIndemnizacion = true;
        const pactoPorcentaje = Math.min(100, Math.max(0, input.pactoPorcentajeMutuo ?? 100));
        const fullIndemnizacionDays = (totalDays / 365) * 30;
        daysComputed = round2((Math.max(15, fullIndemnizacionDays) * pactoPorcentaje) / 100);

        monthlyCap = cap4SalariosMinimos;
        dailyCap = round2(cap4SalariosMinimos / 30);
        isCapped = safeSalary > monthlyCap;
        baseMonthlySalary = isCapped ? monthlyCap : safeSalary;
        dailyBaseSalary = round2(baseMonthlySalary / 30);
        indemnizacionAmount = round2(daysComputed * dailyBaseSalary);

        explanation = `Monto acordado al ${pactoPorcentaje}% de la indemnización por despido${
          isCapped ? ` (topado a $${monthlyCap.toFixed(2)})` : ''
        }.`;
      }
      break;
    }

    case 'despido_justificado': {
      motivoLabel = 'Despido con causa justificada';
      motivoDescription = 'Terminación por falta grave o causal legal imputable al trabajador según el Artículo 50 del Código de Trabajo.';
      legalArticles.push('Art. 50 Código de Trabajo de El Salvador');
      appliesIndemnizacion = false;
      daysComputed = 0;
      indemnizacionAmount = 0;
      explanation = 'No genera derecho a indemnización económica. La ley garantiza únicamente el pago de derechos adquiridos irrenunciables.';
      notes.push('El empleador debe comprobar la causal ante los tribunales en caso de controversia.');
      notes.push('Los derechos adquiridos (vacaciones, aguinaldo proporcional y salarios pendientes) son inalienables.');
      break;
    }

    case 'fin_contrato': {
      motivoLabel = 'Vencimiento de contrato a plazo fijo';
      motivoDescription = 'Expiración del plazo estipulado en contratos legalmente sujetos a plazo determinado.';
      legalArticles.push('Arts. 25, 48 y 51 Código de Trabajo de El Salvador');
      appliesIndemnizacion = false;
      daysComputed = 0;
      indemnizacionAmount = 0;
      explanation = 'No genera indemnización por despido al haberse cumplido el plazo pactado legalmente.';
      notes.push('Solo corresponden los derechos adquiridos proporcionales generados durante el plazo del contrato.');
      break;
    }
  }

  const totalDerechosAdquiridos = round2(vacacionTotal + aguinaldoAmount + salarioPendienteAmount);
  const totalLiquidacion = round2(indemnizacionAmount + totalDerechosAdquiridos);

  // Tratamiento fiscal (ISR)
  // Indemnización y prestación D.L. 592 están 100% exentas según Art. 4 num. 3 Ley de ISR.
  // Aguinaldo exento hasta $1,500.
  const aguinaldoExento = Math.min(aguinaldoAmount, RATES.AGUINALDO_DECREE_EXEMPTION);
  const aguinaldoGravado = Math.max(0, aguinaldoAmount - RATES.AGUINALDO_DECREE_EXEMPTION);

  const totalExentoISR = round2(indemnizacionAmount + aguinaldoExento);
  const totalGravadoISR = round2(salarioPendienteAmount + vacacionTotal + aguinaldoGravado);

  return {
    monthlySalary: safeSalary,
    dailyRealSalary,
    hireDate: input.hireDate,
    endDate: input.endDate,
    motivo: input.motivo,
    motivoLabel,
    motivoDescription,
    legalArticles,
    seniority: {
      years: y,
      months: m,
      days: d,
      totalDays,
      formattedSeniority,
      yearsEquivalent,
    },
    indemnizacion: {
      applies: appliesIndemnizacion,
      daysComputed,
      baseMonthlySalary,
      dailyBaseSalary,
      isCapped,
      monthlyCap,
      dailyCap,
      amount: indemnizacionAmount,
      explanation,
      isExemptISR: true,
    },
    derechosAdquiridos: {
      vacacionDays,
      vacacionRawAmount,
      vacacionBonus30,
      vacacionTotal,
      vacacionDaysInPeriod,
      aguinaldoSeniorityDays,
      aguinaldoDaysInPeriod,
      aguinaldoAmount,
      aguinaldoIsExempt,
      salarioPendienteDias,
      salarioPendienteAmount,
      total: totalDerechosAdquiridos,
    },
    totalLiquidacion,
    totalExentoISR,
    totalGravadoISR,
    notes,
  };
}


