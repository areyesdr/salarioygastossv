import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Scale } from 'lucide-react';
import {
  calcPayroll,
  calcHourlyAndOvertime,
  MINIMUM_WAGES_2026,
  type PayPeriod,
} from './lib/svLaborLaw.ts';
import { PayrollView } from './components/PayrollView.tsx';

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
  const hourlyResult = useMemo(
    () => calcHourlyAndOvertime(monthlyPayroll.grossTotal, monthlyPayroll.netPay, 30, 8),
    [monthlyPayroll.grossTotal, monthlyPayroll.netPay]
  );

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
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

          <div className="flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] bg-[#0F4C3A]/10 px-3 py-1.5 rounded-lg">
            <Scale className="w-3.5 h-3.5" />
            <span>Descuentos y Renta</span>
          </div>
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
                  { label: '$800', value: 800 },
                  { label: 'Tope ISSS $1,000', value: 1000 },
                  { label: 'Tope Q25 $1,500', value: 1500 },
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

            <div className="lg:col-span-6 grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">
                  Líquido {period === 'monthly' ? 'Mensual' : 'Quincenal'}
                </span>
                <div className="mt-1 text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                  {formatUSD(activePayroll.netPay)}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Descuentos de Ley</span>
                <div className="mt-1 text-xl font-mono-tabular font-semibold text-[#B91C1C]">
                  -{formatUSD(activePayroll.totalEmployeeDeductions)}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                <span className="text-[11px] text-[#65635E] block">Valor Hora Neta</span>
                <div className="mt-1 text-xl font-mono-tabular font-semibold text-[#141413]">
                  {formatUSD(hourlyResult.netHourly)}/h
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PayrollView
          period={period}
          activePayroll={activePayroll}
          monthlyPayroll={monthlyPayroll}
          monthlyBaseOnlyPayroll={monthlyBaseOnlyPayroll}
          extraMonthlyBonus={extraMonthlyBonus}
          isrMarkerPercent={isrMarkerPercent}
          formatUSD={formatUSD}
        />
      </main>
    </div>
  );
}
