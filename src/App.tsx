import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Calendar, Clock, Wallet } from 'lucide-react';
import {
  calcPayroll,
  calcVacation,
  calcAguinaldo,
  calcQuincena25,
  calcHourlyAndOvertime,
  MINIMUM_WAGES_2026,
  round2,
  type PayPeriod,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
  type OvertimeTypeId,
} from './lib/svLaborLaw.ts';
import { PayrollView } from './components/PayrollView.tsx';
import { BonusesView } from './components/BonusesView.tsx';
import { HourlyView } from './components/HourlyView.tsx';
import {
  ExpensesView,
  type ExpenseCategory,
  type ExpenseCycle,
  type ExpenseItem,
  type BonusGoalItem,
} from './components/ExpensesView.tsx';

type MainTab = 'payroll' | 'bonuses' | 'hourly' | 'expenses';

const DEFAULT_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    name: 'Alquiler / Cuota de vivienda',
    amount: 320,
    category: 'Vivienda',
    cycle: 'quincena_1',
    isFixed: true,
    paid: true,
  },
  {
    id: 'exp-2',
    name: 'Supermercado y mercado',
    amount: 210,
    category: 'Alimentación',
    cycle: 'mensual',
    isFixed: false,
    paid: false,
  },
  {
    id: 'exp-3',
    name: 'Energía eléctrica, agua e internet',
    amount: 78,
    category: 'Servicios',
    cycle: 'quincena_2',
    isFixed: true,
    paid: false,
  },
  {
    id: 'exp-4',
    name: 'Combustible / Transporte público',
    amount: 85,
    category: 'Transporte',
    cycle: 'mensual',
    isFixed: false,
    paid: false,
  },
  {
    id: 'exp-5',
    name: 'Fondo de ahorro mensual',
    amount: 90,
    category: 'Ahorro',
    cycle: 'quincena_2',
    isFixed: true,
    paid: false,
  },
];

const DEFAULT_BONUS_GOALS: BonusGoalItem[] = [
  {
    id: 'bg-1',
    title: 'Gastos de inicio de año y matrícula (Enero)',
    source: 'quincena25',
    amount: 300,
  },
  {
    id: 'bg-2',
    title: 'Descanso familiar y mantenimiento hogar',
    source: 'vacacion',
    amount: 135,
  },
  {
    id: 'bg-3',
    title: 'Fondo de emergencia y amortización de deuda (Diciembre)',
    source: 'aguinaldo',
    amount: 450,
  },
];

const STORAGE_KEY = 'salarioygastossv_state_v1';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins > 0 ? `${whole}h ${mins}m` : `${whole}h`;
}

export default function App() {
  const [monthlySalary, setMonthlySalary] = useState<number>(1000);
  const [salaryInput, setSalaryInput] = useState<string>('1000');
  const [extraMonthlyBonus, setExtraMonthlyBonus] = useState<number>(0);
  const [bonusInput, setBonusInput] = useState<string>('0');
  const [period, setPeriod] = useState<PayPeriod>('monthly');
  const [activeTab, setActiveTab] = useState<MainTab>('payroll');

  // Vacation state
  const [vacationBonusPct, setVacationBonusPct] = useState<number>(30);
  const [vacationMode, setVacationMode] = useState<'bonus_only' | 'full_advance'>('bonus_only');
  const [vacationSector, setVacationSector] = useState<'privado' | 'publico'>('privado');
  const [splitDays, setSplitDays] = useState<[number, number, number]>([5, 5, 5]);

  // Aguinaldo state
  const [seniority, setSeniority] = useState<SeniorityBracket>('1-to-3');
  const [aguinaldoDaysUnder1, setAguinaldoDaysUnder1] = useState<number>(210);
  const [aguinaldoHireDate, setAguinaldoHireDate] = useState<string>('2026-05-15');
  const [aguinaldoExemptionRule, setAguinaldoExemptionRule] = useState<AguinaldoExemptionRule>('decreto_1500');

  // Quincena 25 state
  const [q25FullYear, setQ25FullYear] = useState<boolean>(true);
  const [q25DaysWorked, setQ25DaysWorked] = useState<number>(250);
  const [q25HireDate, setQ25HireDate] = useState<string>('2026-05-15');
  const [q25VoluntaryAboveCap, setQ25VoluntaryAboveCap] = useState<boolean>(false);

  // Hourly & overtime state
  const [daysPerMonth, setDaysPerMonth] = useState<number>(30);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [overtimeHoursMap, setOvertimeHoursMap] = useState<Record<OvertimeTypeId, number>>({
    ordinary: 0,
    extra_day: 4,
    extra_night: 2,
    rest_day: 0,
    rest_night: 0,
    holiday_day: 0,
    holiday_night: 0,
  });

  // Personal expenses state
  const [expenses, setExpenses] = useState<ExpenseItem[]>(DEFAULT_EXPENSES);
  const [expenseFilterCycle, setExpenseFilterCycle] = useState<'all' | ExpenseCycle>('all');
  const [newExpName, setNewExpName] = useState<string>('');
  const [newExpAmount, setNewExpAmount] = useState<string>('');
  const [newExpCategory, setNewExpCategory] = useState<ExpenseCategory>('Alimentación');
  const [newExpCycle, setNewExpCycle] = useState<ExpenseCycle>('mensual');
  const [newExpFixed, setNewExpFixed] = useState<boolean>(true);

  // Bonus allocation goals
  const [bonusGoals, setBonusGoals] = useState<BonusGoalItem[]>(DEFAULT_BONUS_GOALS);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalAmount, setNewGoalAmount] = useState<string>('');
  const [newGoalSource, setNewGoalSource] = useState<BonusGoalItem['source']>('quincena25');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.monthlySalary === 'number' && parsed.monthlySalary >= 0) {
        setMonthlySalary(parsed.monthlySalary);
        setSalaryInput(String(parsed.monthlySalary));
      }
      if (typeof parsed.extraMonthlyBonus === 'number' && parsed.extraMonthlyBonus >= 0) {
        setExtraMonthlyBonus(parsed.extraMonthlyBonus);
        setBonusInput(String(parsed.extraMonthlyBonus));
      }
      if (parsed.period === 'monthly' || parsed.period === 'biweekly') {
        setPeriod(parsed.period);
      }
      if (parsed.seniority) {
        setSeniority(parsed.seniority);
      }
      if (typeof parsed.daysPerMonth === 'number') setDaysPerMonth(parsed.daysPerMonth);
      if (typeof parsed.hoursPerDay === 'number') setHoursPerDay(parsed.hoursPerDay);
      if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (Array.isArray(parsed.bonusGoals)) setBonusGoals(parsed.bonusGoals);
    } catch {
      // Ignore malformed localStorage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          monthlySalary,
          extraMonthlyBonus,
          period,
          seniority,
          daysPerMonth,
          hoursPerDay,
          expenses,
          bonusGoals,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [monthlySalary, extraMonthlyBonus, period, seniority, daysPerMonth, hoursPerDay, expenses, bonusGoals]);

  const monthlyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'monthly', extraMonthlyBonus),
    [monthlySalary, extraMonthlyBonus]
  );
  const monthlyBaseOnlyPayroll = useMemo(() => calcPayroll(monthlySalary, 'monthly', 0), [monthlySalary]);
  const biweeklyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'biweekly', extraMonthlyBonus),
    [monthlySalary, extraMonthlyBonus]
  );
  const activePayroll = period === 'monthly' ? monthlyPayroll : biweeklyPayroll;

  const vacationResult = useMemo(
    () => calcVacation(monthlySalary, vacationBonusPct, splitDays),
    [monthlySalary, vacationBonusPct, splitDays]
  );

  const aguinaldoResult = useMemo(
    () =>
      calcAguinaldo({
        monthlySalary,
        seniorityBracket: seniority,
        daysWorkedUnderOneYear: aguinaldoDaysUnder1,
        exemptionRule: aguinaldoExemptionRule,
      }),
    [monthlySalary, seniority, aguinaldoDaysUnder1, aguinaldoExemptionRule]
  );

  const quincena25Result = useMemo(
    () =>
      calcQuincena25({
        monthlySalary,
        isFullYear: q25FullYear,
        daysWorkedToJan25: q25DaysWorked,
        simulateVoluntaryAboveCap: q25VoluntaryAboveCap,
      }),
    [monthlySalary, q25FullYear, q25DaysWorked, q25VoluntaryAboveCap]
  );

  const hourlyResult = useMemo(
    () => calcHourlyAndOvertime(monthlyPayroll.grossTotal, monthlyPayroll.netPay, daysPerMonth, hoursPerDay),
    [monthlyPayroll.grossTotal, monthlyPayroll.netPay, daysPerMonth, hoursPerDay]
  );

  const totalSimulatedOvertimeUsd = useMemo(() => {
    return round2(
      hourlyResult.overtimeRates.reduce((acc, rate) => {
        const count = overtimeHoursMap[rate.id] || 0;
        return acc + rate.hourlyRateUsd * count;
      }, 0)
    );
  }, [hourlyResult.overtimeRates, overtimeHoursMap]);

  const expenseSummary = useMemo(() => {
    let q1Total = 0;
    let q2Total = 0;
    let monthlySplitTotal = 0;
    let fixedTotal = 0;
    let variableTotal = 0;
    const byCategory: Record<ExpenseCategory, number> = {
      Vivienda: 0,
      Alimentación: 0,
      Transporte: 0,
      Servicios: 0,
      Deudas: 0,
      Salud: 0,
      Educación: 0,
      Ahorro: 0,
      Ocio: 0,
    };

    for (const item of expenses) {
      const amt = Math.max(0, item.amount);
      byCategory[item.category] = round2((byCategory[item.category] || 0) + amt);
      if (item.isFixed) fixedTotal += amt;
      else variableTotal += amt;

      if (item.cycle === 'quincena_1') {
        q1Total += amt;
      } else if (item.cycle === 'quincena_2') {
        q2Total += amt;
      } else {
        monthlySplitTotal += amt;
        q1Total += amt / 2;
        q2Total += amt / 2;
      }
    }

    const totalMonthlyExpenses = round2(
      expenses.reduce((sum, item) => sum + Math.max(0, item.amount), 0)
    );
    const netMonthly = monthlyPayroll.netPay;
    const netBiweekly = biweeklyPayroll.netPay;
    const remainingMonthly = round2(netMonthly - totalMonthlyExpenses);
    const remainingQ1 = round2(netBiweekly - q1Total);
    const remainingQ2 = round2(netBiweekly - q2Total);
    const totalHoursRequired =
      hourlyResult.netHourly > 0 ? round2(totalMonthlyExpenses / hourlyResult.netHourly) : 0;

    return {
      totalMonthlyExpenses,
      q1Total: round2(q1Total),
      q2Total: round2(q2Total),
      monthlySplitTotal: round2(monthlySplitTotal),
      fixedTotal: round2(fixedTotal),
      variableTotal: round2(variableTotal),
      remainingMonthly,
      remainingQ1,
      remainingQ2,
      totalHoursRequired,
      byCategory,
    };
  }, [expenses, monthlyPayroll.netPay, biweeklyPayroll.netPay, hourlyResult.netHourly]);

  const annualBonusesSummary = useMemo(() => {
    const vacNet =
      vacationSector === 'publico'
        ? 0
        : vacationMode === 'bonus_only'
          ? vacationResult.bonusOnlyMode.netBonusAfterDeductions
          : round2(vacationResult.fullAdvanceMode.netTotal - biweeklyPayroll.netPay);
    const vacGross = vacationSector === 'publico' ? 0 : vacationResult.bonus30Gross;
    const agNet = aguinaldoResult.netAguinaldo;
    const q25Net = quincena25Result.netQuincena25;

    const totalAnnualNetBonuses = round2(vacNet + agNet + q25Net);
    const totalAnnualGrossBonuses = round2(
      vacGross + aguinaldoResult.grossAguinaldo + quincena25Result.grossQuincena25
    );
    const allocatedTotal = round2(bonusGoals.reduce((acc, g) => acc + Math.max(0, g.amount), 0));
    const unallocated = round2(totalAnnualNetBonuses - allocatedTotal);

    return {
      vacNet,
      agNet,
      q25Net,
      totalAnnualNetBonuses,
      totalAnnualGrossBonuses,
      allocatedTotal,
      unallocated,
    };
  }, [
    vacationSector,
    vacationMode,
    vacationResult,
    biweeklyPayroll.netPay,
    aguinaldoResult,
    quincena25Result,
    bonusGoals,
  ]);

  const handleSalaryTextChange = (val: string) => {
    setSalaryInput(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setMonthlySalary(parsed);
    } else if (val.trim() === '') {
      setMonthlySalary(0);
    }
  };

  const handleBonusTextChange = (val: string) => {
    setBonusInput(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setExtraMonthlyBonus(parsed);
    } else if (val.trim() === '') {
      setExtraMonthlyBonus(0);
    }
  };

  const applyPresetSalary = (amount: number) => {
    setMonthlySalary(amount);
    setSalaryInput(amount.toFixed(2).replace(/\.00$/, ''));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpAmount);
    if (!newExpName.trim() || Number.isNaN(amt) || amt <= 0) return;
    const item: ExpenseItem = {
      id: `exp-${Date.now()}`,
      name: newExpName.trim(),
      amount: round2(amt),
      category: newExpCategory,
      cycle: newExpCycle,
      isFixed: newExpFixed,
      paid: false,
    };
    setExpenses((prev) => [item, ...prev]);
    setNewExpName('');
    setNewExpAmount('');
  };

  const handleToggleExpensePaid = (id: string) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, paid: !item.paid } : item)));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddBonusGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newGoalAmount);
    if (!newGoalTitle.trim() || Number.isNaN(amt) || amt <= 0) return;
    setBonusGoals((prev) => [
      ...prev,
      {
        id: `bg-${Date.now()}`,
        title: newGoalTitle.trim(),
        source: newGoalSource,
        amount: round2(amt),
      },
    ]);
    setNewGoalTitle('');
    setNewGoalAmount('');
  };

  const handleDeleteBonusGoal = (id: string) => {
    setBonusGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const isrMarkerPercent = useMemo(() => {
    const t = activePayroll.taxableIncome;
    const maxScale = period === 'monthly' ? 2600 : 1300;
    return Math.min(98, Math.max(2, (t / maxScale) * 100));
  }, [activePayroll.taxableIncome, period]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilterCycle === 'all') return expenses;
    return expenses.filter((e) => e.cycle === expenseFilterCycle);
  }, [expenses, expenseFilterCycle]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#141413]">
      <header className="border-b border-[#E2DFD7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C3A] text-white flex items-center justify-center font-mono-tabular font-semibold text-sm shadow-xs">
              SV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-editorial text-xl font-semibold tracking-tight text-[#141413]">
                  Salario y Gastos SV
                </h1>
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] font-medium">
                  Ley 2026 · Q25 2027
                </span>
              </div>
              <p className="text-xs text-[#65635E]">
                ISSS, AFP, Renta, Vacación 30%, Aguinaldo, Quincena 25, Costo por Hora y Presupuesto
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#EFECE6] p-1 rounded-xl overflow-x-auto">
            {(
              [
                { id: 'payroll', label: 'Descuentos y Renta', icon: Scale },
                { id: 'bonuses', label: 'Bonos de Ley y Q25', icon: Calendar },
                { id: 'hourly', label: 'Costo Hora y Extras', icon: Clock },
                { id: 'expenses', label: 'Gastos y Presupuesto', icon: Wallet },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-[#141413]' : 'text-[#65635E] hover:text-[#141413]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMainTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-[#E2DFD7]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 text-[#0F4C3A]" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <section className="border-b border-[#E2DFD7] bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs focus-within:border-[#0F4C3A] transition-colors">
                  <label
                    htmlFor="salary-input"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]"
                  >
                    Salario Base Mensual (USD)
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-mono-tabular text-[#65635E]">$</span>
                    <input
                      id="salary-input"
                      type="number"
                      min="0"
                      step="10"
                      value={salaryInput}
                      onChange={(e) => handleSalaryTextChange(e.target.value)}
                      className="w-full text-2xl font-mono-tabular font-semibold text-[#141413] bg-transparent focus:outline-none"
                      placeholder="1000.00"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs focus-within:border-[#0F4C3A] transition-colors">
                  <label
                    htmlFor="bonus-input"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]"
                  >
                    Bono / Comisión Mes
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-mono-tabular text-[#65635E]">$</span>
                    <input
                      id="bonus-input"
                      type="number"
                      min="0"
                      step="10"
                      value={bonusInput}
                      onChange={(e) => handleBonusTextChange(e.target.value)}
                      className="w-full text-xl font-mono-tabular font-medium text-[#141413] bg-transparent focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 bg-white p-2 rounded-xl border border-[#DFDCD2] flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#65635E] px-1">
                    Frecuencia de Pago
                  </span>
                  <div className="grid grid-cols-2 gap-1 bg-[#EFECE6] p-1 rounded-lg mt-1">
                    {(['monthly', 'biweekly'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        className={`relative py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          period === p ? 'text-[#141413]' : 'text-[#65635E]'
                        }`}
                      >
                        {period === p && (
                          <motion.div
                            layoutId="periodPill"
                            className="absolute inset-0 bg-white rounded-md shadow-2xs"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{p === 'monthly' ? 'Mensual' : 'Quincenal'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[#65635E] mr-1">Referencias:</span>
                {[
                  { label: 'Mín. Comercio $408.80', value: MINIMUM_WAGES_2026.comercio.monthly },
                  { label: 'Mín. Maquila $402.32', value: MINIMUM_WAGES_2026.maquila.monthly },
                  { label: 'Exento ISR $550', value: 606.06 },
                  { label: '$800', value: 800 },
                  { label: 'Tope ISSS $1,000', value: 1000 },
                  { label: 'Tope Q25 $1,500', value: 1500 },
                  { label: '$2,200', value: 2200 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPresetSalary(preset.value)}
                    className={`text-[11px] font-mono-tabular px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      Math.abs(monthlySalary - preset.value) < 0.05
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-white text-[#4A4945] border-[#DFDCD2] hover:border-[#0F4C3A]/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">
                  Líquido {period === 'monthly' ? 'Mensual' : 'Quincenal'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                  {formatUSD(activePayroll.netPay)}
                </div>
                <span className="text-[11px] font-mono-tabular text-[#65635E]">
                  {period === 'monthly'
                    ? `${formatUSD(biweeklyPayroll.netPay)} / quincena`
                    : `${formatUSD(monthlyPayroll.netPay)} / mes`}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Descuentos de Ley</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#B91C1C]">
                  -{formatUSD(activePayroll.totalEmployeeDeductions)}
                </div>
                <span className="text-[11px] font-mono-tabular text-[#65635E]">
                  {activePayroll.effectiveDeductionPct}% · {activePayroll.isrDetail.bracketLabel}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Valor Hora Neta</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#141413]">
                  {formatUSD(hourlyResult.netHourly)}
                  <span className="text-xs font-normal text-[#65635E]">/h</span>
                </div>
                <span className="text-[11px] font-mono-tabular text-[#65635E]">
                  Bruta: {formatUSD(hourlyResult.grossHourly)}/h
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Bonos Anuales (Neto)</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                  +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                </div>
                <span className="text-[11px] font-mono-tabular text-[#65635E]">
                  Vac. + Agui. + Q25
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'payroll' && (
            <PayrollView
              period={period}
              activePayroll={activePayroll}
              monthlyPayroll={monthlyPayroll}
              monthlyBaseOnlyPayroll={monthlyBaseOnlyPayroll}
              extraMonthlyBonus={extraMonthlyBonus}
              isrMarkerPercent={isrMarkerPercent}
              formatUSD={formatUSD}
            />
          )}

          {activeTab === 'bonuses' && (
            <BonusesView
              monthlySalary={monthlySalary}
              monthlyNetPay={monthlyPayroll.netPay}
              biweeklyNetPay={biweeklyPayroll.netPay}
              totalAnnualNetBonuses={annualBonusesSummary.totalAnnualNetBonuses}
              quincena25Result={quincena25Result}
              vacationResult={vacationResult}
              aguinaldoResult={aguinaldoResult}
              q25FullYear={q25FullYear}
              setQ25FullYear={setQ25FullYear}
              q25DaysWorked={q25DaysWorked}
              setQ25DaysWorked={setQ25DaysWorked}
              q25HireDate={q25HireDate}
              setQ25HireDate={setQ25HireDate}
              q25VoluntaryAboveCap={q25VoluntaryAboveCap}
              setQ25VoluntaryAboveCap={setQ25VoluntaryAboveCap}
              seniority={seniority}
              setSeniority={setSeniority}
              aguinaldoDaysUnder1={aguinaldoDaysUnder1}
              setAguinaldoDaysUnder1={setAguinaldoDaysUnder1}
              aguinaldoHireDate={aguinaldoHireDate}
              setAguinaldoHireDate={setAguinaldoHireDate}
              aguinaldoExemptionRule={aguinaldoExemptionRule}
              setAguinaldoExemptionRule={setAguinaldoExemptionRule}
              vacationSector={vacationSector}
              setVacationSector={setVacationSector}
              vacationBonusPct={vacationBonusPct}
              setVacationBonusPct={setVacationBonusPct}
              vacationMode={vacationMode}
              setVacationMode={setVacationMode}
              splitDays={splitDays}
              setSplitDays={setSplitDays}
              formatUSD={formatUSD}
            />
          )}

          {activeTab === 'hourly' && (
            <HourlyView
              daysPerMonth={daysPerMonth}
              setDaysPerMonth={setDaysPerMonth}
              hoursPerDay={hoursPerDay}
              setHoursPerDay={setHoursPerDay}
              hourlyResult={hourlyResult}
              overtimeHoursMap={overtimeHoursMap}
              setOvertimeHoursMap={setOvertimeHoursMap}
              totalSimulatedOvertimeUsd={totalSimulatedOvertimeUsd}
              onSimulateOvertimeInPayroll={(amt) => {
                setExtraMonthlyBonus(amt);
                setBonusInput(String(amt));
                setActiveTab('payroll');
              }}
              formatUSD={formatUSD}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              monthlyNetPay={monthlyPayroll.netPay}
              netHourly={hourlyResult.netHourly}
              totalHoursPerMonth={hourlyResult.totalHoursPerMonth}
              expenseSummary={expenseSummary}
              annualBonusesSummary={annualBonusesSummary}
              filteredExpenses={filteredExpenses}
              expenseFilterCycle={expenseFilterCycle}
              setExpenseFilterCycle={setExpenseFilterCycle}
              newExpName={newExpName}
              setNewExpName={setNewExpName}
              newExpAmount={newExpAmount}
              setNewExpAmount={setNewExpAmount}
              newExpCategory={newExpCategory}
              setNewExpCategory={setNewExpCategory}
              newExpCycle={newExpCycle}
              setNewExpCycle={setNewExpCycle}
              newExpFixed={newExpFixed}
              setNewExpFixed={setNewExpFixed}
              onAddExpense={handleAddExpense}
              onToggleExpensePaid={handleToggleExpensePaid}
              onDeleteExpense={handleDeleteExpense}
              onResetDefaultExpenses={() => setExpenses(DEFAULT_EXPENSES)}
              bonusGoals={bonusGoals}
              newGoalTitle={newGoalTitle}
              setNewGoalTitle={setNewGoalTitle}
              newGoalAmount={newGoalAmount}
              setNewGoalAmount={setNewGoalAmount}
              newGoalSource={newGoalSource}
              setNewGoalSource={setNewGoalSource}
              onAddBonusGoal={handleAddBonusGoal}
              onDeleteBonusGoal={handleDeleteBonusGoal}
              formatUSD={formatUSD}
              formatHours={formatHours}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-[#E2DFD7] bg-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#65635E]">
          <div>
            <strong className="text-[#141413]">Salario y Gastos SV</strong> · Basado en el Código de
            Trabajo de El Salvador, Ley del ISSS, Ley SAP (AFP), Tablas de Retención ISR (Decreto 254) y
            Ley Quincena 25 (Decreto 499, obligatoria 2027).
          </div>
          <div className="font-mono-tabular text-[11px]">
            Salarios mínimos vigentes: Comercio {formatUSD(MINIMUM_WAGES_2026.comercio.monthly)} · Maquila{' '}
            {formatUSD(MINIMUM_WAGES_2026.maquila.monthly)} · Agro{' '}
            {formatUSD(MINIMUM_WAGES_2026.agropecuario.monthly)}
          </div>
        </div>
      </footer>
    </div>
  );
}
