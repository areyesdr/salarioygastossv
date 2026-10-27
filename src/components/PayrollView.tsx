import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Building,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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

export function PayrollView({
  period,
  activePayroll,
  monthlyPayroll,
  monthlyBaseOnlyPayroll,
  extraMonthlyBonus,
  isrMarkerPercent,
  formatUSD,
}: PayrollViewProps) {
  const [showCalculations, setShowCalculations] = useState(false);
  const [showAllBrackets, setShowAllBrackets] = useState(false);

  const netPct =
    activePayroll.grossTotal > 0
      ? Math.round((activePayroll.netPay / activePayroll.grossTotal) * 100)
      : 0;
  const afpPct =
    activePayroll.grossTotal > 0
      ? Math.round((activePayroll.afpEmployee / activePayroll.grossTotal) * 100)
      : 0;
  const isssPct =
    activePayroll.grossTotal > 0
      ? Math.round((activePayroll.isssEmployee / activePayroll.grossTotal) * 100)
      : 0;
  const isrPct =
    activePayroll.grossTotal > 0
      ? Math.round((activePayroll.isr / activePayroll.grossTotal) * 100)
      : 0;

  return (
    <motion.div
      key="tab-payroll"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="container-fluid px-0"
    >
      {/* 1. Barra de Distribución Proporcional de Planilla con Motion */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <span>Distribución de Salario {period === 'monthly' ? 'Mensual' : 'Quincenal'}</span>
            </h5>
            <p className="card-subtitle text-muted small mb-0">
              Proporción del salario bruto destinada a tu ingreso líquido y deducciones obligatorias
            </p>
          </div>
          <div className="text-end font-monospace small">
            <span className="text-muted">Total Bruto: </span>
            <span className="fw-bold fs-6 text-dark">{formatUSD(activePayroll.grossTotal)}</span>
          </div>
        </div>

        <div className="card-body">
          {/* Animated Visual Progress Bar */}
          <div className="salary-breakdown-bar shadow-inner mb-3">
            {activePayroll.grossTotal > 0 && (
              <>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(activePayroll.netPay / activePayroll.grossTotal) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                  className="bg-success text-white small fw-bold d-flex align-items-center justify-content-center text-truncate px-2"
                  title={`Líquido: ${formatUSD(activePayroll.netPay)} (${netPct}%)`}
                >
                  {netPct >= 18 ? `Líquido ${netPct}%` : ''}
                </motion.div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(activePayroll.afpEmployee / activePayroll.grossTotal) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                  className="bg-warning text-dark small fw-bold d-flex align-items-center justify-content-center text-truncate px-1"
                  title={`AFP 7.25%: ${formatUSD(activePayroll.afpEmployee)}`}
                >
                  {afpPct >= 6 ? 'AFP' : ''}
                </motion.div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(activePayroll.isssEmployee / activePayroll.grossTotal) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                  className="bg-info text-white small fw-bold d-flex align-items-center justify-content-center text-truncate px-1"
                  title={`ISSS 3%: ${formatUSD(activePayroll.isssEmployee)}`}
                >
                  {isssPct >= 4 ? 'ISSS' : ''}
                </motion.div>

                {activePayroll.isr > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(activePayroll.isr / activePayroll.grossTotal) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                    className="bg-danger text-white small fw-bold d-flex align-items-center justify-content-center text-truncate px-1"
                    title={`Renta ISR: ${formatUSD(activePayroll.isr)}`}
                  >
                    {isrPct >= 5 ? 'ISR' : ''}
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Breakdown Legend Badges */}
          <div className="row g-2 text-center small font-monospace">
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded bg-light">
                <span className="badge bg-success me-1">●</span>
                <span className="text-muted">Líquido: </span>
                <strong className="text-success">{formatUSD(activePayroll.netPay)}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded bg-light">
                <span className="badge bg-warning text-dark me-1">●</span>
                <span className="text-muted">AFP (7.25%): </span>
                <strong className="text-warning-emphasis">{formatUSD(activePayroll.afpEmployee)}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded bg-light">
                <span className="badge bg-info me-1">●</span>
                <span className="text-muted">ISSS (3%): </span>
                <strong className="text-info-emphasis">{formatUSD(activePayroll.isssEmployee)}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded bg-light">
                <span className="badge bg-danger me-1">●</span>
                <span className="text-muted">Renta (ISR): </span>
                <strong className="text-danger">{formatUSD(activePayroll.isr)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cuadrícula de 2 Columnas: Boleta de Pago vs Mapa Oficial de ISR */}
      <div className="row g-4 mb-4">
        {/* Columna Izquierda: Boleta Oficial de Planilla */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <Calculator className="text-primary" size={20} />
                  <span>Boleta de Pago ({period === 'monthly' ? 'Mensual' : 'Quincenal'})</span>
                </h5>
                <p className="card-subtitle text-muted small mb-0">
                  Resumen de percepciones y deducciones
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCalculations(!showCalculations)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
                title="Mostrar u ocultar fórmulas de cálculo"
              >
                {showCalculations ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showCalculations ? 'Ocultar fórmulas' : 'Ver detalle de cálculo'}</span>
              </button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th scope="col" className="ps-4">Concepto</th>
                      {showCalculations && (
                        <th scope="col" className="text-muted small">Base / Fórmula</th>
                      )}
                      <th scope="col" className="text-end pe-4">Monto (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="font-monospace small">
                    <tr>
                      <td className="ps-4 fw-semibold text-dark">
                        Salario Base ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                      </td>
                      {showCalculations && (
                        <td className="text-muted">Nominal contratado</td>
                      )}
                      <td className="text-end pe-4 fw-bold">{formatUSD(activePayroll.grossBase)}</td>
                    </tr>

                    {activePayroll.bonuses > 0 && (
                      <tr className="table-success">
                        <td className="ps-4 fw-semibold text-success">
                          + Bono / Comisión
                        </td>
                        {showCalculations && (
                          <td className="text-success small">Ingreso gravado adicional</td>
                        )}
                        <td className="text-end pe-4 fw-bold text-success">
                          +{formatUSD(activePayroll.bonuses)}
                        </td>
                      </tr>
                    )}

                    <tr className="table-secondary fw-bold">
                      <td className="ps-4">Total Ingreso Bruto</td>
                      {showCalculations && <td>Base + Bonos</td>}
                      <td className="text-end pe-4 fs-6">{formatUSD(activePayroll.grossTotal)}</td>
                    </tr>

                    <tr>
                      <td className="ps-4">
                        <div className="fw-semibold text-dark">Descuento AFP (7.25%)</div>
                        {showCalculations && (
                          <div className="text-muted small" style={{ fontSize: '11px' }}>
                            Fondo de pensiones sin tope salarial
                          </div>
                        )}
                      </td>
                      {showCalculations && (
                        <td className="text-muted small">{formatUSD(activePayroll.grossTotal)} × 7.25%</td>
                      )}
                      <td className="text-end pe-4 text-warning-emphasis fw-bold">
                        -{formatUSD(activePayroll.afpEmployee)}
                      </td>
                    </tr>

                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="fw-semibold text-dark">Descuento ISSS (3.00%)</span>
                          {activePayroll.isssCapped && (
                            <span className="badge bg-info text-white" style={{ fontSize: '10px' }}>
                              Tope {period === 'monthly' ? '$30.00' : '$15.00'}
                            </span>
                          )}
                        </div>
                        {showCalculations && (
                          <div className="text-muted small" style={{ fontSize: '11px' }}>
                            Techo cotizable: {period === 'monthly' ? '$1,000.00/mes' : '$500.00/quincena'}
                          </div>
                        )}
                      </td>
                      {showCalculations && (
                        <td className="text-muted small">3% s/salario (máx $30/mes)</td>
                      )}
                      <td className="text-end pe-4 text-info fw-bold">
                        -{formatUSD(activePayroll.isssEmployee)}
                      </td>
                    </tr>

                    <tr className="table-warning border-top border-bottom">
                      <td className="ps-4">
                        <div className="fw-bold text-dark">Renta Gravada Imponible</div>
                        {showCalculations && (
                          <div className="text-muted small" style={{ fontSize: '11px' }}>
                            Bruto menos AFP e ISSS deducibles
                          </div>
                        )}
                      </td>
                      {showCalculations && (
                        <td className="text-muted small font-monospace">Bruto - AFP - ISSS</td>
                      )}
                      <td className="text-end pe-4 fw-bold text-dark fs-6">
                        {formatUSD(activePayroll.taxableIncome)}
                      </td>
                    </tr>

                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="fw-semibold text-dark">Retención de Renta (ISR)</span>
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '10px' }}>
                            {activePayroll.isrDetail.bracketLabel}
                          </span>
                        </div>
                        {showCalculations && (
                          activePayroll.isrDetail.bracketId === 'I' ? (
                            <div className="text-muted small" style={{ fontSize: '11px' }}>
                              Renta gravada ≤ {period === 'monthly' ? '$550.00' : '$275.00'} (Exento)
                            </div>
                          ) : (
                            <div className="text-muted small" style={{ fontSize: '11px' }}>
                              Cuota ${activePayroll.isrDetail.fixedFee} + {Math.round(activePayroll.isrDetail.rate * 100)}% s/exceso ${activePayroll.isrDetail.excessOver}
                            </div>
                          )
                        )}
                      </td>
                      {showCalculations && (
                        <td className="text-muted small font-monospace">Tabla Decreto 254</td>
                      )}
                      <td className="text-end pe-4 text-danger fw-bold">
                        -{formatUSD(activePayroll.isr)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-footer bg-success-subtle border-top border-success-subtle p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-success text-uppercase small d-block">
                  Salario Líquido a Recibir
                </span>
                <span className="text-muted small">
                  Retención total de ley: {activePayroll.effectiveDeductionPct}%
                </span>
              </div>
              <span className="fs-3 fw-bold font-monospace text-success">
                {formatUSD(activePayroll.netPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tramos de Renta y Aportes Patronales */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          {/* Tarjeta de Tramos de Renta Oficial */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <ShieldCheck className="text-danger" size={20} />
                  <span>Retención de Renta (Decreto 254)</span>
                </h5>
                <p className="card-subtitle text-muted small mb-0">
                  Base imponible: <strong className="text-dark font-monospace">{formatUSD(activePayroll.taxableIncome)}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAllBrackets(!showAllBrackets)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              >
                <span>{showAllBrackets ? 'Ocultar tabla' : 'Ver 4 tramos'}</span>
                {showAllBrackets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="card-body">
              {/* Barra de progreso de escala de renta */}
              <div className="position-relative pt-4 pb-2 mb-3">
                <motion.div
                  animate={{ left: `${isrMarkerPercent}%` }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  className="position-absolute top-0 translate-middle-x d-flex flex-column align-items-center z-1"
                >
                  <span className="badge bg-dark text-white font-monospace shadow-sm" style={{ fontSize: '10px' }}>
                    {formatUSD(activePayroll.taxableIncome)}
                  </span>
                  <div style={{ width: '2px', height: '10px', backgroundColor: '#212529' }} />
                </motion.div>

                <div className="progress" style={{ height: '10px' }}>
                  <div className="progress-bar bg-success" style={{ width: '25%' }} title="Tramo I: Exento" />
                  <div className="progress-bar bg-warning" style={{ width: '25%' }} title="Tramo II: 10%" />
                  <div className="progress-bar bg-danger" style={{ width: '25%' }} title="Tramo III: 20%" />
                  <div className="progress-bar bg-dark" style={{ width: '25%' }} title="Tramo IV: 30%" />
                </div>
              </div>

              {/* Tramo Activo Destacado */}
              <div className="p-3 border rounded bg-light mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary">Tramo Activo</span>
                    <strong className="text-dark">{activePayroll.isrDetail.bracketLabel}</strong>
                  </div>
                  <span className="font-monospace fw-bold text-danger">
                    -{formatUSD(activePayroll.isr)}
                  </span>
                </div>
                <div className="small text-muted font-monospace">
                  {activePayroll.isrDetail.bracketId === 'I' ? (
                    <span>Tu base gravada no excede el límite exento ({period === 'monthly' ? '$550.00' : '$275.00'}). Tasa aplicable: 0%.</span>
                  ) : (
                    <span>
                      Cuota fija de {formatUSD(activePayroll.isrDetail.fixedFee)} +{' '}
                      {Math.round(activePayroll.isrDetail.rate * 100)}% sobre el exceso de{' '}
                      {formatUSD(activePayroll.isrDetail.excessOver)}.
                    </span>
                  )}
                </div>
              </div>

              {/* Tabla Colapsable de Todos los Tramos */}
              <AnimatePresence>
                {showAllBrackets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="table-responsive mt-3">
                      <table className="table table-sm table-striped table-hover align-middle mb-0 font-monospace small">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Tramo</th>
                            <th scope="col">Renta Gravada</th>
                            <th scope="col">%</th>
                            <th scope="col">Cuota</th>
                            <th scope="col" className="text-end">Sobre exceso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ISR_TABLES[period].map((rule) => {
                            const isCurrent = activePayroll.isrDetail.bracketId === rule.id;
                            return (
                              <tr key={rule.id} className={isCurrent ? 'table-primary fw-bold' : ''}>
                                <td>
                                  {isCurrent && <span className="badge bg-primary me-1">Actual</span>}
                                  Tramo {rule.id}
                                </td>
                                <td>
                                  {formatUSD(rule.from)} – {rule.to ? formatUSD(rule.to) : 'Más'}
                                </td>
                                <td>{Math.round(rule.rate * 100)}%</td>
                                <td>{formatUSD(rule.fixedFee)}</td>
                                <td className="text-end">{formatUSD(rule.excessOver)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tarjeta de Aportes Patronales */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <Building className="text-secondary" size={20} />
                <span>Costo Patronal para la Empresa</span>
              </h5>
              <span className="badge bg-light text-dark border">
                {period === 'monthly' ? 'Mensual' : 'Quincenal'}
              </span>
            </div>

            <div className="card-body">
              <div className="row g-3 mb-3 text-center">
                <div className="col-4">
                  <div className="p-3 border rounded bg-light">
                    <span className="text-muted small d-block">AFP Patronal (8.75%)</span>
                    <span className="fs-5 fw-bold font-monospace text-dark">
                      {formatUSD(activePayroll.afpEmployer)}
                    </span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 border rounded bg-light">
                    <span className="text-muted small d-block">
                      ISSS (7.5% máx {period === 'monthly' ? '$75' : '$37.50'})
                    </span>
                    <span className="fs-5 fw-bold font-monospace text-dark">
                      {formatUSD(activePayroll.isssEmployer)}
                    </span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 border rounded bg-light">
                    <span className="text-muted small d-block">INSAFORP/INCAF (1%)</span>
                    <span className="fs-5 fw-bold font-monospace text-dark">
                      {formatUSD(activePayroll.insaforpEmployer)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded bg-primary-subtle border-primary-subtle d-flex justify-content-between align-items-center">
                <span className="small text-primary-emphasis fw-semibold">
                  Costo Total Empresa (Bruto + Cargas Patronales):
                </span>
                <span className="fs-5 fw-bold font-monospace text-primary">
                  {formatUSD(activePayroll.totalEmployerCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Banner de Impacto Marginal de Bonos */}
      {extraMonthlyBonus > 0 && (
        <div className="card shadow-sm border-0 border-start border-primary border-4 mb-4">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary mb-1">
                Bono / Comisión Mensual (+{formatUSD(extraMonthlyBonus)})
              </span>
              <h6 className="fw-bold mb-0 text-dark">¿Cuánto de tu bono adicional llega realmente a tu bolsillo?</h6>
            </div>
            <div className="d-flex align-items-center gap-3 font-monospace small">
              <div>
                <span className="text-muted d-block">Líquido sin bono:</span>
                <strong>{formatUSD(monthlyBaseOnlyPayroll.netPay)}</strong>
              </div>
              <ChevronRight size={18} className="text-muted" />
              <div>
                <span className="text-muted d-block">Líquido con bono:</span>
                <strong className="text-success">{formatUSD(monthlyPayroll.netPay)}</strong>
              </div>
              <div className="alert alert-success py-1.5 px-3 mb-0 small fw-bold">
                Neto real: +{formatUSD(round2(monthlyPayroll.netPay - monthlyBaseOnlyPayroll.netPay))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
