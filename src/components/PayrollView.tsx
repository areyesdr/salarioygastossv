import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  Building,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ChevronRight,
} from 'lucide-react';
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

type DetailTab = 'boleta' | 'renta' | 'patronal';

export function PayrollView({
  period,
  activePayroll,
  monthlyPayroll,
  monthlyBaseOnlyPayroll,
  extraMonthlyBonus,
  isrMarkerPercent,
  formatUSD,
}: PayrollViewProps) {
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('boleta');
  const [showLegalDetails, setShowLegalDetails] = useState<boolean>(false);
  const [showAllBrackets, setShowAllBrackets] = useState<boolean>(false);

  return (
    <motion.div
      key="tab-payroll"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      {/* Selector de Pestañas Inferiores para Desglose Progresivo */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="segmented-control">
          <button
            type="button"
            onClick={() => setActiveDetailTab('boleta')}
            className={activeDetailTab === 'boleta' ? 'active' : ''}
          >
            Boleta de Pago
          </button>
          <button
            type="button"
            onClick={() => setActiveDetailTab('renta')}
            className={activeDetailTab === 'renta' ? 'active' : ''}
          >
            Cálculo de Renta (Tramos)
          </button>
          <button
            type="button"
            onClick={() => setActiveDetailTab('patronal')}
            className={activeDetailTab === 'patronal' ? 'active' : ''}
          >
            Costo Patronal (Empresa)
          </button>
        </div>

        {activeDetailTab === 'boleta' && (
          <button
            type="button"
            onClick={() => setShowLegalDetails((prev) => !prev)}
            className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1.5"
            style={{ fontSize: '13px' }}
          >
            <Info size={14} className="text-secondary" />
            <span>{showLegalDetails ? 'Ocultar detalles legales' : 'Ver detalles legales y fórmulas'}</span>
          </button>
        )}
      </div>

      {/* PESTAÑA 1: Boleta de Pago */}
      {activeDetailTab === 'boleta' && (
        <div className="card-soft mb-4">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                <Calculator size={17} className="text-secondary" />
                <span>Boleta Oficial de Pago ({period === 'monthly' ? 'Mensual' : 'Quincenal'})</span>
              </h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Conforme al Código de Trabajo y Ley de Impuesto sobre la Renta de El Salvador
              </span>
            </div>
            <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '11px' }}>
              Decreto 254
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-minimal align-middle">
              <thead>
                <tr>
                  <th>Concepto / Deducción</th>
                  {showLegalDetails && <th className="text-muted">Base de Ley</th>}
                  <th className="text-end">Monto (USD)</th>
                </tr>
              </thead>
              <tbody className="font-monospace small">
                {/* Salario Base */}
                <tr>
                  <td className="font-sans">
                    <span className="fw-semibold text-slate-dark">Salario Base</span>
                    {showLegalDetails && (
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        Nominal estipulado en contrato
                      </span>
                    )}
                  </td>
                  {showLegalDetails && <td className="text-muted">Base contractual</td>}
                  <td className="text-end fw-semibold text-slate-dark">{formatUSD(activePayroll.grossBase)}</td>
                </tr>

                {/* Bonos si aplican */}
                {activePayroll.bonuses > 0 && (
                  <tr>
                    <td className="font-sans">
                      <span className="fw-semibold text-emerald">+ Bono / Comisión</span>
                    </td>
                    {showLegalDetails && <td className="text-muted">Gravado para ISSS, AFP y Renta</td>}
                    <td className="text-end fw-semibold text-emerald">+{formatUSD(activePayroll.bonuses)}</td>
                  </tr>
                )}

                {/* Total Bruto */}
                <tr className="bg-light">
                  <td className="font-sans fw-semibold text-slate-dark">Total Ingreso Bruto</td>
                  {showLegalDetails && <td className="text-muted">Base + Comisiones</td>}
                  <td className="text-end fw-bold text-slate-dark fs-6">{formatUSD(activePayroll.grossTotal)}</td>
                </tr>

                {/* AFP */}
                <tr>
                  <td className="font-sans">
                    <span className="text-slate-dark">AFP Trabajador (7.25%)</span>
                    {showLegalDetails && (
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        Fondo de pensiones obligatorio (sin techo salarial)
                      </span>
                    )}
                  </td>
                  {showLegalDetails && (
                    <td className="text-muted">{formatUSD(activePayroll.grossTotal)} × 7.25%</td>
                  )}
                  <td className="text-end text-muted font-monospace">-{formatUSD(activePayroll.afpEmployee)}</td>
                </tr>

                {/* ISSS */}
                <tr>
                  <td className="font-sans">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="text-slate-dark">ISSS Trabajador (3.00%)</span>
                      {activePayroll.isssCapped && (
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                          Tope {period === 'monthly' ? '$30.00' : '$15.00'}
                        </span>
                      )}
                    </div>
                    {showLegalDetails && (
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        Techo cotizable: {period === 'monthly' ? '$1,000.00/mes' : '$500.00/quincena'}
                      </span>
                    )}
                  </td>
                  {showLegalDetails && (
                    <td className="text-muted">3% hasta tope {period === 'monthly' ? '$1,000' : '$500'}</td>
                  )}
                  <td className="text-end text-muted font-monospace">-{formatUSD(activePayroll.isssEmployee)}</td>
                </tr>

                {/* Renta Gravada Imponible */}
                <tr className="bg-light">
                  <td className="font-sans">
                    <span className="fw-semibold text-slate-dark">Renta Gravada (Base Imponible)</span>
                    {showLegalDetails && (
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        Ingreso bruto menos deducciones de AFP e ISSS
                      </span>
                    )}
                  </td>
                  {showLegalDetails && <td className="text-muted">Bruto - AFP - ISSS</td>}
                  <td className="text-end fw-semibold text-slate-dark">{formatUSD(activePayroll.taxableIncome)}</td>
                </tr>

                {/* Retención Renta ISR */}
                <tr>
                  <td className="font-sans">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="text-slate-dark">Retención de Renta (ISR)</span>
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                        {activePayroll.isrDetail.bracketLabel}
                      </span>
                    </div>
                    {showLegalDetails && (
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        {activePayroll.isrDetail.bracketId === 'I'
                          ? `Exento (base imponible ≤ ${period === 'monthly' ? '$550.00' : '$275.00'})`
                          : `Cuota fija $${activePayroll.isrDetail.fixedFee} + ${Math.round(activePayroll.isrDetail.rate * 100)}% sobre exceso de $${activePayroll.isrDetail.excessOver}`}
                      </span>
                    )}
                  </td>
                  {showLegalDetails && <td className="text-muted">Tabla Decreto 254</td>}
                  <td className="text-end font-monospace" style={{ color: '#991b1b' }}>
                    -{formatUSD(activePayroll.isr)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pie de boleta con el líquido neto */}
          <div className="p-3 bg-slate-50 border-top d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold text-slate-dark d-block" style={{ fontSize: '13px' }}>
                Salario Neto a Recibir
              </span>
              <span className="text-muted small">
                Retención de ley efectiva: {activePayroll.effectiveDeductionPct}%
              </span>
            </div>
            <span className="fs-4 fw-bold font-monospace text-emerald">
              {formatUSD(activePayroll.netPay)}
            </span>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Tabla de Renta ISR */}
      {activeDetailTab === 'renta' && (
        <div className="card-soft mb-4">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                <ShieldCheck size={17} className="text-secondary" />
                <span>Tabla de Retención de Renta (Decreto 254)</span>
              </h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Tu base imponible calculada es{' '}
                <strong className="text-slate-dark font-monospace">{formatUSD(activePayroll.taxableIncome)}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllBrackets((prev) => !prev)}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ fontSize: '12px' }}
            >
              <span>{showAllBrackets ? 'Ocultar escala' : 'Ver los 4 tramos'}</span>
              {showAllBrackets ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <div className="p-3">
            {/* Tramo Activo Destacado Sobrio */}
            <div className="p-3 rounded border bg-light mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary font-monospace">Tramo {activePayroll.isrDetail.bracketId}</span>
                  <strong className="text-slate-dark">{activePayroll.isrDetail.bracketLabel}</strong>
                </div>
                <span className="font-monospace fw-bold" style={{ color: '#991b1b' }}>
                  -{formatUSD(activePayroll.isr)}
                </span>
              </div>
              <p className="text-muted small mb-0 font-monospace">
                {activePayroll.isrDetail.bracketId === 'I' ? (
                  <span>Tu base gravada no supera el límite exento ({period === 'monthly' ? '$550.00' : '$275.00'}). No aplica retención de ISR.</span>
                ) : (
                  <span>
                    Cuota fija de {formatUSD(activePayroll.isrDetail.fixedFee)} más el {Math.round(activePayroll.isrDetail.rate * 100)}% sobre el exceso de {formatUSD(activePayroll.isrDetail.excessOver)}.
                  </span>
                )}
              </p>
            </div>

            {/* Escala Visual Discreta en tonos neutros */}
            <div className="mb-3">
              <div className="d-flex justify-content-between small text-muted font-monospace mb-1" style={{ fontSize: '11px' }}>
                <span>Exento ($0 - {period === 'monthly' ? '$550' : '$275'})</span>
                <span>10% ({period === 'monthly' ? '$550 - $895' : '$275 - $447'})</span>
                <span>20% ({period === 'monthly' ? '$895 - $2,038' : '$447 - $1,019'})</span>
                <span>30% (&gt; {period === 'monthly' ? '$2,038' : '$1,019'})</span>
              </div>
              <div className="progress" style={{ height: '6px', backgroundColor: '#e2e8f0' }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${isrMarkerPercent}%`,
                    backgroundColor: '#475569',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Tabla Completa de Tramos */}
            {showAllBrackets && (
              <div className="table-responsive border rounded">
                <table className="table table-minimal align-middle small font-monospace">
                  <thead>
                    <tr>
                      <th>Tramo</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th>Porcentaje</th>
                      <th>Cuota fija</th>
                      <th className="text-end">Sobre exceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ISR_TABLES[period].map((rule) => {
                      const isCurrent = activePayroll.isrDetail.bracketId === rule.id;
                      return (
                        <tr key={rule.id} className={isCurrent ? 'bg-light fw-bold' : ''}>
                          <td>
                            {isCurrent && <span className="badge bg-secondary me-1">Actual</span>}
                            Tramo {rule.id}
                          </td>
                          <td>{formatUSD(rule.from)}</td>
                          <td>{rule.to ? formatUSD(rule.to) : 'En adelante'}</td>
                          <td>{Math.round(rule.rate * 100)}%</td>
                          <td>{formatUSD(rule.fixedFee)}</td>
                          <td className="text-end">{formatUSD(rule.excessOver)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Costo Patronal */}
      {activeDetailTab === 'patronal' && (
        <div className="card-soft mb-4">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                <Building size={17} className="text-secondary" />
                <span>Costo Patronal y Aportes de la Empresa ({period === 'monthly' ? 'Mensual' : 'Quincenal'})</span>
              </h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Cargas sociales obligatorias que la empresa paga además de tu salario bruto
              </span>
            </div>
          </div>

          <div className="p-3">
            <div className="row g-3 mb-3 text-center">
              <div className="col-4">
                <div className="p-3 border rounded bg-light">
                  <span className="text-muted small d-block">AFP Patronal (8.75%)</span>
                  <span className="fs-5 fw-bold font-monospace text-slate-dark">
                    {formatUSD(activePayroll.afpEmployer)}
                  </span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 border rounded bg-light">
                  <span className="text-muted small d-block">
                    ISSS Patronal (7.5% máx {period === 'monthly' ? '$75' : '$37.50'})
                  </span>
                  <span className="fs-5 fw-bold font-monospace text-slate-dark">
                    {formatUSD(activePayroll.isssEmployer)}
                  </span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 border rounded bg-light">
                  <span className="text-muted small d-block">INSAFORP/INCAF (1%)</span>
                  <span className="fs-5 fw-bold font-monospace text-slate-dark">
                    {formatUSD(activePayroll.insaforpEmployer)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded bg-slate-50 d-flex justify-content-between align-items-center">
              <div>
                <span className="small fw-semibold text-slate-dark d-block">
                  Costo Total Empresa:
                </span>
                <span className="text-muted small" style={{ fontSize: '12px' }}>
                  Salario Bruto ({formatUSD(activePayroll.grossTotal)}) + Cargas patronales ({formatUSD(round2(activePayroll.totalEmployerCost - activePayroll.grossTotal))})
                </span>
              </div>
              <span className="fs-4 fw-bold font-monospace text-slate-dark">
                {formatUSD(activePayroll.totalEmployerCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Impacto Marginal de Bonos */}
      {extraMonthlyBonus > 0 && (
        <div className="card-soft p-3 mb-4 border-start border-3 border-secondary">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <span className="small text-muted d-block">Impacto de Bono Mensual (+{formatUSD(extraMonthlyBonus)})</span>
              <strong className="text-slate-dark small">¿Cuánto de tu bono adicional llega efectivamente a tu bolsillo?</strong>
            </div>
            <div className="d-flex align-items-center gap-2 font-monospace small">
              <span className="text-muted">Sin bono: {formatUSD(monthlyBaseOnlyPayroll.netPay)}</span>
              <ChevronRight size={14} className="text-muted" />
              <span className="text-emerald fw-semibold">Con bono: {formatUSD(monthlyPayroll.netPay)}</span>
              <span className="badge bg-light text-dark border ms-1">
                Neto real: +{formatUSD(round2(monthlyPayroll.netPay - monthlyBaseOnlyPayroll.netPay))}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
