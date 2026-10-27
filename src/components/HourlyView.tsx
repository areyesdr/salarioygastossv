import { motion } from 'motion/react';
import { Clock, ArrowUpRight } from 'lucide-react';
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="container-fluid px-0"
    >
      <div className="row g-4 mb-4">
        {/* Configuración de Jornada */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                <Clock className="text-primary" size={20} />
                <span>Configuración de Jornada Laboral</span>
              </h5>
              <p className="card-subtitle text-muted small mb-0">
                Ajusta los días efectivos trabajados para contrastar tu hora contable vs real
              </p>
            </div>

            <div className="card-body">
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Días al mes:</label>
                  <div className="input-group mb-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={daysPerMonth}
                      onChange={(e) => setDaysPerMonth(Math.max(1, Math.min(31, Number(e.target.value) || 30)))}
                      className="form-control font-monospace fw-bold"
                    />
                    <span className="input-group-text">días</span>
                  </div>
                  <div className="btn-group btn-group-sm w-100">
                    <button
                      type="button"
                      onClick={() => setDaysPerMonth(30)}
                      className={`btn ${daysPerMonth === 30 ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      30 (Ley)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysPerMonth(22)}
                      className={`btn ${daysPerMonth === 22 ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      22 (L-V)
                    </button>
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Horas por jornada:</label>
                  <div className="input-group mb-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Math.max(1, Math.min(12, Number(e.target.value) || 8)))}
                      className="form-control font-monospace fw-bold"
                    />
                    <span className="input-group-text">hrs</span>
                  </div>
                  <div className="btn-group btn-group-sm w-100">
                    <button
                      type="button"
                      onClick={() => setHoursPerDay(8)}
                      className={`btn ${hoursPerDay === 8 ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      8h Diurna
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoursPerDay(7)}
                      className={`btn ${hoursPerDay === 7 ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      7h Nocturna
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-light rounded border small font-monospace">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total horas en el mes:</span>
                  <strong>{hourlyResult.totalHoursPerMonth} horas/mes</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Hora base legal para extras (30d):</span>
                  <strong>{formatUSD(hourlyResult.legalBaseHourly)}/h</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Métricas de Costo Diario y Horario */}
        <div className="col-12 col-lg-7">
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3 card-hover-shadow">
                <span className="badge bg-success-subtle text-success border border-success-subtle align-self-start mb-2">
                  Ingreso Líquido Real
                </span>
                <h6 className="text-muted small fw-bold mb-1">Salario Líquido por Hora</h6>
                <div className="fs-2 fw-bold font-monospace text-success mb-2">
                  {formatUSD(hourlyResult.netHourly)}
                  <span className="fs-6 text-muted fw-normal">/h</span>
                </div>
                <p className="text-muted small mb-0">
                  Lo que efectivamente recibes disponible por cada hora trabajada después de ISSS, AFP y Renta.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card shadow-sm border-0 h-100 p-3 card-hover-shadow">
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle align-self-start mb-2">
                  Salario Bruto Contratado
                </span>
                <h6 className="text-muted small fw-bold mb-1">Salario Bruto por Hora</h6>
                <div className="fs-2 fw-bold font-monospace text-dark mb-2">
                  {formatUSD(hourlyResult.grossHourly)}
                  <span className="fs-6 text-muted fw-normal">/h</span>
                </div>
                <p className="text-muted small mb-0">
                  Deducción legal por hora:{' '}
                  <span className="text-danger fw-bold font-monospace">
                    -{formatUSD(round2(hourlyResult.grossHourly - hourlyResult.netHourly))}
                  </span>
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card shadow-sm border-0 p-3 bg-light">
                <span className="text-muted small d-block">Valor Líquido por Día ({daysPerMonth} días):</span>
                <span className="fs-4 fw-bold font-monospace text-success">
                  {formatUSD(hourlyResult.netDaily)}/día
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card shadow-sm border-0 p-3 bg-light">
                <span className="text-muted small d-block">Valor Bruto por Día ({daysPerMonth} días):</span>
                <span className="fs-4 fw-bold font-monospace text-dark">
                  {formatUSD(hourlyResult.grossDaily)}/día
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Horas Extra y Recargos de Ley */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <Clock className="text-danger" size={20} />
              <span>Calculadora de Horas Extra, Nocturnidad, Descanso y Asueto</span>
            </h5>
            <p className="card-subtitle text-muted small mb-0">
              Tarifas según recargos del Código de Trabajo sobre tu hora legal ({formatUSD(hourlyResult.legalBaseHourly)}/h)
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <span className="small text-muted d-block">Subtotal Horas Extra:</span>
              <span className="fs-5 fw-bold font-monospace text-success">
                +{formatUSD(totalSimulatedOvertimeUsd)}
              </span>
            </div>
            {totalSimulatedOvertimeUsd > 0 && (
              <button
                type="button"
                onClick={() => onSimulateOvertimeInPayroll(totalSimulatedOvertimeUsd)}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
              >
                <span>Simular en Planilla</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 font-monospace small">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-4">Tipo de Hora / Recargo</th>
                  <th scope="col">Base Legal y Multiplicador</th>
                  <th scope="col" className="text-end">Valor Hora (USD)</th>
                  <th scope="col" className="text-center" style={{ width: '140px' }}>Horas Mes</th>
                  <th scope="col" className="text-end pe-4">Subtotal Bruto</th>
                </tr>
              </thead>
              <tbody>
                {hourlyResult.overtimeRates.map((rate) => {
                  const qty = overtimeHoursMap[rate.id] || 0;
                  const subtotal = round2(rate.hourlyRateUsd * qty);
                  return (
                    <tr key={rate.id} className={qty > 0 ? 'table-success' : ''}>
                      <td className="ps-4 fw-semibold text-dark font-sans">{rate.label}</td>
                      <td className="text-muted font-sans small">{rate.legalBasis}</td>
                      <td className="text-end fw-bold">{formatUSD(rate.hourlyRateUsd)}</td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={qty}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setOvertimeHoursMap((prev) => ({ ...prev, [rate.id]: val }));
                          }}
                          className="form-control form-control-sm text-center font-monospace fw-bold mx-auto"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td className="text-end pe-4 fw-bold text-success">
                        {formatUSD(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
