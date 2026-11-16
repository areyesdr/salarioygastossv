import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  ShieldCheck,
  Building,
  ChevronDown,
  ChevronUp,
  Info,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import {
  PayrollBreakdown,
  PayPeriod,
  ISR_TABLES,
  round2,
} from '../lib/svLaborLaw';
import {
  PrimeButton,
  PrimeCard,
  PrimeChart,
  PrimeProgressBar,
  PrimeSelectButton,
  PrimeTag,
} from './ui/PrimeUI.tsx';

interface PayrollViewProps {
  period: PayPeriod;
  activePayroll: PayrollBreakdown;
  monthlyPayroll: PayrollBreakdown;
  monthlyBaseOnlyPayroll: PayrollBreakdown;
  extraMonthlyBonus: number;
  isrMarkerPercent: number;
  formatUSD: (val: number) => string;
}

export function PayrollView({
  period,
  activePayroll,
  monthlyPayroll,
  monthlyBaseOnlyPayroll,
  extraMonthlyBonus,
  isrMarkerPercent,
  formatUSD,
}: PayrollViewProps) {
  const [activeDetailTab, setActiveDetailTab] = useState<'boleta' | 'renta' | 'patronal'>('boleta');
  const [showLegalDetails, setShowLegalDetails] = useState<boolean>(false);
  const [showAllBrackets, setShowAllBrackets] = useState<boolean>(false);

  const payrollChartData = useMemo(
    () => ({
      labels: ['Salario neto', 'AFP (7.25%)', 'ISSS (3.00%)', 'Renta (ISR)'],
      datasets: [
        {
          data: [
            activePayroll.netPay,
            activePayroll.afpEmployee,
            activePayroll.isssEmployee,
            activePayroll.isr,
          ],
          backgroundColor: ['#059669', '#2563eb', '#d97706', '#dc2626'],
          borderWidth: 0,
        },
      ],
    }),
    [activePayroll.netPay, activePayroll.afpEmployee, activePayroll.isssEmployee, activePayroll.isr]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="w-full space-y-4"
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <PrimeSelectButton
          value={activeDetailTab}
          onChange={setActiveDetailTab}
          options={[
            { value: 'boleta', label: 'Boleta de Pago' },
            { value: 'renta', label: 'Retención de Renta (ISR)' },
            { value: 'patronal', label: 'Costo Patronal (Empresa)' },
          ]}
        />

        {activeDetailTab === 'boleta' && (
          <PrimeButton
            variant="ghost"
            size="xs"
            onClick={() => setShowLegalDetails((prev) => !prev)}
          >
            <Info size={14} />
            <span>{showLegalDetails ? 'Ocultar bases legales' : 'Ver bases legales de cálculo'}</span>
          </PrimeButton>
        )}
      </div>

      {/* PESTAÑA 1: Boleta de Pago + Gráfico */}
      {activeDetailTab === 'boleta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <PrimeCard className="lg:col-span-8">
            <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex justify-between items-center gap-2">
              <div>
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <Calculator size={16} className="text-[var(--color-muted)]" />
                  <span>Boleta Oficial de Pago ({period === 'monthly' ? 'Mensual' : 'Quincenal'})</span>
                </h6>
                <span className="text-xs text-[var(--color-muted)]">
                  Conforme al Código de Trabajo y Ley de Impuesto sobre la Renta de El Salvador
                </span>
              </div>
              <PrimeTag severity="neutral" className="font-mono">
                Decreto 254
              </PrimeTag>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)] text-xs text-[var(--color-muted)] font-medium">
                    <th className="py-2.5 px-4 w-[68%]">Concepto / Deducción</th>
                    <th className="py-2.5 px-4 w-[32%] text-right">Monto (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)] text-xs">
                  <tr>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[var(--color-ink)]">Salario Base Pactado</span>
                      {showLegalDetails && (
                        <div className="text-[var(--color-muted)] text-[11px] mt-1">
                          El sueldo acordado en tu contrato antes de cualquier descuento o bono.
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-ink)]">
                      {formatUSD(activePayroll.grossBase)}
                    </td>
                  </tr>

                  {activePayroll.bonuses > 0 && (
                    <tr>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[var(--color-emerald)]">
                          + Bono o Comisión Adicional
                        </span>
                        {showLegalDetails && (
                          <div className="text-[var(--color-muted)] text-[11px] mt-1">
                            Dinero extra ganado. Se suma al salario y también paga AFP, ISSS y Renta.
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                        +{formatUSD(activePayroll.bonuses)}
                      </td>
                    </tr>
                  )}

                  {activePayroll.additions?.includeVacationBonus && (
                    <tr>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[var(--color-emerald)]">
                          + Recargo Vacacional Legal (30% de ley)
                        </span>
                        <div className="text-[var(--color-muted)] text-[11px] mt-0.5">
                          Prima del 30% sobre 15 días de salario ordinario (Art. 177 CT). Cotiza AFP, ISSS y Renta.
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                        +{formatUSD(activePayroll.additions.vacationBonus30Gross)}
                      </td>
                    </tr>
                  )}

                  {activePayroll.additions?.includeWorkedVacation && (
                    <>
                      <tr>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[var(--color-emerald)]">
                            + Vacación Pagada Trabajada (15 días de salario)
                          </span>
                          <div className="text-[var(--color-muted)] text-[11px] mt-0.5">
                            Remuneración de 15 días por el descanso vacacional laborado (Art. 188 CT). Cotiza AFP, ISSS y Renta.
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                          +{formatUSD(activePayroll.additions.vacation15DaysGross)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[var(--color-emerald)]">
                            + Recargo Vacacional Legal (30% sobre vacación)
                          </span>
                          <div className="text-[var(--color-muted)] text-[11px] mt-0.5">
                            Prima obligatoria del 30% sobre los 15 días de vacación (Art. 177 CT). Cotiza AFP, ISSS y Renta.
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                          +{formatUSD(activePayroll.additions.vacationBonus30Gross)}
                        </td>
                      </tr>
                    </>
                  )}

                  {activePayroll.additions?.includeAguinaldo && (
                    <tr>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[var(--color-emerald)]">
                            + Aguinaldo de Fin de Año
                          </span>
                          <PrimeTag severity="success">Sin ISSS ni AFP</PrimeTag>
                          {activePayroll.additions.aguinaldoTaxableExcess > 0 ? (
                            <PrimeTag severity="warning">Renta sobre exceso de $1,500</PrimeTag>
                          ) : (
                            <PrimeTag severity="neutral">100% Exento de Renta</PrimeTag>
                          )}
                        </div>
                        <div className="text-[var(--color-muted)] text-[11px] mt-0.5">
                          Prestación legal (Arts. 196–202 CT). Por ley no cotiza AFP ni ISSS.
                          {activePayroll.additions.aguinaldoTaxableExcess > 0 &&
                            ` Renta aplicable únicamente al excedente gravado (${formatUSD(activePayroll.additions.aguinaldoTaxableExcess)}).`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                        +{formatUSD(activePayroll.additions.aguinaldoGross)}
                      </td>
                    </tr>
                  )}

                  {activePayroll.additions?.includeQ25 && (
                    <tr>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[var(--color-emerald)]">
                            + Quincena 25 (Bono de Enero)
                          </span>
                          <PrimeTag severity="success">100% Libre de Impuestos</PrimeTag>
                        </div>
                        <div className="text-[var(--color-muted)] text-[11px] mt-0.5">
                          Compensación económica (Decreto Legislativo 499). Ley prohíbe descontar AFP, ISSS o Renta.
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-emerald)]">
                        +{formatUSD(activePayroll.additions.q25Gross)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-[var(--color-surface)]">
                    <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">
                      <span>Total Ingreso Bruto</span>
                      {showLegalDetails && (
                        <div className="text-[var(--color-muted)] text-[11px] mt-1 font-normal">
                          Todo lo que generaste en el período, antes de descuentos.
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[var(--color-ink)]">
                      {formatUSD(activePayroll.grossTotal)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4">
                      <span className="text-[var(--color-ink)] font-medium">Pensión AFP (-7.25%)</span>
                      <span className="text-[var(--color-muted)] block text-[11px] mt-0.5">
                        Ahorro para el retiro sobre salario, bonos y vacación.
                        {(activePayroll.additions?.includeAguinaldo || activePayroll.additions?.includeQ25) && (
                          <span className="text-[var(--color-emerald)] block mt-0.5">
                            * Aguinaldo y Q25 están legalmente exentos de AFP (Art. 198 CT y Decreto 499).
                          </span>
                        )}
                      </span>
                      {showLegalDetails && (
                        <div className="text-[var(--color-ink-2)] text-[11px] mt-1">
                          Cálculo: Base cotizable × 7.25% = -{formatUSD(activePayroll.afpEmployee)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--color-muted)]">
                      -{formatUSD(activePayroll.afpEmployee)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--color-ink)] font-medium">Seguro Social ISSS (-3.00%)</span>
                        {activePayroll.isssCapped && (
                          <PrimeTag severity="neutral">Tope máximo alcanzado</PrimeTag>
                        )}
                      </div>
                      <span className="text-[var(--color-muted)] block text-[11px] mt-0.5">
                        Seguro médico del 3% con techo de{' '}
                        {period === 'monthly' ? '$30.00 al mes ($1,000 de sueldo)' : '$15.00 por quincena'}.
                        {(activePayroll.additions?.includeAguinaldo || activePayroll.additions?.includeQ25) && (
                          <span className="text-[var(--color-emerald)] block mt-0.5">
                            * Aguinaldo y Q25 están legalmente exentos de ISSS (Art. 198 CT y Decreto 499).
                          </span>
                        )}
                      </span>
                      {showLegalDetails && (
                        <div className="text-[var(--color-ink-2)] text-[11px] mt-1">
                          Cálculo: 3% sobre base cotizable (topado a {period === 'monthly' ? '$1,000.00' : '$500.00'}) = -{formatUSD(activePayroll.isssEmployee)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--color-muted)]">
                      -{formatUSD(activePayroll.isssEmployee)}
                    </td>
                  </tr>

                  <tr className="bg-[var(--color-surface)]">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[var(--color-ink)]">
                        Sueldo Imponible (Base de Renta)
                      </span>
                      <span className="text-[var(--color-muted)] block text-[11px] mt-0.5">
                        Sueldo bruto menos AFP e ISSS.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-ink)]">
                      {formatUSD(activePayroll.taxableIncome)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--color-ink)] font-medium">
                          Impuesto sobre la Renta (ISR)
                        </span>
                        <PrimeTag severity={activePayroll.isrDetail.bracketId === 'I' ? 'success' : 'neutral'}>
                          {activePayroll.isrDetail.bracketId === 'I'
                            ? 'Exento de Renta'
                            : `Tramo ${activePayroll.isrDetail.bracketId}`}
                        </PrimeTag>
                      </div>
                      <span className="text-[var(--color-muted)] block text-[11px] mt-0.5">
                        {activePayroll.isrDetail.bracketId === 'I' ? (
                          <span className="text-[var(--color-emerald)]">
                            Sin retención: tu sueldo imponible no supera{' '}
                            {period === 'monthly' ? '$550.00' : '$275.00'}.
                          </span>
                        ) : (
                          <span>
                            Cuota fija de {formatUSD(activePayroll.isrDetail.fixedFee)} más el{' '}
                            {Math.round(activePayroll.isrDetail.rate * 100)}% sobre el exceso de{' '}
                            {formatUSD(activePayroll.isrDetail.excessOver)}.
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-danger)]">
                      -{formatUSD(activePayroll.isr)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] flex justify-between items-center gap-3">
              <div>
                <span className="text-sm font-semibold text-[var(--color-ink)] block">
                  Salario Neto a Recibir
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  Retención de ley efectiva: {activePayroll.effectiveDeductionPct}%
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-[var(--color-emerald)]">
                {formatUSD(activePayroll.netPay)}
              </span>
            </div>

            {period === 'biweekly' && activePayroll.quincenaDetails && (
              <div className="p-4 border-t border-[var(--color-rule)] space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-ink)]">
                    Desglose Quincenal Consolidado (Liquidación de Mes)
                  </span>
                  <PrimeTag severity="neutral" className="font-mono">
                    Total Mensual: {formatUSD(monthlyPayroll.netPay)}
                  </PrimeTag>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="surface-well p-3">
                    <span className="text-[var(--color-muted)] block font-sans text-[11px]">
                      1.ª Quincena (Día 1 al 15):
                    </span>
                    <strong className="text-[var(--color-ink)] text-sm">
                      {formatUSD(activePayroll.quincenaDetails.q1.netPay)} neto
                    </strong>
                    <span className="text-[var(--color-muted)] block font-sans text-[10px] mt-0.5">
                      Bruto: {formatUSD(activePayroll.quincenaDetails.q1.grossTotal)} · Deds: -
                      {formatUSD(activePayroll.quincenaDetails.q1.totalEmployeeDeductions)}
                    </span>
                  </div>
                  <div className="surface-well p-3">
                    <span className="text-[var(--color-muted)] block font-sans text-[11px]">
                      2.ª Quincena (Ajuste de Cierre):
                    </span>
                    <strong className="text-[var(--color-ink)] text-sm">
                      {formatUSD(activePayroll.quincenaDetails.q2.netPay)} neto
                    </strong>
                    <span className="text-[var(--color-muted)] block font-sans text-[10px] mt-0.5">
                      Bruto: {formatUSD(activePayroll.quincenaDetails.q2.grossTotal)} · Deds: -
                      {formatUSD(activePayroll.quincenaDetails.q2.totalEmployeeDeductions)}
                    </span>
                  </div>
                </div>
                {activePayroll.quincenaDetails.hasOddCentAdjustment && (
                  <div className="text-[var(--color-muted)] text-[11px] flex items-center gap-1.5">
                    <Info size={12} className="shrink-0" />
                    <span>
                      El centavo diferencial se ajusta en la 2.ª quincena conforme a la declaración mensual ante ISSS, AFP y Hacienda.
                    </span>
                  </div>
                )}
              </div>
            )}
          </PrimeCard>

          {/* Columna Derecha: Gráfico PrimeUI (Chart.js) */}
          <PrimeCard padded className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                <PieChart size={16} className="text-[var(--color-accent)]" />
                <span>Distribución del Ingreso</span>
              </h6>
              <span className="text-xs font-mono text-[var(--color-muted)]">
                {formatUSD(activePayroll.grossTotal)}
              </span>
            </div>
            <PrimeChart type="doughnut" data={payrollChartData} height={220} />
            <div className="space-y-1.5 pt-2 border-t border-[var(--color-rule)] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)] font-sans">Salario Neto:</span>
                <span className="font-semibold text-[var(--color-emerald)]">{formatUSD(activePayroll.netPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)] font-sans">Total Deducciones:</span>
                <span className="font-semibold text-[var(--color-danger)]">
                  -{formatUSD(activePayroll.totalEmployeeDeductions)}
                </span>
              </div>
            </div>
          </PrimeCard>
        </div>
      )}

      {/* PESTAÑA 2: Tabla de Renta ISR */}
      {activeDetailTab === 'renta' && (
        <PrimeCard>
          <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex flex-wrap justify-between items-center gap-2">
            <div>
              <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                <ShieldCheck size={16} className="text-[var(--color-muted)]" />
                <span>Tabla de Retención de Renta (Decreto 254)</span>
              </h6>
              <span className="text-xs text-[var(--color-muted)]">
                Base imponible calculada:{' '}
                <strong className="text-[var(--color-ink)] font-mono">
                  {formatUSD(activePayroll.taxableIncome)}
                </strong>
              </span>
            </div>

            <PrimeButton
              variant="outline"
              size="xs"
              onClick={() => setShowAllBrackets((prev) => !prev)}
            >
              <span>{showAllBrackets ? 'Ocultar escala' : 'Ver los 4 tramos'}</span>
              {showAllBrackets ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </PrimeButton>
          </div>

          <div className="p-4 space-y-4">
            <div className="surface-well p-3.5">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <PrimeTag severity="info" className="font-mono">
                    Tramo {activePayroll.isrDetail.bracketId}
                  </PrimeTag>
                  <strong className="text-sm text-[var(--color-ink)]">
                    {activePayroll.isrDetail.bracketLabel}
                  </strong>
                </div>
                <span className="font-mono font-bold text-[var(--color-danger)]">
                  -{formatUSD(activePayroll.isr)}
                </span>
              </div>
              <p className="text-[var(--color-muted)] text-xs font-mono m-0">
                {activePayroll.isrDetail.bracketId === 'I' ? (
                  <span>
                    Tu base gravada no supera el límite exento ({period === 'monthly' ? '$550.00' : '$275.00'}). No aplica retención de ISR.
                  </span>
                ) : (
                  <span>
                    Cuota fija de {formatUSD(activePayroll.isrDetail.fixedFee)} más el{' '}
                    {Math.round(activePayroll.isrDetail.rate * 100)}% sobre el exceso de{' '}
                    {formatUSD(activePayroll.isrDetail.excessOver)}.
                  </span>
                )}
              </p>
            </div>

            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] text-[var(--color-muted)] font-mono mb-1.5">
                <span>Exento ($0 - {period === 'monthly' ? '$550.00' : '$275.00'})</span>
                <span>10% ({period === 'monthly' ? '$550 - $895.24' : '$275 - $447.62'})</span>
                <span>20% ({period === 'monthly' ? '$895.24 - $2,038.10' : '$447.62 - $1,019.05'})</span>
                <span className="sm:text-right">30% (&gt; {period === 'monthly' ? '$2,038.10' : '$1,019.05'})</span>
              </div>
              <PrimeProgressBar value={isrMarkerPercent} />
            </div>

            {showAllBrackets && (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-rule)]">
                <table className="w-full text-left border-collapse font-mono text-xs min-w-[480px]">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                      <th className="py-2.5 px-3">Tramo</th>
                      <th className="py-2.5 px-3">Desde</th>
                      <th className="py-2.5 px-3">Hasta</th>
                      <th className="py-2.5 px-3">Porcentaje</th>
                      <th className="py-2.5 px-3">Cuota fija</th>
                      <th className="py-2.5 px-3 text-right">Sobre exceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-rule)]">
                    {ISR_TABLES[period].map((rule) => {
                      const isCurrent = activePayroll.isrDetail.bracketId === rule.id;
                      return (
                        <tr key={rule.id} className={isCurrent ? 'bg-[var(--color-accent-soft)] font-semibold' : ''}>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5">
                              {isCurrent && <PrimeTag severity="info">Actual</PrimeTag>}
                              <span>Tramo {rule.id}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{formatUSD(rule.from)}</td>
                          <td className="py-2.5 px-3">{rule.to ? formatUSD(rule.to) : 'En adelante'}</td>
                          <td className="py-2.5 px-3">{Math.round(rule.rate * 100)}%</td>
                          <td className="py-2.5 px-3">{formatUSD(rule.fixedFee)}</td>
                          <td className="py-2.5 px-3 text-right">{formatUSD(rule.excessOver)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PrimeCard>
      )}

      {/* PESTAÑA 3: Costo Patronal */}
      {activeDetailTab === 'patronal' && (
        <PrimeCard>
          <div className="px-4 py-3.5 border-b border-[var(--color-rule)]">
            <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
              <Building size={16} className="text-[var(--color-muted)]" />
              <span>Costo Patronal y Aportes de la Empresa ({period === 'monthly' ? 'Mensual' : 'Quincenal'})</span>
            </h6>
            <span className="text-xs text-[var(--color-muted)]">
              Cargas sociales obligatorias que la empresa paga además de tu salario bruto
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="surface-well p-3.5">
                <span className="text-xs text-[var(--color-muted)] block mb-1">AFP Patronal (8.75%)</span>
                <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                  {formatUSD(activePayroll.afpEmployer)}
                </span>
              </div>
              <div className="surface-well p-3.5">
                <span className="text-xs text-[var(--color-muted)] block mb-1">
                  ISSS Patronal (7.5% máx {period === 'monthly' ? '$75.00' : '$37.50'})
                </span>
                <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                  {formatUSD(activePayroll.isssEmployer)}
                </span>
              </div>
              <div className="surface-well p-3.5">
                <span className="text-xs text-[var(--color-muted)] block mb-1">INSAFORP/INCAF (1%)</span>
                <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                  {formatUSD(activePayroll.insaforpEmployer)}
                </span>
              </div>
            </div>

            <div className="surface-well p-4 flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-xs font-semibold text-[var(--color-ink)] block">
                  Costo Total Empresa:
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  Salario Bruto ({formatUSD(activePayroll.grossTotal)}) + Cargas patronales ({formatUSD(round2(activePayroll.totalEmployerCost - activePayroll.grossTotal))})
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-[var(--color-ink)]">
                {formatUSD(activePayroll.totalEmployerCost)}
              </span>
            </div>
          </div>
        </PrimeCard>
      )}

      {extraMonthlyBonus > 0 && (
        <PrimeCard padded className="border-l-4 border-l-[var(--color-accent)]">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="text-xs text-[var(--color-muted)] block">
                Impacto de Bono Mensual (+{formatUSD(extraMonthlyBonus)})
              </span>
              <strong className="text-xs text-[var(--color-ink)]">
                ¿Cuánto de tu bono adicional llega efectivamente a tu bolsillo?
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="text-[var(--color-muted)]">
                Sin bono: {formatUSD(monthlyBaseOnlyPayroll.netPay)}
              </span>
              <ChevronRight size={14} className="text-[var(--color-muted)]" />
              <span className="text-[var(--color-emerald)] font-semibold">
                Con bono: {formatUSD(monthlyPayroll.netPay)}
              </span>
              <PrimeTag severity="success">
                Neto real: +{formatUSD(round2(monthlyPayroll.netPay - monthlyBaseOnlyPayroll.netPay))}
              </PrimeTag>
            </div>
          </div>
        </PrimeCard>
      )}
    </motion.div>
  );
}
