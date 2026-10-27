import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Check } from 'lucide-react';
import {
  RATES,
  round2,
  calcDaysBetweenInclusive,
  type VacationCalculationResult,
  type AguinaldoCalculationResult,
  type Quincena25CalculationResult,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
} from '../lib/svLaborLaw.ts';

interface BonusesViewProps {
  monthlySalary: number;
  monthlyNetPay: number;
  biweeklyNetPay: number;
  totalAnnualNetBonuses: number;
  quincena25Result: Quincena25CalculationResult;
  vacationResult: VacationCalculationResult;
  aguinaldoResult: AguinaldoCalculationResult;
  q25FullYear: boolean;
  setQ25FullYear: (v: boolean) => void;
  q25DaysWorked: number;
  setQ25DaysWorked: (v: number) => void;
  q25HireDate: string;
  setQ25HireDate: (v: string) => void;
  q25VoluntaryAboveCap: boolean;
  setQ25VoluntaryAboveCap: (v: boolean) => void;
  seniority: SeniorityBracket;
  setSeniority: (v: SeniorityBracket) => void;
  aguinaldoDaysUnder1: number;
  setAguinaldoDaysUnder1: (v: number) => void;
  aguinaldoHireDate: string;
  setAguinaldoHireDate: (v: string) => void;
  aguinaldoExemptionRule: AguinaldoExemptionRule;
  setAguinaldoExemptionRule: (v: AguinaldoExemptionRule) => void;
  vacationSector: 'privado' | 'publico';
  setVacationSector: (v: 'privado' | 'publico') => void;
  vacationBonusPct: number;
  setVacationBonusPct: (v: number) => void;
  vacationMode: 'bonus_only' | 'full_advance';
  setVacationMode: (v: 'bonus_only' | 'full_advance') => void;
  splitDays: [number, number, number];
  setSplitDays: (v: [number, number, number]) => void;
  formatUSD: (val: number) => string;
}

export function BonusesView({
  monthlySalary,
  monthlyNetPay,
  biweeklyNetPay,
  totalAnnualNetBonuses,
  quincena25Result,
  vacationResult,
  aguinaldoResult,
  q25FullYear,
  setQ25FullYear,
  q25DaysWorked,
  setQ25DaysWorked,
  q25HireDate,
  setQ25HireDate,
  q25VoluntaryAboveCap,
  setQ25VoluntaryAboveCap,
  seniority,
  setSeniority,
  aguinaldoDaysUnder1,
  setAguinaldoDaysUnder1,
  aguinaldoHireDate,
  setAguinaldoHireDate,
  aguinaldoExemptionRule,
  setAguinaldoExemptionRule,
  vacationSector,
  setVacationSector,
  vacationBonusPct,
  setVacationBonusPct,
  vacationMode,
  setVacationMode,
  splitDays,
  setSplitDays,
  formatUSD,
}: BonusesViewProps) {
  return (
    <motion.div
      key="tab-bonuses"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Annual Legal Bonuses Timeline Strip */}
      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-serif-editorial text-lg font-semibold">
              Calendario Anual de Prestaciones y Bonos de Ley
            </h2>
            <p className="text-xs text-[#65635E]">
              Resumen de ingresos adicionales garantizados por la legislación laboral salvadoreña
            </p>
          </div>
          <div className="bg-[#0F4C3A]/10 text-[#0F4C3A] px-3.5 py-1.5 rounded-xl text-xs font-mono-tabular font-semibold">
            Total Anual Neto en Bonos: +{formatUSD(totalAnnualNetBonuses)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Milestone 1: Enero Quincena 25 */}
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono-tabular font-semibold uppercase text-[#0F4C3A]">
                15 – 25 de Enero
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#0F4C3A] text-white font-mono-tabular">
                Obligatoria 2027
              </span>
            </div>
            <h3 className="font-serif-editorial font-semibold text-base">Quincena 25 (Decreto 499)</h3>
            <p className="text-xs text-[#65635E] mt-1">
              50% del salario mensual nominal (hasta $1,500), 100% libre de ISSS, AFP y Renta.
            </p>
            <div className="mt-3 pt-2.5 border-t border-[#E2DFD7] flex justify-between items-baseline">
              <span className="text-xs text-[#65635E]">Líquido a recibir:</span>
              <span className="font-mono-tabular font-bold text-base text-[#0F4C3A]">
                {formatUSD(quincena25Result.netQuincena25)}
              </span>
            </div>
          </div>

          {/* Milestone 2: Vacación 30% */}
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono-tabular font-semibold uppercase text-[#B45309]">
                Anual / Por Tramos
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#B45309]/15 text-[#B45309] font-mono-tabular">
                Art. 177 C.T.
              </span>
            </div>
            <h3 className="font-serif-editorial font-semibold text-base">
              Vacación Anual (15 días + 30%)
            </h3>
            <p className="text-xs text-[#65635E] mt-1">
              Recargo legal del 30% sobre una quincena ({formatUSD(vacationResult.bonus30Gross)} bruto).
            </p>
            <div className="mt-3 pt-2.5 border-t border-[#E2DFD7] flex justify-between items-baseline">
              <span className="text-xs text-[#65635E]">Bono 30% neto est.:</span>
              <span className="font-mono-tabular font-bold text-base text-[#141413]">
                {formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
              </span>
            </div>
          </div>

          {/* Milestone 3: Aguinaldo */}
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono-tabular font-semibold uppercase text-[#1D4ED8]">
                1 Oct – 20 Diciembre
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1D4ED8]/15 text-[#1D4ED8] font-mono-tabular">
                15 / 19 / 21 días
              </span>
            </div>
            <h3 className="font-serif-editorial font-semibold text-base">Aguinaldo de Ley</h3>
            <p className="text-xs text-[#65635E] mt-1">
              Libre de ISSS y AFP. Exento de ISR hasta {formatUSD(aguinaldoResult.exemptionLimit)}.
            </p>
            <div className="mt-3 pt-2.5 border-t border-[#E2DFD7] flex justify-between items-baseline">
              <span className="text-xs text-[#65635E]">Líquido a recibir:</span>
              <span className="font-mono-tabular font-bold text-base text-[#0F4C3A]">
                {formatUSD(aguinaldoResult.netAguinaldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards for the 3 Legal Bonuses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARD A: QUINCENA 25 (OBLIGATORIA ENERO 2027) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-[#EFECE6]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-tabular uppercase px-2 py-0.5 rounded-md bg-[#0F4C3A] text-white font-semibold">
                    Decreto N.º 499 · Obligatoria 2027
                  </span>
                  {quincena25Result.eligibleByLaw ? (
                    <span className="text-[11px] font-medium text-[#0F4C3A] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Elegible por ley
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#B45309] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Supera tope $1,500
                    </span>
                  )}
                </div>
                <h3 className="font-serif-editorial text-xl font-semibold mt-1">
                  Quincena 25 (15 al 25 de Enero)
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2DFD7]">
                <span className="font-medium text-[#141413]">Tiempo laborado al 25 de enero:</span>
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#DFDCD2]">
                  <button
                    type="button"
                    onClick={() => setQ25FullYear(true)}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      q25FullYear ? 'bg-[#0F4C3A] text-white' : 'text-[#65635E]'
                    }`}
                  >
                    1 año o más (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ25FullYear(false)}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      !q25FullYear ? 'bg-[#0F4C3A] text-white' : 'text-[#65635E]'
                    }`}
                  >
                    Proporcional (&lt; 1 año)
                  </button>
                </div>
              </div>

              {!q25FullYear && (
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-[#4A4945] font-medium">
                      Fecha de ingreso (corte al 25 de enero 2027):
                    </label>
                    <input
                      type="date"
                      value={q25HireDate}
                      onChange={(e) => {
                        setQ25HireDate(e.target.value);
                        const days = calcDaysBetweenInclusive(e.target.value, '2027-01-25');
                        if (days > 0) setQ25DaysWorked(days);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#DFDCD2] bg-white font-mono-tabular text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={q25DaysWorked}
                      onChange={(e) => setQ25DaysWorked(Number(e.target.value))}
                      className="flex-1 accent-[#0F4C3A]"
                    />
                    <span className="font-mono-tabular font-semibold w-24 text-right">
                      {q25DaysWorked} / 365 días
                    </span>
                  </div>
                </div>
              )}

              {monthlySalary > RATES.QUINCENA_25_CAP && (
                <label className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer">
                  <span>
                    Tu salario supera $1,500.00. ¿Simular otorgamiento voluntario de la empresa?
                  </span>
                  <input
                    type="checkbox"
                    checked={q25VoluntaryAboveCap}
                    onChange={(e) => setQ25VoluntaryAboveCap(e.target.checked)}
                    className="w-4 h-4 accent-[#0F4C3A]"
                  />
                </label>
              )}

              <div className="space-y-2 pt-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-[#65635E]">Base de cálculo (50% salario mensual)</span>
                  <span className="font-mono-tabular font-medium">
                    {formatUSD(round2(monthlySalary * 0.5))}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#65635E]">Factor de antigüedad</span>
                  <span className="font-mono-tabular font-medium">
                    {round2(quincena25Result.proportionFactor * 100)}% ({quincena25Result.daysWorked} días)
                  </span>
                </div>
                <div className="flex justify-between py-1 text-[#0F4C3A]">
                  <span>Descuentos ISSS, AFP y Renta (Decreto 499)</span>
                  <span className="font-mono-tabular font-semibold">$0.00 (Exento 100%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EFECE6]">
            <div className="p-4 rounded-xl bg-[#0F4C3A]/8 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C3A] block">
                  Quincena 25 Neta a Recibir
                </span>
                <span className="text-xs text-[#4A4945]">{quincena25Result.legalNote}</span>
              </div>
              <span className="text-2xl font-mono-tabular font-bold text-[#0F4C3A] shrink-0 ml-3">
                {formatUSD(quincena25Result.netQuincena25)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD B: AGUINALDO DE LEY */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-[#EFECE6]">
              <div>
                <span className="text-[11px] font-mono-tabular uppercase px-2 py-0.5 rounded-md bg-[#1D4ED8]/10 text-[#1D4ED8] font-semibold">
                  Arts. 196–202 C.T. · Pago 1 Oct – 20 Dic
                </span>
                <h3 className="font-serif-editorial text-xl font-semibold mt-1">
                  Aguinaldo por Antigüedad
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#65635E] font-medium mb-1.5">
                  Tramo de antigüedad cumplida al 12 de diciembre:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'under-1', title: '< 1 año', sub: 'Proporcional' },
                      { id: '1-to-3', title: '1 a < 3 años', sub: '15 días' },
                      { id: '3-to-10', title: '3 a < 10 años', sub: '19 días' },
                      { id: '10-plus', title: '10+ años', sub: '21 días' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSeniority(item.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        seniority === item.id
                          ? 'border-[#0F4C3A] bg-[#0F4C3A]/8 text-[#141413]'
                          : 'border-[#DFDCD2] bg-white text-[#65635E] hover:border-[#141413]/30'
                      }`}
                    >
                      <div className="font-semibold text-xs text-[#141413]">{item.title}</div>
                      <div className="font-mono-tabular text-[11px] text-[#0F4C3A]">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {seniority === 'under-1' && (
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-[#4A4945] font-medium">
                      Fecha de ingreso (corte al 12 de diciembre):
                    </label>
                    <input
                      type="date"
                      value={aguinaldoHireDate}
                      onChange={(e) => {
                        setAguinaldoHireDate(e.target.value);
                        const year = new Date().getFullYear();
                        const days = calcDaysBetweenInclusive(e.target.value, `${year}-12-12`);
                        if (days > 0) setAguinaldoDaysUnder1(days);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#DFDCD2] bg-white font-mono-tabular text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={aguinaldoDaysUnder1}
                      onChange={(e) => setAguinaldoDaysUnder1(Number(e.target.value))}
                      className="flex-1 accent-[#0F4C3A]"
                    />
                    <span className="font-mono-tabular font-semibold w-24 text-right">
                      {aguinaldoDaysUnder1} / 365 días
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2DFD7]">
                <span className="text-[#4A4945] font-medium">Techo de exención de Renta (ISR):</span>
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#DFDCD2]">
                  <button
                    type="button"
                    onClick={() => setAguinaldoExemptionRule('decreto_1500')}
                    className={`px-2 py-1 rounded-md font-mono-tabular cursor-pointer ${
                      aguinaldoExemptionRule === 'decreto_1500'
                        ? 'bg-[#0F4C3A] text-white'
                        : 'text-[#65635E]'
                    }`}
                  >
                    Decreto $1,500
                  </button>
                  <button
                    type="button"
                    onClick={() => setAguinaldoExemptionRule('dos_minimos')}
                    className={`px-2 py-1 rounded-md font-mono-tabular cursor-pointer ${
                      aguinaldoExemptionRule === 'dos_minimos'
                        ? 'bg-[#0F4C3A] text-white'
                        : 'text-[#65635E]'
                    }`}
                  >
                    2 Mínimos ($817.60)
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-[#65635E]">
                    Salario diario ({formatUSD(aguinaldoResult.dailySalary)}) × {aguinaldoResult.equivalentDays}{' '}
                    días
                    {aguinaldoResult.isProportional ? ` × (${aguinaldoResult.daysWorked}/365)` : ''}
                  </span>
                  <span className="font-mono-tabular font-medium">
                    {formatUSD(aguinaldoResult.grossAguinaldo)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#65635E]">Monto exento de ISR</span>
                  <span className="font-mono-tabular text-[#0F4C3A]">
                    {formatUSD(aguinaldoResult.exemptAmount)}
                  </span>
                </div>
                {aguinaldoResult.taxableExcess > 0 ? (
                  <div className="flex justify-between py-1 text-[#B91C1C]">
                    <span>ISR sobre excedente gravado ({formatUSD(aguinaldoResult.taxableExcess)})</span>
                    <span className="font-mono-tabular font-medium">
                      -{formatUSD(aguinaldoResult.isrWithheld)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between py-1 text-[#0F4C3A]">
                    <span>
                      Retención ISR (No supera techo de {formatUSD(aguinaldoResult.exemptionLimit)})
                    </span>
                    <span className="font-mono-tabular font-semibold">$0.00</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EFECE6]">
            <div className="p-4 rounded-xl bg-[#0F4C3A]/8 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C3A] block">
                  Aguinaldo Líquido a Recibir
                </span>
                <span className="text-xs text-[#4A4945]">
                  Sin descuento de ISSS ni AFP · {aguinaldoResult.seniorityLabel}
                </span>
              </div>
              <span className="text-2xl font-mono-tabular font-bold text-[#0F4C3A] shrink-0 ml-3">
                {formatUSD(aguinaldoResult.netAguinaldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD C: VACACIÓN ANUAL (15 DÍAS + 30%) & TRAMOS */}
      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EFECE6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-tabular uppercase px-2 py-0.5 rounded-md bg-[#B45309]/15 text-[#B45309] font-semibold">
                Art. 177 Código de Trabajo
              </span>
              <span className="text-xs text-[#65635E]">15 días remunerados + 30% de recargo</span>
            </div>
            <h3 className="font-serif-editorial text-xl font-semibold mt-1">
              Vacación Anual: Comparativa de Modalidades y División por Períodos
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex bg-[#EFECE6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVacationSector('privado')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                  vacationSector === 'privado' ? 'bg-white shadow-2xs text-[#141413]' : 'text-[#65635E]'
                }`}
              >
                Sector Privado (30%)
              </button>
              <button
                type="button"
                onClick={() => setVacationSector('publico')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                  vacationSector === 'publico' ? 'bg-white shadow-2xs text-[#141413]' : 'text-[#65635E]'
                }`}
              >
                Sector Público (Servicio Civil)
              </button>
            </div>

            {vacationSector === 'privado' && (
              <div className="flex items-center gap-1.5 bg-[#F6F5F0] px-3 py-1.5 rounded-xl border border-[#E2DFD7]">
                <span className="text-[#65635E]">% Bono:</span>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={vacationBonusPct}
                  onChange={(e) => setVacationBonusPct(Math.max(0, Number(e.target.value) || 30))}
                  className="w-12 font-mono-tabular font-semibold text-center bg-white border border-[#DFDCD2] rounded-md py-0.5"
                />
                <span className="font-mono-tabular">%</span>
              </div>
            )}
          </div>
        </div>

        {vacationSector === 'publico' ? (
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] text-sm text-[#4A4945] flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0F4C3A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#141413] block mb-1">
                Régimen de Ley de Salarios / Servicio Civil (Sector Público)
              </strong>
              En el sector público las vacaciones se gozan como descanso remunerado en tres períodos anuales
              (Semana Santa, Fiestas Agostinas y Fin de Año) manteniendo el salario mensual ordinario (
              {formatUSD(monthlyNetPay)} líquidos), sin pago adicional del 30% salvo que exista contrato
              colectivo o escalafón especial en la institución.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setVacationMode('bonus_only')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  vacationMode === 'bonus_only'
                    ? 'border-[#0F4C3A] bg-[#0F4C3A]/4 shadow-xs'
                    : 'border-[#DFDCD2] bg-[#FAF9F5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono-tabular uppercase font-semibold text-[#0F4C3A]">
                      Práctica A · Solo Recargo 30%
                    </span>
                    {vacationMode === 'bonus_only' && <Check className="w-4 h-4 text-[#0F4C3A]" />}
                  </div>
                  <h4 className="font-serif-editorial font-semibold text-base">
                    Pago separado del Bono 30%
                  </h4>
                  <p className="text-xs text-[#65635E] mt-1">
                    Tu quincena ordinaria ({formatUSD(biweeklyNetPay)} netos) se paga normal en planilla y la
                    empresa deposita adicionalmente el 30% vacacional:
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs font-mono-tabular border-t border-[#E2DFD7] pt-2.5">
                    <div className="flex justify-between">
                      <span className="font-sans text-[#4A4945]">
                        Bono 30% Bruto (15d × {vacationBonusPct}%):
                      </span>
                      <strong className="text-sm">{formatUSD(vacationResult.bonus30Gross)}</strong>
                    </div>
                    <div className="flex justify-between text-[#B45309]">
                      <span className="font-sans">- AFP sobre bono (7.25%):</span>
                      <span>-{formatUSD(vacationResult.bonusOnlyMode.afp)}</span>
                    </div>
                    <div className="flex justify-between text-[#2563EB]">
                      <span className="font-sans">- ISSS sobre bono (margen bajo tope):</span>
                      <span>-{formatUSD(vacationResult.bonusOnlyMode.isss)}</span>
                    </div>
                    <div className="flex justify-between text-[#B91C1C]">
                      <span className="font-sans">- ISR diferencial estimado:</span>
                      <span>-{formatUSD(vacationResult.bonusOnlyMode.isrEstimated)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DFDCD2] flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#0F4C3A]">Bono 30% Neto real:</span>
                  <span className="text-xl font-mono-tabular font-bold text-[#0F4C3A]">
                    {formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setVacationMode('full_advance')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  vacationMode === 'full_advance'
                    ? 'border-[#0F4C3A] bg-[#0F4C3A]/4 shadow-xs'
                    : 'border-[#DFDCD2] bg-[#FAF9F5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono-tabular uppercase font-semibold text-[#B45309]">
                      Práctica B · Liquidación Completa
                    </span>
                    {vacationMode === 'full_advance' && <Check className="w-4 h-4 text-[#0F4C3A]" />}
                  </div>
                  <h4 className="font-serif-editorial font-semibold text-base">
                    Adelanto 15 días + Bono 30%
                  </h4>
                  <p className="text-xs text-[#65635E] mt-1">
                    Se adelanta la quincena completa ({formatUSD(vacationResult.base15DaysGross)}) más el 30% (
                    {formatUSD(vacationResult.bonus30Gross)}) en un solo recibo antes de salir a vacaciones:
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs font-mono-tabular border-t border-[#E2DFD7] pt-2.5">
                    <div className="flex justify-between">
                      <span className="font-sans text-[#4A4945]">Total Bruto (15d + 30%):</span>
                      <strong className="text-sm">{formatUSD(vacationResult.completeVacationGross)}</strong>
                    </div>
                    <div className="flex justify-between text-[#B45309]">
                      <span className="font-sans">- AFP (7.25%):</span>
                      <span>-{formatUSD(vacationResult.fullAdvanceMode.afp)}</span>
                    </div>
                    <div className="flex justify-between text-[#2563EB]">
                      <span className="font-sans">- ISSS (tope quincenal $15):</span>
                      <span>-{formatUSD(vacationResult.fullAdvanceMode.isss)}</span>
                    </div>
                    <div className="flex justify-between text-[#B91C1C]">
                      <span className="font-sans">- ISR quincenal + bono:</span>
                      <span>-{formatUSD(vacationResult.fullAdvanceMode.isr)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DFDCD2] flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#141413]">Total Líquido (15d + 30%):</span>
                  <span className="text-xl font-mono-tabular font-bold text-[#0F4C3A]">
                    {formatUSD(vacationResult.fullAdvanceMode.netTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FAF9F5] p-4 rounded-xl border border-[#E2DFD7] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif-editorial font-semibold text-base">
                    División de Vacaciones en Períodos (15 días)
                  </h4>
                  <span className="text-[11px] font-mono-tabular text-[#65635E]">
                    Suma: {splitDays[0] + splitDays[1] + splitDays[2]} / 15 días
                  </span>
                </div>
                <p className="text-xs text-[#65635E] mb-3">
                  Si en tu empresa dividen los 15 días en Semana Santa, Agosto y Diciembre, ajusta los días de
                  cada tramo:
                </p>

                <div className="space-y-2.5">
                  {vacationResult.splits.map((tramo, idx) => (
                    <div
                      key={tramo.name}
                      className="bg-white p-2.5 rounded-lg border border-[#DFDCD2] flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#141413]">{tramo.name}</div>
                        <div className="text-[11px] text-[#65635E] font-mono-tabular">
                          Bono 30% bruto: {formatUSD(tramo.bonus30Part)} · Neto: {formatUSD(tramo.netBonusPart)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={splitDays[idx]}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(15, Number(e.target.value) || 0));
                            const next: [number, number, number] = [...splitDays] as [number, number, number];
                            next[idx] = val;
                            setSplitDays(next);
                          }}
                          className="w-12 text-center font-mono-tabular font-semibold border border-[#DFDCD2] rounded-md py-1"
                        />
                        <span className="text-[#65635E]">días</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E2DFD7] flex justify-between items-center text-xs text-[#65635E]">
                <span>Salario diario base: {formatUSD(vacationResult.dailySalary)}/día</span>
                <button
                  type="button"
                  onClick={() => setSplitDays([5, 5, 5])}
                  className="text-[#0F4C3A] hover:underline font-medium cursor-pointer"
                >
                  Restablecer 5 / 5 / 5
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
