import { motion } from 'motion/react';
import { Calculator, Building2, ChevronRight } from 'lucide-react';
import {
  ISR_TABLES,
  round2,
  type PayPeriod,
  type PayrollBreakdown,
} from '../lib/svLaborLaw.ts';

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
  return (
    <motion.div
      key="tab-payroll"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Proportional Salary Distribution Bar */}
      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-serif-editorial text-lg font-semibold">
              Distribución de tu Salario {period === 'monthly' ? 'Mensual' : 'Quincenal'}
            </h2>
            <p className="text-xs text-[#65635E]">
              Proporción exacta entre salario líquido disponible y retenciones obligatorias
            </p>
          </div>
          <div className="text-xs font-mono-tabular text-[#65635E]">
            Bruto total: <strong className="text-[#141413]">{formatUSD(activePayroll.grossTotal)}</strong>
          </div>
        </div>

        {/* Animated Stacked Bar */}
        <div className="h-5 w-full rounded-xl bg-[#EFECE6] overflow-hidden flex p-0.5 gap-0.5">
          {activePayroll.grossTotal > 0 && (
            <>
              <motion.div
                layout
                style={{
                  width: `${(activePayroll.netPay / activePayroll.grossTotal) * 100}%`,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="h-full bg-[#0F4C3A] rounded-l-lg"
                title={`Salario Líquido: ${formatUSD(activePayroll.netPay)}`}
              />
              <motion.div
                layout
                style={{
                  width: `${(activePayroll.afpEmployee / activePayroll.grossTotal) * 100}%`,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="h-full bg-[#D97706]"
                title={`AFP (7.25%): ${formatUSD(activePayroll.afpEmployee)}`}
              />
              <motion.div
                layout
                style={{
                  width: `${(activePayroll.isssEmployee / activePayroll.grossTotal) * 100}%`,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="h-full bg-[#2563EB]"
                title={`ISSS (3%): ${formatUSD(activePayroll.isssEmployee)}`}
              />
              {activePayroll.isr > 0 && (
                <motion.div
                  layout
                  style={{
                    width: `${(activePayroll.isr / activePayroll.grossTotal) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="h-full bg-[#B91C1C] rounded-r-lg"
                  title={`Renta ISR: ${formatUSD(activePayroll.isr)}`}
                />
              )}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[#EFECE6] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0F4C3A] shrink-0" />
            <span className="text-[#65635E]">Líquido:</span>
            <span className="font-mono-tabular font-semibold ml-auto">
              {formatUSD(activePayroll.netPay)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706] shrink-0" />
            <span className="text-[#65635E]">AFP (7.25%):</span>
            <span className="font-mono-tabular font-semibold ml-auto">
              {formatUSD(activePayroll.afpEmployee)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB] shrink-0" />
            <span className="text-[#65635E]">ISSS (3%):</span>
            <span className="font-mono-tabular font-semibold ml-auto">
              {formatUSD(activePayroll.isssEmployee)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B91C1C] shrink-0" />
            <span className="text-[#65635E]">Renta (ISR):</span>
            <span className="font-mono-tabular font-semibold ml-auto">
              {formatUSD(activePayroll.isr)}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Detailed Breakdown: Employee Boleta vs ISR Bracket Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Boleta de Pago Detallada */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EFECE6]">
              <div>
                <h3 className="font-serif-editorial text-lg font-semibold">
                  Desglose de Boleta de Pago ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                </h3>
                <p className="text-xs text-[#65635E]">
                  Cálculo paso a paso conforme al Código de Trabajo y Ministerio de Hacienda
                </p>
              </div>
              <Calculator className="w-5 h-5 text-[#0F4C3A]" />
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#4A4945]">
                  Salario Base {period === 'monthly' ? 'Mensual' : 'Quincenal'}
                </span>
                <span className="font-mono-tabular font-medium">{formatUSD(activePayroll.grossBase)}</span>
              </div>

              {activePayroll.bonuses > 0 && (
                <div className="flex justify-between items-center py-1.5 text-[#0F4C3A] bg-[#0F4C3A]/5 px-2.5 rounded-lg">
                  <span>+ Bonos / Comisiones Gravadas</span>
                  <span className="font-mono-tabular font-medium">+{formatUSD(activePayroll.bonuses)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-t border-b border-[#EFECE6] font-semibold">
                <span>Total Ingreso Bruto</span>
                <span className="font-mono-tabular">{formatUSD(activePayroll.grossTotal)}</span>
              </div>

              {/* AFP */}
              <div className="flex justify-between items-start py-1.5">
                <div>
                  <div className="font-medium text-[#141413]">Descuento AFP (7.25%)</div>
                  <div className="text-xs text-[#65635E] font-mono-tabular">
                    {formatUSD(activePayroll.grossTotal)} × 7.25% (Sin techo máximo)
                  </div>
                </div>
                <span className="font-mono-tabular text-[#B45309] font-medium">
                  -{formatUSD(activePayroll.afpEmployee)}
                </span>
              </div>

              {/* ISSS */}
              <div className="flex justify-between items-start py-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#141413]">Descuento ISSS (3.00%)</span>
                    {activePayroll.isssCapped && (
                      <span className="text-[10px] font-mono-tabular uppercase bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded-full font-semibold">
                        Tope aplicado ({period === 'monthly' ? '$30.00' : '$15.00'})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#65635E] font-mono-tabular">
                    Techo cotizable: {period === 'monthly' ? '$1,000.00/mes' : '$500.00/quincena'}
                  </div>
                </div>
                <span className="font-mono-tabular text-[#2563EB] font-medium">
                  -{formatUSD(activePayroll.isssEmployee)}
                </span>
              </div>

              {/* Renta Gravada */}
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#65635E] block">
                    Base Imponible (Renta Gravada)
                  </span>
                  <span className="text-xs text-[#65635E] font-mono-tabular">
                    Bruto ({formatUSD(activePayroll.grossTotal)}) - AFP ({formatUSD(activePayroll.afpEmployee)}) -
                    ISSS ({formatUSD(activePayroll.isssEmployee)})
                  </span>
                </div>
                <span className="font-mono-tabular font-semibold text-base text-[#141413]">
                  {formatUSD(activePayroll.taxableIncome)}
                </span>
              </div>

              {/* ISR */}
              <div className="flex justify-between items-start py-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#141413]">Retención de Renta (ISR)</span>
                    <span className="text-[11px] font-mono-tabular bg-[#B91C1C]/10 text-[#B91C1C] px-2 py-0.5 rounded-full font-semibold">
                      {activePayroll.isrDetail.bracketLabel}
                    </span>
                  </div>
                  {activePayroll.isrDetail.bracketId === 'I' ? (
                    <div className="text-xs text-[#65635E]">
                      Renta gravada no supera {period === 'monthly' ? '$550.00' : '$275.00'} (Exento de ISR)
                    </div>
                  ) : (
                    <div className="text-xs text-[#65635E] font-mono-tabular">
                      Cuota fija {formatUSD(activePayroll.isrDetail.fixedFee)} + (
                      {formatUSD(activePayroll.taxableIncome)} - {formatUSD(activePayroll.isrDetail.excessOver)}) ×{' '}
                      {Math.round(activePayroll.isrDetail.rate * 100)}%
                    </div>
                  )}
                </div>
                <span className="font-mono-tabular text-[#B91C1C] font-medium">
                  -{formatUSD(activePayroll.isr)}
                </span>
              </div>
            </div>
          </div>

          {/* Final Net Box */}
          <div className="mt-5 pt-4 border-t border-[#DFDCD2] flex items-center justify-between bg-[#0F4C3A]/6 p-4 rounded-xl">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C3A] block">
                Salario Líquido a Recibir ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
              </span>
              <span className="text-xs text-[#4A4945]">
                Retención total efectiva: {activePayroll.effectiveDeductionPct}% del salario bruto
              </span>
            </div>
            <div className="text-2xl font-mono-tabular font-bold text-[#0F4C3A]">
              {formatUSD(activePayroll.netPay)}
            </div>
          </div>
        </div>

        {/* Right: Interactive ISR Bracket Visualizer & Employer Cost */}
        <div className="lg:col-span-6 space-y-6">
          {/* ISR Bracket Card */}
          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif-editorial text-lg font-semibold">
                  Tabla Oficial de Renta ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                </h3>
                <p className="text-xs text-[#65635E]">
                  Tu renta gravada actual es{' '}
                  <strong className="font-mono-tabular text-[#141413]">
                    {formatUSD(activePayroll.taxableIncome)}
                  </strong>
                </p>
              </div>
              <span className="text-xs font-mono-tabular px-2.5 py-1 rounded-lg bg-[#F6F5F0] border border-[#E2DFD7] font-medium">
                Tasa efectiva ISR: {activePayroll.isrDetail.effectiveTaxRateOnTaxable}%
              </span>
            </div>

            {/* Visual Animated Bracket Bar */}
            <div className="relative pt-6 pb-2">
              <motion.div
                animate={{ left: `${isrMarkerPercent}%` }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10"
              >
                <span className="text-[10px] font-mono-tabular bg-[#141413] text-white px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap">
                  {formatUSD(activePayroll.taxableIncome)}
                </span>
                <div className="w-0.5 h-2.5 bg-[#141413]" />
              </motion.div>

              <div className="grid grid-cols-4 gap-1 h-3 rounded-lg overflow-hidden">
                <div className="bg-emerald-600/70" title="Tramo I: Exento" />
                <div className="bg-amber-500/80" title="Tramo II: 10%" />
                <div className="bg-orange-600/80" title="Tramo III: 20%" />
                <div className="bg-red-700/85" title="Tramo IV: 30%" />
              </div>
            </div>

            {/* Table of Brackets */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2DFD7] text-[#65635E] text-left">
                    <th className="py-2 font-medium">Tramo</th>
                    <th className="py-2 font-medium">Renta Gravada</th>
                    <th className="py-2 font-medium">%</th>
                    <th className="py-2 font-medium">Cuota Fija</th>
                    <th className="py-2 font-medium text-right">Sobre exceso de</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6] font-mono-tabular">
                  {ISR_TABLES[period].map((rule) => {
                    const isCurrent = activePayroll.isrDetail.bracketId === rule.id;
                    return (
                      <tr
                        key={rule.id}
                        className={
                          isCurrent
                            ? 'bg-[#0F4C3A]/8 text-[#141413] font-semibold'
                            : 'text-[#65635E]'
                        }
                      >
                        <td className="py-2 pr-2 font-sans">
                          <span className="inline-flex items-center gap-1.5">
                            {isCurrent && <span className="w-2 h-2 rounded-full bg-[#0F4C3A]" />}
                            Tramo {rule.id}
                          </span>
                        </td>
                        <td className="py-2 pr-2">
                          {formatUSD(rule.from)} – {rule.to ? formatUSD(rule.to) : 'Más'}
                        </td>
                        <td className="py-2 pr-2">{Math.round(rule.rate * 100)}%</td>
                        <td className="py-2 pr-2">{formatUSD(rule.fixedFee)}</td>
                        <td className="py-2 text-right">{formatUSD(rule.excessOver)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employer Contributions (Aporte Patronal) */}
          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F4C3A]" />
                <h3 className="font-serif-editorial text-base font-semibold">
                  Aportes Patronales y Costo Real para la Empresa
                </h3>
              </div>
              <span className="text-xs font-mono-tabular text-[#65635E]">
                {period === 'monthly' ? 'Mensual' : 'Quincenal'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
                <span className="text-[#65635E] block">AFP Patronal (8.75%)</span>
                <span className="font-mono-tabular font-semibold text-sm text-[#141413] mt-0.5 block">
                  {formatUSD(activePayroll.afpEmployer)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
                <span className="text-[#65635E] block">
                  ISSS Patronal (7.5% · máx {period === 'monthly' ? '$75' : '$37.50'})
                </span>
                <span className="font-mono-tabular font-semibold text-sm text-[#141413] mt-0.5 block">
                  {formatUSD(activePayroll.isssEmployer)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7]">
                <span className="text-[#65635E] block">INSAFORP / INCAF (1.0%)</span>
                <span className="font-mono-tabular font-semibold text-sm text-[#141413] mt-0.5 block">
                  {formatUSD(activePayroll.insaforpEmployer)}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs">
              <span className="text-[#65635E]">
                Costo total en planilla (Salario Bruto + Aportes Patronales):
              </span>
              <span className="font-mono-tabular font-bold text-sm text-[#141413]">
                {formatUSD(activePayroll.totalEmployerCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Marginal Bonus Impact Banner (when extraMonthlyBonus > 0) */}
      {extraMonthlyBonus > 0 && (
        <div className="bg-white rounded-2xl border border-[#0F4C3A]/30 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#0F4C3A] font-semibold">
                Análisis de Bono / Comisión Mensual (+{formatUSD(extraMonthlyBonus)})
              </span>
              <h4 className="font-serif-editorial text-base font-semibold mt-0.5">
                ¿Cuánto de tu bono adicional llega realmente a tu bolsillo?
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tabular">
              <div>
                <span className="text-[#65635E] block">Líquido sin bono</span>
                <strong className="text-sm">{formatUSD(monthlyBaseOnlyPayroll.netPay)}</strong>
              </div>
              <ChevronRight className="w-4 h-4 text-[#65635E]" />
              <div>
                <span className="text-[#65635E] block">Líquido con bono</span>
                <strong className="text-sm text-[#0F4C3A]">{formatUSD(monthlyPayroll.netPay)}</strong>
              </div>
              <div className="bg-[#0F4C3A]/10 text-[#0F4C3A] px-3 py-1.5 rounded-lg">
                Neto real del bono:{' '}
                <strong>
                  +{formatUSD(round2(monthlyPayroll.netPay - monthlyBaseOnlyPayroll.netPay))}
                </strong>{' '}
                (retención marginal de{' '}
                {formatUSD(
                  round2(extraMonthlyBonus - (monthlyPayroll.netPay - monthlyBaseOnlyPayroll.netPay))
                )}
                )
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
