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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      <div className="row g-4 mb-4">
        {/* Configuración de Jornada */}
        <div className="col-12 col-lg-5">
          <div className="card-soft h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Clock size={16} className="text-secondary" />
                <h6 className="fw-semibold text-slate-dark mb-0">Configuración de Jornada Laboral</h6>
              </div>
              <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                Ajusta los días y horas base para contrastar tu hora contable vs efectiva
              </p>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                    Días al mes:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={daysPerMonth}
                    onChange={(e) => setDaysPerMonth(Math.max(1, Math.min(31, Number(e.target.value) || 30)))}
                    className="form-control form-control-sm font-monospace fw-semibold mb-2"
                  />
                  <div className="segmented-control w-100">
                    <button
                      type="button"
                      onClick={() => setDaysPerMonth(30)}
                      className={`w-50 ${daysPerMonth === 30 ? 'active' : ''}`}
                    >
                      30 (Ley)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysPerMonth(22)}
                      className={`w-50 ${daysPerMonth === 22 ? 'active' : ''}`}
                    >
                      22 (L-V)
                    </button>
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                    Horas por día:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Math.max(1, Math.min(12, Number(e.target.value) || 8)))}
                    className="form-control form-control-sm font-monospace fw-semibold mb-2"
                  />
                  <div className="segmented-control w-100">
                    <button
                      type="button"
                      onClick={() => setHoursPerDay(8)}
                      className={`w-50 ${hoursPerDay === 8 ? 'active' : ''}`}
                    >
                      8h Diurna
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoursPerDay(7)}
                      className={`w-50 ${hoursPerDay === 7 ? 'active' : ''}`}
                    >
                      7h Noct.
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border small font-monospace">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Total horas computadas:</span>
                <span className="fw-semibold text-slate-dark">{hourlyResult.totalHoursPerMonth} horas/mes</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Hora base legal (Art. 161 C.T.):</span>
                <span className="fw-semibold text-slate-dark">{formatUSD(hourlyResult.legalBaseHourly)}/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Métricas de Costo Diario y Horario */}
        <div className="col-12 col-lg-7">
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <div className="card-net-hero p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <span className="small fw-semibold text-emerald text-uppercase d-block" style={{ fontSize: '10px' }}>
                    Ingreso Líquido Real
                  </span>
                  <div className="fs-3 fw-bold font-monospace text-emerald my-1">
                    {formatUSD(hourlyResult.netHourly)}
                    <span className="fs-6 fw-normal text-muted">/h</span>
                  </div>
                </div>
                <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
                  Lo que efectivamente recibes disponible por hora tras ISSS, AFP y Renta.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card-soft p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <span className="small text-muted text-uppercase fw-semibold d-block" style={{ fontSize: '10px' }}>
                    Salario Bruto Contratado
                  </span>
                  <div className="fs-3 fw-bold font-monospace text-slate-dark my-1">
                    {formatUSD(hourlyResult.grossHourly)}
                    <span className="fs-6 fw-normal text-muted">/h</span>
                  </div>
                </div>
                <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
                  Deducción legal: <span className="font-monospace text-muted">-{formatUSD(round2(hourlyResult.grossHourly - hourlyResult.netHourly))}/h</span>
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card-soft p-3 bg-slate-50">
                <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Líquido por Día ({daysPerMonth} días):</span>
                <span className="fs-4 fw-bold font-monospace text-emerald">
                  {formatUSD(hourlyResult.netDaily)}/día
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="card-soft p-3 bg-slate-50">
                <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Bruto por Día ({daysPerMonth} días):</span>
                <span className="fs-4 fw-bold font-monospace text-slate-dark">
                  {formatUSD(hourlyResult.grossDaily)}/día
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Horas Extra y Recargos de Ley */}
      <div className="card-soft mb-4">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
              <Clock size={16} className="text-secondary" />
              <span>Calculadora de Horas Extra y Recargos (Código de Trabajo)</span>
            </h6>
            <span className="small text-muted" style={{ fontSize: '12px' }}>
              Tarifas legales calculadas sobre tu hora ordinaria de {formatUSD(hourlyResult.legalBaseHourly)}/h
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <span className="small text-muted d-block" style={{ fontSize: '11px' }}>Subtotal Horas Extra:</span>
              <span className="fs-6 fw-bold font-monospace text-emerald">
                +{formatUSD(totalSimulatedOvertimeUsd)}
              </span>
            </div>
            {totalSimulatedOvertimeUsd > 0 && (
              <button
                type="button"
                onClick={() => onSimulateOvertimeInPayroll(totalSimulatedOvertimeUsd)}
                className="btn btn-dark btn-sm d-inline-flex align-items-center gap-2 py-1 px-2.5"
                style={{ fontSize: '12px' }}
              >
                <span>Simular en Planilla</span>
                <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-minimal align-middle font-monospace small">
            <thead>
              <tr>
                <th>Tipo de Recargo</th>
                <th>Base Legal</th>
                <th className="text-end">Tarifa / Hora</th>
                <th className="text-center" style={{ width: '120px' }}>Horas Mes</th>
                <th className="text-end">Subtotal Bruto</th>
              </tr>
            </thead>
            <tbody>
              {hourlyResult.overtimeRates.map((rate) => {
                const qty = overtimeHoursMap[rate.id] || 0;
                const subtotal = round2(rate.hourlyRateUsd * qty);
                return (
                  <tr key={rate.id} className={qty > 0 ? 'bg-slate-50' : ''}>
                    <td className="font-sans fw-semibold text-slate-dark">{rate.label}</td>
                    <td className="text-muted font-sans small">{rate.legalBasis}</td>
                    <td className="text-end fw-semibold text-slate-dark">{formatUSD(rate.hourlyRateUsd)}</td>
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
                        className="form-control form-control-sm text-center font-monospace fw-semibold mx-auto"
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td className="text-end fw-semibold text-emerald">
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
