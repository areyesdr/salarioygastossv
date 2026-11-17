import { motion } from 'motion/react';
import { Calendar, Gift, Plane, Check, AlertTriangle } from 'lucide-react';
import {
  RATES,
  round2,
  calcDaysBetweenInclusive,
  type VacationCalculationResult,
  type AguinaldoCalculationResult,
  type Quincena25CalculationResult,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
  type SeniorityCalculationResult,
} from '../lib/svLaborLaw.ts';
import {
  PrimeButton,
  PrimeCard,
  PrimeInput,
  PrimeMessage,
  PrimeSelectButton,
  PrimeSwitch,
  PrimeTag,
} from './ui/PrimeUI.tsx';

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
  vacationMode: 'bonus_only' | 'full_advance' | 'worked_vacation';
  setVacationMode: (v: 'bonus_only' | 'full_advance' | 'worked_vacation') => void;
  splitDays: [number, number, number];
  setSplitDays: (v: [number, number, number]) => void;
  formatUSD: (val: number) => string;
  hireDate?: string;
  onHireDateChange?: (v: string) => void;
  seniorityDetails?: SeniorityCalculationResult;
}

export function BonusesView({
  monthlySalary,
  monthlyNetPay,
  biweeklyNetPay: _biweeklyNetPay,
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
  aguinaldoExemptionRule: _aguinaldoExemptionRule,
  setAguinaldoExemptionRule: _setAguinaldoExemptionRule,
  vacationSector,
  setVacationSector,
  vacationBonusPct: _vacationBonusPct,
  setVacationBonusPct: _setVacationBonusPct,
  vacationMode,
  setVacationMode,
  splitDays,
  setSplitDays,
  formatUSD,
  hireDate,
  onHireDateChange,
  seniorityDetails,
}: BonusesViewProps) {
  return (
    <motion.div
      key="tab-bonuses"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Fecha de Inicio de Labores */}
      <PrimeCard padded className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar size={18} className="text-[var(--color-muted)] shrink-0" />
          <div>
            <span className="text-xs font-semibold text-[var(--color-ink)] block">
              Fecha de Inicio de Labores
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              Define automáticamente tu antigüedad acumulada y los tramos de Aguinaldo y Quincena 25.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PrimeInput
            type="date"
            inputSize="sm"
            mono
            value={hireDate || ''}
            onChange={(e) => onHireDateChange?.(e.target.value)}
            className="w-[165px] font-semibold"
          />
          {seniorityDetails && (
            <PrimeTag severity="neutral" className="font-mono py-1.5 px-2.5">
              Antigüedad: {seniorityDetails.formattedSeniority}
            </PrimeTag>
          )}
        </div>
      </PrimeCard>

      {/* Resumen Anual */}
      <PrimeCard>
        <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex flex-col md:flex-row justify-content-between md:items-center justify-between gap-2">
          <div>
            <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
              <Calendar size={16} className="text-[var(--color-muted)]" />
              <span>Calendario Anual de Prestaciones y Bonos de Ley</span>
            </h6>
            <span className="text-xs text-[var(--color-muted)]">
              Ingresos extraordinarios estipulados por la legislación laboral de El Salvador
            </span>
          </div>
          <PrimeTag severity="success" className="py-1 px-3 text-xs self-start md:self-auto">
            <span>Total anual neto:</span>
            <strong className="font-mono text-sm">+{formatUSD(totalAnnualNetBonuses)}</strong>
          </PrimeTag>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="surface-well p-3.5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex justify-between items-center gap-2 mb-2">
                <PrimeTag severity="success" className="font-mono">Pago: 15 – 25 Enero</PrimeTag>
                <PrimeTag severity="neutral" className="font-mono">Decreto 499</PrimeTag>
              </div>
              <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                Quincena 25 (Bono de Enero)
              </h6>
              <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
                Medio sueldo adicional (50%). <strong className="text-[var(--color-ink-2)]">Llega 100% limpio</strong> (exento de AFP, ISSS y Renta).
              </p>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[var(--color-rule)]">
              <span className="text-xs text-[var(--color-muted)]">En tu bolsillo:</span>
              <span className="text-lg font-bold font-mono text-[var(--color-emerald)]">
                +{formatUSD(quincena25Result.netQuincena25)}
              </span>
            </div>
          </div>

          <div className="surface-well p-3.5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex justify-between items-center gap-2 mb-2">
                <PrimeTag severity="info" className="font-mono">Al cumplir cada año</PrimeTag>
                <PrimeTag severity="neutral" className="font-mono">Art. 177 C.T.</PrimeTag>
              </div>
              <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                Vacación (15 días + 30% Extra)
              </h6>
              <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
                15 días continuos de descanso pagado más un <strong className="text-[var(--color-ink-2)]">30% de prima de ley</strong> (lleva deducciones de ley).
              </p>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[var(--color-rule)]">
              <span className="text-xs text-[var(--color-muted)]">
                {vacationSector === 'publico'
                  ? 'Sector público (sin bono):'
                  : vacationMode === 'bonus_only'
                    ? 'Solo bono 30% neto:'
                    : vacationMode === 'full_advance'
                      ? 'Total adelantado neto:'
                      : 'Total quincena trabajada:'}
              </span>
              <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                +
                {formatUSD(
                  vacationSector === 'publico'
                    ? 0
                    : vacationMode === 'bonus_only'
                      ? vacationResult.bonusOnlyMode.netBonusAfterDeductions
                      : vacationMode === 'full_advance'
                        ? vacationResult.fullAdvanceMode.netTotal
                        : vacationResult.workedVacationMode.netTotal
                )}
              </span>
            </div>
          </div>

          <div className="surface-well p-3.5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex justify-between items-center gap-2 mb-2">
                <PrimeTag severity="warning" className="font-mono">Pago: 1 – 20 Diciembre</PrimeTag>
                <PrimeTag severity="neutral" className="font-mono">Art. 196 C.T.</PrimeTag>
              </div>
              <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                Aguinaldo de Fin de Año
              </h6>
              <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
                De 15 a 21 días de sueldo según años. <strong className="text-[var(--color-ink-2)]">Cero descuento de ISSS y AFP</strong>, exento de Renta hasta $1,500.
              </p>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[var(--color-rule)]">
              <span className="text-xs text-[var(--color-muted)]">En tu bolsillo:</span>
              <span className="text-lg font-bold font-mono text-[var(--color-emerald)]">
                +{formatUSD(aguinaldoResult.netAguinaldo)}
              </span>
            </div>
          </div>
        </div>
      </PrimeCard>

      {/* Cuadrícula Quincena 25 y Aguinaldo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TARJETA 1: QUINCENA 25 */}
        <PrimeCard className="flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-[var(--color-rule)] flex justify-between items-center gap-2">
              <div>
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <Gift size={16} className="text-[var(--color-muted)]" />
                  <span>Quincena 25 (Decreto Legislativo 499)</span>
                </h6>
                <span className="text-xs text-[var(--color-muted)]">
                  Obligatoria a partir de enero de 2027
                </span>
              </div>
              <PrimeTag severity="neutral" className="font-mono">
                {quincena25Result.eligibleByLaw ? 'Elegible por ley' : '> $1,500 tope'}
              </PrimeTag>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1.5">
                  Antigüedad al 25 de enero
                </label>
                <PrimeSelectButton
                  fullWidth
                  value={q25FullYear ? 'full' : 'prop'}
                  onChange={(v) => setQ25FullYear(v === 'full')}
                  options={[
                    { value: 'full', label: '1 año o más (100%)' },
                    { value: 'prop', label: 'Menos de 1 año (Proporcional)' },
                  ]}
                />
              </div>

              {!q25FullYear && (
                <div className="surface-well p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <label className="text-xs text-[var(--color-muted)]">Fecha de ingreso:</label>
                    <PrimeInput
                      type="date"
                      inputSize="sm"
                      mono
                      value={q25HireDate}
                      onChange={(e) => {
                        setQ25HireDate(e.target.value);
                        const days = calcDaysBetweenInclusive(e.target.value, '2027-01-25');
                        if (days > 0) setQ25DaysWorked(days);
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={q25DaysWorked}
                    onChange={(e) => setQ25DaysWorked(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <div className="text-right text-[11px] font-mono text-[var(--color-muted)]">
                    {q25DaysWorked} / 365 días computados
                  </div>
                </div>
              )}

              {monthlySalary > RATES.QUINCENA_25_CAP && (
                <div className="surface-well p-2.5 flex items-center justify-between gap-2">
                  <label htmlFor="switchVoluntaryQ25" className="text-xs text-[var(--color-muted)] cursor-pointer">
                    Simular pago voluntario de la empresa (salario superior a $1,500)
                  </label>
                  <PrimeSwitch
                    id="switchVoluntaryQ25"
                    checked={q25VoluntaryAboveCap}
                    onChange={setQ25VoluntaryAboveCap}
                  />
                </div>
              )}

              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-[var(--color-rule)]">
                  <tr>
                    <td className="py-2 text-[var(--color-muted)]">
                      <strong>Cuánto te toca:</strong> 50% de tu sueldo mensual
                    </td>
                    <td className="py-2 text-right font-semibold font-mono text-[var(--color-ink)]">
                      {formatUSD(round2(monthlySalary * 0.5))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[var(--color-muted)]">
                      <strong>Tiempo en la empresa:</strong> {quincena25Result.daysWorked} días
                    </td>
                    <td className="py-2 text-right font-mono text-[var(--color-ink)]">
                      {round2(quincena25Result.proportionFactor * 100)}% de pago
                    </td>
                  </tr>
                  <tr className="bg-[var(--color-emerald-soft)]">
                    <td className="py-2 px-2 text-[var(--color-emerald)] font-semibold">
                      Descuentos de AFP, ISSS y Renta:
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--color-emerald)] font-bold font-mono">
                      $0.00 (Íntegro)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] flex justify-between items-center gap-3">
            <div>
              <span className="font-bold text-[var(--color-ink)] block text-xs">
                Monto en tu bolsillo
              </span>
              <span className="text-[var(--color-muted)] text-[11px]">
                {monthlySalary <= 1500
                  ? 'Pago obligatorio fijado por ley entre el 15 y el 25 de enero.'
                  : 'Tu sueldo pasa de $1,500; el decreto obliga hasta ese tope salarial.'}
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-[var(--color-emerald)] shrink-0">
              +{formatUSD(quincena25Result.netQuincena25)}
            </span>
          </div>
        </PrimeCard>

        {/* TARJETA 2: AGUINALDO */}
        <PrimeCard className="flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-[var(--color-rule)] flex justify-between items-center gap-2">
              <div>
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <Calendar size={16} className="text-[var(--color-muted)]" />
                  <span>Aguinaldo (Gratificación de Fin de Año)</span>
                </h6>
                <span className="text-xs text-[var(--color-muted)]">
                  Plazo legal obligatorio: del 1 al 20 de diciembre
                </span>
              </div>
              <PrimeTag severity="neutral" className="font-mono">Sin ISSS / AFP</PrimeTag>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1.5">
                  Tus años en la empresa (al 12 de diciembre)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'under-1', title: '< 1 año', sub: 'Proporcional' },
                      { id: '1-to-3', title: '1 a < 3 años', sub: '15 días' },
                      { id: '3-to-10', title: '3 a < 10 años', sub: '19 días' },
                      { id: '10-plus', title: '10+ años', sub: '21 días' },
                    ] as const
                  ).map((b) => (
                    <PrimeButton
                      key={b.id}
                      variant={seniority === b.id ? 'secondary' : 'outline'}
                      size="xs"
                      className="flex-col py-2"
                      onClick={() => setSeniority(b.id)}
                    >
                      <span className="font-semibold text-[11px]">{b.title}</span>
                      <span className="font-mono text-[10px] opacity-80">{b.sub}</span>
                    </PrimeButton>
                  ))}
                </div>
              </div>

              {seniority === 'under-1' && (
                <div className="surface-well p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <label className="text-xs text-[var(--color-muted)]">Fecha de ingreso:</label>
                    <PrimeInput
                      type="date"
                      inputSize="sm"
                      mono
                      value={aguinaldoHireDate}
                      onChange={(e) => {
                        setAguinaldoHireDate(e.target.value);
                        const year = new Date().getFullYear();
                        const days = calcDaysBetweenInclusive(e.target.value, `${year}-12-12`);
                        if (days > 0) setAguinaldoDaysUnder1(days);
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={aguinaldoDaysUnder1}
                    onChange={(e) => setAguinaldoDaysUnder1(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <div className="text-right text-[11px] font-mono text-[var(--color-muted)]">
                    {aguinaldoDaysUnder1} / 365 días trabajados al 12 de diciembre
                  </div>
                </div>
              )}

              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-[var(--color-rule)]">
                  <tr>
                    <td className="py-2 text-[var(--color-muted)]">
                      <strong>Cálculo:</strong> {aguinaldoResult.equivalentDays} días ({formatUSD(aguinaldoResult.dailySalary)}/día)
                    </td>
                    <td className="py-2 text-right font-semibold font-mono text-[var(--color-ink)]">
                      {formatUSD(aguinaldoResult.grossAguinaldo)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[var(--color-muted)]">
                      <strong>Descuento de ISSS y AFP:</strong>
                    </td>
                    <td className="py-2 text-right text-[var(--color-emerald)] font-semibold font-mono">
                      $0.00 (Exento por ley)
                    </td>
                  </tr>
                  {aguinaldoResult.taxableExcess > 0 ? (
                    <tr>
                      <td className="py-2 text-[var(--color-danger)]">
                        <strong>Descuento de Renta:</strong> Sobre exceso de {formatUSD(aguinaldoResult.exemptionLimit)}
                      </td>
                      <td className="py-2 text-right font-mono text-[var(--color-danger)] font-bold">
                        -{formatUSD(aguinaldoResult.isrWithheld)}
                      </td>
                    </tr>
                  ) : (
                    <tr className="bg-[var(--color-emerald-soft)]">
                      <td className="py-2 px-2 text-[var(--color-emerald)] font-semibold">
                        Descuento de Renta:
                      </td>
                      <td className="py-2 px-2 text-right text-[var(--color-emerald)] font-bold font-mono">
                        $0.00 (Exento hasta $1,500)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] flex justify-between items-center gap-3">
            <div>
              <span className="font-bold text-[var(--color-ink)] block text-xs">
                Monto en tu bolsillo
              </span>
              <span className="text-[var(--color-muted)] text-[11px]">
                {aguinaldoResult.taxableExcess > 0
                  ? `Renta aplicada únicamente sobre el excedente de ${formatUSD(aguinaldoResult.taxableExcess)}.`
                  : 'Sin retenciones: recibes el aguinaldo íntegro.'}
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-[var(--color-emerald)] shrink-0">
              +{formatUSD(aguinaldoResult.netAguinaldo)}
            </span>
          </div>
        </PrimeCard>
      </div>

      {/* TARJETA 3: VACACIÓN ANUAL */}
      <PrimeCard>
        <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
              <Plane size={16} className="text-[var(--color-muted)]" />
              <span>Vacación Anual: Modalidades y Tramos (Art. 177 Código de Trabajo)</span>
            </h6>
            <span className="text-xs text-[var(--color-muted)]">
              15 días continuos de descanso remunerado con el 30% de recargo de ley
            </span>
          </div>

          <PrimeSelectButton
            value={vacationSector}
            onChange={setVacationSector}
            options={[
              { value: 'privado', label: 'Sector Privado (30%)' },
              { value: 'publico', label: 'Sector Público (Ley de Salarios)' },
            ]}
          />
        </div>

        <div className="p-4">
          {vacationSector === 'publico' ? (
            <PrimeMessage severity="info">
              <strong>Régimen de Servicio Civil y Ley de Salarios:</strong> En el sector público salvadoreño, las vacaciones corresponden a descanso pagado en tres períodos oficiales (Semana Santa, Fiestas Agostinas y Fin de Año), percibiendo el salario ordinario íntegro ({formatUSD(monthlyNetPay)} netos), sin recargo del 30% salvo contrato colectivo específico.
            </PrimeMessage>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Modalidad A */}
                <button
                  type="button"
                  onClick={() => setVacationMode('bonus_only')}
                  className={`text-left p-4 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    vacationMode === 'bonus_only'
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-xs'
                      : 'bg-[var(--color-card)] border-[var(--color-rule)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <PrimeTag severity="neutral">Práctica habitual</PrimeTag>
                      {vacationMode === 'bonus_only' && <Check size={14} className="text-[var(--color-emerald)]" />}
                    </div>
                    <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">Solo Bono 30%</h6>
                    <p className="text-[11px] text-[var(--color-muted)] mb-2">
                      Tomas los 15 días de descanso. La quincena se cobra en fecha regular y se suma el 30%:
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-[var(--color-muted)]">
                      <div className="flex justify-between">
                        <span>Bono 30% Bruto:</span>
                        <span className="font-semibold text-[var(--color-ink)]">
                          {formatUSD(vacationResult.bonus30Gross)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Deducciones:</span>
                        <span>
                          -{formatUSD(round2(vacationResult.bonusOnlyMode.afp + vacationResult.bonusOnlyMode.isss + vacationResult.bonusOnlyMode.isrEstimated))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-rule)] flex justify-between items-baseline">
                    <span className="text-xs text-[var(--color-muted)]">Bono Neto:</span>
                    <span className="text-base font-bold font-mono text-[var(--color-emerald)]">
                      +{formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                    </span>
                  </div>
                </button>

                {/* Modalidad B */}
                <button
                  type="button"
                  onClick={() => setVacationMode('full_advance')}
                  className={`text-left p-4 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    vacationMode === 'full_advance'
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-xs'
                      : 'bg-[var(--color-card)] border-[var(--color-rule)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <PrimeTag severity="neutral">Anticipo de ley (Art. 182)</PrimeTag>
                      {vacationMode === 'full_advance' && <Check size={14} className="text-[var(--color-emerald)]" />}
                    </div>
                    <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                      Adelanto 15 días + Bono
                    </h6>
                    <p className="text-[11px] text-[var(--color-muted)] mb-2">
                      Cobras por adelantado la quincena de vacación ({formatUSD(vacationResult.base15DaysGross)}) más el 30% antes de salir:
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-[var(--color-muted)]">
                      <div className="flex justify-between">
                        <span>Total Bruto:</span>
                        <span className="font-semibold text-[var(--color-ink)]">
                          {formatUSD(vacationResult.completeVacationGross)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Deducciones:</span>
                        <span>
                          -{formatUSD(round2(vacationResult.fullAdvanceMode.afp + vacationResult.fullAdvanceMode.isss + vacationResult.fullAdvanceMode.isr))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-rule)] flex justify-between items-baseline">
                    <span className="text-xs text-[var(--color-muted)]">Total Adelantado:</span>
                    <span className="text-base font-bold font-mono text-[var(--color-ink)]">
                      {formatUSD(vacationResult.fullAdvanceMode.netTotal)}
                    </span>
                  </div>
                </button>

                {/* Modalidad C */}
                <button
                  type="button"
                  onClick={() => setVacationMode('worked_vacation')}
                  className={`text-left p-4 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    vacationMode === 'worked_vacation'
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-xs'
                      : 'bg-[var(--color-card)] border-[var(--color-rule)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <PrimeTag severity="warning" className="font-mono">Vacación trabajada</PrimeTag>
                      {vacationMode === 'worked_vacation' && <Check size={14} className="text-[var(--color-emerald)]" />}
                    </div>
                    <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                      Trabajada (Paga Doble + 30%)
                    </h6>
                    <p className="text-[11px] text-[var(--color-muted)] mb-2">
                      Laboras durante la vacación: 15 días trabajados + 15 días vacación + 30% prima (230% quincenal):
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-[var(--color-muted)]">
                      <div className="flex justify-between">
                        <span>Total Bruto Quincena:</span>
                        <span className="font-semibold text-[var(--color-ink)]">
                          {formatUSD(vacationResult.workedVacationMode.totalGross)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Deducciones (ISSS, AFP, Renta):</span>
                        <span>-{formatUSD(vacationResult.workedVacationMode.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-rule)] flex justify-between items-baseline">
                    <div>
                      <span className="text-[11px] text-[var(--color-muted)] block">Neto Quincena:</span>
                      <span className="text-[var(--color-emerald)] font-mono font-semibold text-[10px]">
                        (+{formatUSD(vacationResult.workedVacationMode.extraNetOverNormalQuincena)} extra)
                      </span>
                    </div>
                    <span className="text-base font-bold font-mono text-[var(--color-ink)]">
                      {formatUSD(vacationResult.workedVacationMode.netTotal)}
                    </span>
                  </div>
                </button>
              </div>

              {/* Advertencia Art. 188 + División por Períodos */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 p-3.5 rounded-xl border border-[var(--color-amber)]/35 bg-[var(--color-amber-soft)] flex flex-col justify-between gap-2">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[var(--color-amber)] shrink-0" />
                      <strong className="text-[var(--color-ink)]">
                        Art. 188 Código de Trabajo: Prohibición de Compensar en Dinero
                      </strong>
                    </div>
                    <p className="m-0 text-[var(--color-ink-2)] leading-relaxed">
                      El Art. 188 establece:
                      <em className="block my-1.5 pl-2.5 border-l-2 border-[var(--color-amber)] text-[var(--color-ink)]">
                        «Se prohíbe compensar las vacaciones en dinero o en especie. Asimismo se prohíbe fraccionar o acumular los períodos de vacaciones; y a la obligación del patrono de darlas, corresponde la del trabajador de tomarlas.»
                      </em>
                      La vacación es un descanso remunerado obligatorio e irrenunciable mientras el contrato esté vigente.
                    </p>
                    <p className="m-0 text-[11px] text-[var(--color-ink-2)]">
                      <strong>Si se labora en la práctica:</strong> El empleado devenga el salario trabajado (100%) más la retribución de descanso (100% + 30% = 130%), totalizando <strong>230% de la quincena ordinaria</strong>.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-amber)]/25 flex justify-between items-center text-[11px] font-mono">
                    <span className="text-[var(--color-ink-2)]">Excepción legal de pago en efectivo:</span>
                    <PrimeTag severity="neutral">Arts. 187 y 189 CT (Finiquito)</PrimeTag>
                  </div>
                </div>

                <div className="lg:col-span-5 surface-well p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h6 className="text-xs font-semibold text-[var(--color-ink)] m-0">
                        División por Períodos (15 días)
                      </h6>
                      <PrimeTag severity="neutral" className="font-mono">Pacto de fraccionamiento</PrimeTag>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mb-3">
                      Distribuye los 15 días en hasta tres descansos acordados con tu empleador:
                    </p>

                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx}>
                          <label className="text-[11px] text-[var(--color-muted)] block mb-1">
                            Período {idx + 1}:
                          </label>
                          <PrimeInput
                            type="number"
                            inputSize="sm"
                            mono
                            min={idx === 0 ? '1' : '0'}
                            max="15"
                            value={splitDays[idx]}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const next: [number, number, number] = [...splitDays] as [number, number, number];
                              next[idx] = val;
                              setSplitDays(next);
                            }}
                            className="text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-rule)] flex justify-between items-center text-xs font-mono">
                    <span className="text-[var(--color-muted)]">Total días:</span>
                    <span
                      className={`font-bold ${
                        splitDays[0] + splitDays[1] + splitDays[2] === 15
                          ? 'text-[var(--color-emerald)]'
                          : 'text-[var(--color-danger)]'
                      }`}
                    >
                      {splitDays[0] + splitDays[1] + splitDays[2]} / 15 días
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PrimeCard>
    </motion.div>
  );
}
