import { motion } from 'motion/react';
import { Clock, ArrowUpRight } from 'lucide-react';
import {
  round2,
  type HourlyAndOvertimeResult,
  type OvertimeTypeId,
} from '../lib/svLaborLaw.ts';
import {
  PrimeButton,
  PrimeCard,
  PrimeInput,
  PrimeSelectButton,
} from './ui/PrimeUI.tsx';

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Configuración de Jornada */}
        <PrimeCard padded className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-[var(--color-muted)]" />
              <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
                Configuración de Jornada Laboral
              </h6>
            </div>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              Ajusta los días y horas base para contrastar tu hora contable frente a la efectiva
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
                  Días al mes
                </label>
                <PrimeInput
                  type="number"
                  inputSize="sm"
                  mono
                  min="1"
                  max="31"
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(Math.max(1, Math.min(31, Number(e.target.value) || 30)))}
                  className="mb-2 font-semibold"
                />
                <PrimeSelectButton
                  size="xs"
                  fullWidth
                  value={daysPerMonth === 22 ? '22' : '30'}
                  onChange={(v) => setDaysPerMonth(Number(v))}
                  options={[
                    { value: '30', label: '30 (Ley)' },
                    { value: '22', label: '22 (L-V)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
                  Horas por día
                </label>
                <PrimeInput
                  type="number"
                  inputSize="sm"
                  mono
                  min="1"
                  max="12"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Math.max(1, Math.min(12, Number(e.target.value) || 8)))}
                  className="mb-2 font-semibold"
                />
                <PrimeSelectButton
                  size="xs"
                  fullWidth
                  value={hoursPerDay === 7 ? '7' : '8'}
                  onChange={(v) => setHoursPerDay(Number(v))}
                  options={[
                    { value: '8', label: '8h Diurna' },
                    { value: '7', label: '7h Noct.' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="surface-well p-3 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Total horas computadas:</span>
              <span className="font-semibold text-[var(--color-ink)]">
                {hourlyResult.totalHoursPerMonth} horas/mes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Hora base legal (Art. 161 C.T.):</span>
              <span className="font-semibold text-[var(--color-ink)]">
                {formatUSD(hourlyResult.legalBaseHourly)}/h
              </span>
            </div>
          </div>
        </PrimeCard>

        {/* 4 Métricas de Costo Diario y Horario */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PrimeCard padded className="border-[var(--color-emerald)]/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[var(--color-emerald)] block">
                Ingreso Líquido Real
              </span>
              <div className="text-2xl font-bold font-mono text-[var(--color-emerald)] my-1.5">
                {formatUSD(hourlyResult.netHourly)}
                <span className="text-sm font-normal text-[var(--color-muted)]">/h</span>
              </div>
            </div>
            <p className="text-[var(--color-muted)] text-[11px] m-0">
              Lo que efectivamente recibes disponible por hora tras ISSS, AFP y Renta.
            </p>
          </PrimeCard>

          <PrimeCard padded className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[var(--color-muted)] block">
                Salario Bruto Contratado
              </span>
              <div className="text-2xl font-bold font-mono text-[var(--color-ink)] my-1.5">
                {formatUSD(hourlyResult.grossHourly)}
                <span className="text-sm font-normal text-[var(--color-muted)]">/h</span>
              </div>
            </div>
            <p className="text-[var(--color-muted)] text-[11px] m-0">
              Deducción legal:{' '}
              <span className="font-mono">-{formatUSD(round2(hourlyResult.grossHourly - hourlyResult.netHourly))}/h</span>
            </p>
          </PrimeCard>

          <PrimeCard padded className="bg-[var(--color-surface)]">
            <span className="text-[11px] text-[var(--color-muted)] block">
              Líquido por Día ({daysPerMonth} días):
            </span>
            <span className="text-xl font-bold font-mono text-[var(--color-emerald)]">
              {formatUSD(hourlyResult.netDaily)}/día
            </span>
          </PrimeCard>

          <PrimeCard padded className="bg-[var(--color-surface)]">
            <span className="text-[11px] text-[var(--color-muted)] block">
              Bruto por Día ({daysPerMonth} días):
            </span>
            <span className="text-xl font-bold font-mono text-[var(--color-ink)]">
              {formatUSD(hourlyResult.grossDaily)}/día
            </span>
          </PrimeCard>
        </div>
      </div>

      {/* Tabla de Horas Extra y Recargos de Ley */}
      <PrimeCard>
        <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
              <Clock size={16} className="text-[var(--color-muted)]" />
              <span>Calculadora de Horas Extra y Recargos (Código de Trabajo)</span>
            </h6>
            <span className="text-xs text-[var(--color-muted)]">
              Tarifas legales calculadas sobre tu hora ordinaria de {formatUSD(hourlyResult.legalBaseHourly)}/h
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-[var(--color-muted)] block">Subtotal Horas Extra:</span>
              <span className="text-sm font-bold font-mono text-[var(--color-emerald)]">
                +{formatUSD(totalSimulatedOvertimeUsd)}
              </span>
            </div>
            {totalSimulatedOvertimeUsd > 0 && (
              <PrimeButton
                variant="secondary"
                size="xs"
                onClick={() => onSimulateOvertimeInPayroll(totalSimulatedOvertimeUsd)}
              >
                <span>Simular en planilla</span>
                <ArrowUpRight size={13} />
              </PrimeButton>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                <th className="py-2.5 px-4 font-medium">Tipo de Recargo</th>
                <th className="py-2.5 px-4 font-medium">Base Legal</th>
                <th className="py-2.5 px-4 font-medium text-right">Tarifa / Hora</th>
                <th className="py-2.5 px-4 font-medium text-center w-[120px]">Horas Mes</th>
                <th className="py-2.5 px-4 font-medium text-right">Subtotal Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-rule)]">
              {hourlyResult.overtimeRates.map((rate) => {
                const qty = overtimeHoursMap[rate.id] || 0;
                const subtotal = round2(rate.hourlyRateUsd * qty);
                return (
                  <tr key={rate.id} className={qty > 0 ? 'bg-[var(--color-surface)]' : ''}>
                    <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">{rate.label}</td>
                    <td className="py-3 px-4 text-[var(--color-muted)]">{rate.legalBasis}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-ink)]">
                      {formatUSD(rate.hourlyRateUsd)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <PrimeInput
                        type="number"
                        inputSize="sm"
                        mono
                        min="0"
                        step="1"
                        value={qty}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setOvertimeHoursMap((prev) => ({ ...prev, [rate.id]: val }));
                        }}
                        className="text-center font-semibold w-[76px] mx-auto"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                      {formatUSD(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PrimeCard>
    </motion.div>
  );
}
