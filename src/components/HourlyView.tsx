import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import {
  round2,
  type HourlyAndOvertimeResult,
  type OvertimeTypeId,
} from '../lib/svLaborLaw.ts';

interface HourlyViewProps {
  daysPerMonth: number;
  setDaysPerMonth: (v: number) => void;
  hoursPerDay: number;
  setHoursPerDay: (v: number) => void;
  hourlyResult: HourlyAndOvertimeResult;
  overtimeHoursMap: Record<OvertimeTypeId, number>;
  setOvertimeHoursMap: React.Dispatch<React.SetStateAction<Record<OvertimeTypeId, number>>>;
  totalSimulatedOvertimeUsd: number;
  onSimulateOvertimeInPayroll: (amount: number) => void;
  formatUSD: (val: number) => string;
}

export function HourlyView({
  daysPerMonth,
  setDaysPerMonth,
  hoursPerDay,
  setHoursPerDay,
  hourlyResult,
  overtimeHoursMap,
  setOvertimeHoursMap,
  totalSimulatedOvertimeUsd,
  onSimulateOvertimeInPayroll,
  formatUSD,
}: HourlyViewProps) {
  return (
    <motion.div
      key="tab-hourly"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="font-serif-editorial text-lg font-semibold">
              Configuración de Jornada Laboral
            </h2>
            <p className="text-xs text-[#65635E]">
              El Código de Trabajo usa 30 días contables al mes, pero puedes evaluar tu costo por hora sobre
              los días efectivos que realmente trabajas (p. ej. 22 días lun-vie).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7]">
              <label className="text-[11px] font-semibold uppercase text-[#65635E] block">
                Días al mes
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(Math.max(1, Math.min(31, Number(e.target.value) || 30)))}
                className="mt-1 w-full text-xl font-mono-tabular font-semibold bg-white border border-[#DFDCD2] rounded-lg px-2.5 py-1"
              />
              <div className="flex gap-1 mt-2">
                {[
                  { label: '30d (Ley)', val: 30 },
                  { label: '24d (L-S)', val: 24 },
                  { label: '22d (L-V)', val: 22 },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setDaysPerMonth(d.val)}
                    className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded-md border cursor-pointer ${
                      daysPerMonth === d.val
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-white text-[#65635E] border-[#DFDCD2]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7]">
              <label className="text-[11px] font-semibold uppercase text-[#65635E] block">
                Horas por día
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Math.max(1, Math.min(12, Number(e.target.value) || 8)))}
                className="mt-1 w-full text-xl font-mono-tabular font-semibold bg-white border border-[#DFDCD2] rounded-lg px-2.5 py-1"
              />
              <div className="flex gap-1 mt-2">
                {[
                  { label: '8h Diurna', val: 8 },
                  { label: '7h Nocturna', val: 7 },
                ].map((h) => (
                  <button
                    key={h.val}
                    type="button"
                    onClick={() => setHoursPerDay(h.val)}
                    className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded-md border cursor-pointer ${
                      hoursPerDay === h.val
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-white text-[#65635E] border-[#DFDCD2]'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#65635E]">Total horas computadas al mes:</span>
              <span className="font-mono-tabular font-semibold">
                {hourlyResult.totalHoursPerMonth} horas/mes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#65635E]">Hora base legal para cálculo de extras (30d):</span>
              <span className="font-mono-tabular font-semibold">
                {formatUSD(hourlyResult.legalBaseHourly)}/hora
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-tabular uppercase text-[#0F4C3A] font-semibold">
                Valor Neto Real de tu Tiempo
              </span>
              <h3 className="font-serif-editorial text-lg font-semibold mt-1">
                Salario Líquido por Hora
              </h3>
              <p className="text-xs text-[#65635E] mt-1">
                Lo que realmente queda disponible para tus gastos por cada hora trabajada después de ISSS, AFP
                y Renta.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-baseline justify-between">
              <span className="text-xs text-[#65635E]">Hora líquida:</span>
              <span className="text-3xl font-mono-tabular font-bold text-[#0F4C3A]">
                {formatUSD(hourlyResult.netHourly)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-tabular uppercase text-[#65635E] font-semibold">
                Valor Nominal Antes de Descuentos
              </span>
              <h3 className="font-serif-editorial text-lg font-semibold mt-1">
                Salario Bruto por Hora
              </h3>
              <p className="text-xs text-[#65635E] mt-1">
                Se pierde{' '}
                <strong className="font-mono-tabular text-[#B91C1C]">
                  {formatUSD(round2(hourlyResult.grossHourly - hourlyResult.netHourly))}
                </strong>{' '}
                por cada hora en descuentos de ley.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-baseline justify-between">
              <span className="text-xs text-[#65635E]">Hora bruta:</span>
              <span className="text-3xl font-mono-tabular font-bold text-[#141413]">
                {formatUSD(hourlyResult.grossHourly)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#65635E] block">Ingreso Líquido por Día</span>
              <span className="text-xs text-[#65635E]">({daysPerMonth} días/mes)</span>
            </div>
            <span className="text-2xl font-mono-tabular font-bold text-[#0F4C3A]">
              {formatUSD(hourlyResult.netDaily)}/día
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#65635E] block">Salario Bruto por Día</span>
              <span className="text-xs text-[#65635E]">({daysPerMonth} días/mes)</span>
            </div>
            <span className="text-2xl font-mono-tabular font-bold text-[#141413]">
              {formatUSD(hourlyResult.grossDaily)}/día
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#EFECE6]">
          <div>
            <h3 className="font-serif-editorial text-lg font-semibold">
              Calculadora de Horas Extra, Nocturnidad, Descanso y Asueto
            </h3>
            <p className="text-xs text-[#65635E]">
              Tarifas calculadas según los recargos del Código de Trabajo de El Salvador sobre tu hora legal (
              {formatUSD(hourlyResult.legalBaseHourly)}/h)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-[#65635E] block">Total Bruto Horas Extra:</span>
              <span className="text-lg font-mono-tabular font-bold text-[#0F4C3A]">
                +{formatUSD(totalSimulatedOvertimeUsd)}
              </span>
            </div>
            {totalSimulatedOvertimeUsd > 0 && (
              <button
                type="button"
                onClick={() => onSimulateOvertimeInPayroll(totalSimulatedOvertimeUsd)}
                className="px-3 py-2 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
              >
                <span>Simular en Planilla</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E2DFD7] text-xs text-[#65635E] text-left">
                <th className="py-2.5 font-medium">Tipo de Hora / Recargo</th>
                <th className="py-2.5 font-medium">Base Legal y Multiplicador</th>
                <th className="py-2.5 font-medium text-right">Valor por Hora</th>
                <th className="py-2.5 font-medium text-center w-36">Horas en el Mes</th>
                <th className="py-2.5 font-medium text-right">Subtotal Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {hourlyResult.overtimeRates.map((rate) => {
                const qty = overtimeHoursMap[rate.id] || 0;
                const subtotal = round2(rate.hourlyRateUsd * qty);
                return (
                  <tr key={rate.id} className={qty > 0 ? 'bg-[#0F4C3A]/4' : ''}>
                    <td className="py-3 pr-3 font-medium text-[#141413]">{rate.label}</td>
                    <td className="py-3 pr-3 text-xs text-[#65635E]">{rate.legalBasis}</td>
                    <td className="py-3 pr-3 text-right font-mono-tabular font-semibold">
                      {formatUSD(rate.hourlyRateUsd)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={qty}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setOvertimeHoursMap((prev) => ({ ...prev, [rate.id]: val }));
                        }}
                        className="w-20 text-center font-mono-tabular font-semibold bg-white border border-[#DFDCD2] rounded-lg py-1 focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-tabular font-semibold text-[#0F4C3A]">
                      {formatUSD(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
