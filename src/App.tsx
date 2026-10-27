import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Calendar, Clock } from 'lucide-react';
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

type MainTab = 'payroll' | 'bonuses' | 'hourly';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
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

  const totalAnnualNetBonuses = useMemo(() => {
    const vacNet =
      vacationSector === 'publico'
        ? 0
        : vacationMode === 'bonus_only'
          ? vacationResult.bonusOnlyMode.netBonusAfterDeductions
          : round2(vacationResult.fullAdvanceMode.netTotal - biweeklyPayroll.netPay);
    return round2(vacNet + aguinaldoResult.netAguinaldo + quincena25Result.netQuincena25);
  }, [vacationSector, vacationMode, vacationResult, biweeklyPayroll.netPay, aguinaldoResult, quincena25Result]);

  const isrMarkerPercent = useMemo(() => {
    const t = activePayroll.taxableIncome;
    const maxScale = period === 'monthly' ? 2600 : 1300;
    return Math.min(98, Math.max(2, (t / maxScale) * 100));
  }, [activePayroll.taxableIncome, period]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#141413]">
      <header className="border-b border-[#E2DFD7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C3A] text-white flex items-center justify-center font-mono-tabular font-semibold text-sm">
              SV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-editorial text-xl font-semibold tracking-tight">
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
                <div className="sm:col-span-6 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]">
                    Salario Base Mensual (USD)
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-mono-tabular text-[#65635E]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={salaryInput}
                      onChange={(e) => handleSalaryTextChange(e.target.value)}
                      className="w-full text-2xl font-mono-tabular font-semibold bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]">
                    Bono / Comisión Mes
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-mono-tabular text-[#65635E]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={bonusInput}
                      onChange={(e) => handleBonusTextChange(e.target.value)}
                      className="w-full text-xl font-mono-tabular font-medium bg-transparent focus:outline-none"
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
                        className={`relative py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                          period === p ? 'text-[#141413]' : 'text-[#65635E]'
                        }`}
                      >
                        {period === p && (
                          <motion.div
                            layoutId="periodPill"
                            className="absolute inset-0 bg-white rounded-md shadow-2xs"
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
                    className={`text-[11px] font-mono-tabular px-2.5 py-1 rounded-full border cursor-pointer ${
                      Math.abs(monthlySalary - preset.value) < 0.05
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-white text-[#4A4945] border-[#DFDCD2]'
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
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Descuentos de Ley</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#B91C1C]">
                  -{formatUSD(activePayroll.totalEmployeeDeductions)}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Valor Hora Neta</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#141413]">
                  {formatUSD(hourlyResult.netHourly)}/h
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Bonos Anuales (Neto)</span>
                <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                  +{formatUSD(totalAnnualNetBonuses)}
                </div>
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
              totalAnnualNetBonuses={totalAnnualNetBonuses}
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
        </AnimatePresence>
      </main>
    </div>
  );
}
