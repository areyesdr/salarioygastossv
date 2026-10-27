import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Info,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import {
  calcIncapacity,
  type IncapacityType,
  RATES,
  round2,
} from '../lib/svLaborLaw';

interface IncapacityViewProps {
  monthlySalary: number;
  formatUSD: (amount: number) => string;
}

export function IncapacityView({ monthlySalary, formatUSD }: IncapacityViewProps) {
  const [incapacityType, setIncapacityType] = useState<IncapacityType>('common_illness');
  const [daysInput, setDaysInput] = useState<number>(5);
  const [employerPays100FirstDays, setEmployerPays100FirstDays] = useState<boolean>(true);

  const result = useMemo(() => {
    return calcIncapacity({
      monthlySalary,
      days: daysInput,
      type: incapacityType,
      employerPays100FirstDays,
    });
  }, [monthlySalary, daysInput, incapacityType, employerPays100FirstDays]);

  const presetDays = [
    { label: '3 días', days: 3 },
    { label: '5 días', days: 5 },
    { label: '7 días', days: 7 },
    { label: '15 días', days: 15 },
    { label: '30 días', days: 30 },
  ];

  return (
    <motion.div
      key="tab-incapacity"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      {/* Encabezado Principal */}
      <div className="card-soft p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                ISSS & Código de Trabajo
              </span>
              <span className="badge bg-light text-muted border font-monospace">
                Tope ISSS: {formatUSD(RATES.ISSS_CAP_MONTHLY)}/mes
              </span>
            </div>
            <h5 className="fw-bold text-slate-dark mb-1">
              Guía y Calculadora de Incapacidades Médicas
            </h5>
            <p className="text-muted small mb-0 font-sans" style={{ maxWidth: '680px' }}>
              Conoce quién asume el pago de tu salario (patrono o seguro social), los porcentajes de subsidio
              y el monto exacto que recibirás según los días de reposo prescritos.
            </p>
          </div>

          <div className="bg-light p-2.5 rounded border text-end">
            <span className="text-muted small d-block font-sans" style={{ fontSize: '11px' }}>
              Salario Base de Referencia
            </span>
            <span className="fw-bold font-monospace fs-5 text-slate-dark">
              {formatUSD(monthlySalary)}
            </span>
            <span className="text-secondary small d-block font-monospace" style={{ fontSize: '11px' }}>
              Diario: {formatUSD(result.dailyRealSalary)} / día
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Panel Izquierdo: Configuración de la Incapacidad */}
        <div className="col-12 col-lg-5">
          <div className="card-soft p-4 h-100">
            <h6 className="fw-semibold text-slate-dark mb-3 d-flex align-items-center gap-2">
              <Activity size={16} className="text-primary" />
              <span>Detalles de la Incapacidad</span>
            </h6>

            {/* Selector de Tipo */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-slate-muted text-uppercase mb-1" style={{ fontSize: '11px' }}>
                Tipo de Incapacidad
              </label>
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncapacityType('common_illness');
                    if (daysInput > 60) setDaysInput(5);
                  }}
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 ${
                    incapacityType === 'common_illness'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <Activity size={16} className={incapacityType === 'common_illness' ? 'text-primary mt-0.5' : 'mt-0.5'} />
                  <div>
                    <span className="fw-semibold d-block small">Enfermedad o Accidente Común</span>
                    <span className="small text-muted font-sans" style={{ fontSize: '11px' }}>
                      Días 1 a 3 a cargo del patrono (75%). Día 4 en adelante subsidiado por el ISSS (75%).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIncapacityType('work_accident');
                    if (daysInput > 60) setDaysInput(5);
                  }}
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 ${
                    incapacityType === 'work_accident'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <ShieldAlert size={16} className={incapacityType === 'work_accident' ? 'text-primary mt-0.5' : 'mt-0.5'} />
                  <div>
                    <span className="fw-semibold d-block small">Accidente de Trabajo / Riesgo Profesional</span>
                    <span className="small text-muted font-sans" style={{ fontSize: '11px' }}>
                      Cubierto por el ISSS desde el 1.er día al 75% sin período de espera ni carencia de meses.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIncapacityType('maternity');
                    setDaysInput(112);
                  }}
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 ${
                    incapacityType === 'maternity'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <Calendar size={16} className={incapacityType === 'maternity' ? 'text-primary mt-0.5' : 'mt-0.5'} />
                  <div>
                    <span className="fw-semibold d-block small">Maternidad (Pre y Post Natal)</span>
                    <span className="small text-muted font-sans" style={{ fontSize: '11px' }}>
                      16 semanas (112 días continuos) cubiertas al 100% por el ISSS (tope $1,000/mes).
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Duración en Días */}
            <div className="mb-3">
              <label htmlFor="incapacity-days-input" className="form-label small fw-semibold text-slate-muted text-uppercase mb-1 d-flex justify-content-between" style={{ fontSize: '11px' }}>
                <span>Días de Reposo Prescritos</span>
                <span className="font-monospace text-slate-dark fw-bold">{daysInput} día(s)</span>
              </label>
              <div className="input-group mb-2">
                <input
                  id="incapacity-days-input"
                  type="number"
                  min="1"
                  max="365"
                  value={daysInput}
                  onChange={(e) => setDaysInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="form-control font-monospace fw-bold"
                />
                <span className="input-group-text bg-light text-muted small">días</span>
              </div>

              {incapacityType !== 'maternity' ? (
                <div className="d-flex flex-wrap gap-1">
                  {presetDays.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setDaysInput(p.days)}
                      className={`btn btn-xs px-2 py-1 rounded border font-monospace ${
                        daysInput === p.days ? 'btn-primary' : 'btn-light text-secondary'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDaysInput(112)}
                    className="btn btn-xs btn-outline-primary px-2 py-1 font-monospace"
                    style={{ fontSize: '11px' }}
                  >
                    112 días (16 semanas de Ley)
                  </button>
                </div>
              )}
            </div>

            {/* Política Patronal Voluntaria de Primeros Días */}
            {incapacityType === 'common_illness' && (
              <div className="p-2.5 rounded bg-light border mt-3">
                <div className="form-check form-switch mb-0">
                  <input
                    id="switch-employer-100"
                    type="checkbox"
                    className="form-check-input"
                    checked={employerPays100FirstDays}
                    onChange={(e) => setEmployerPays100FirstDays(e.target.checked)}
                  />
                  <label htmlFor="switch-employer-100" className="form-check-label small fw-semibold text-slate-dark" style={{ fontSize: '12px' }}>
                    Mi empresa cubre el 100% de los primeros 3 días
                  </label>
                </div>
                <span className="text-muted d-block small mt-1 font-sans" style={{ fontSize: '11px' }}>
                  El Art. 307 del Código de Trabajo obliga al 75%. Algunas empresas o contratos colectivos conceden el 100%.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Resultados Financieros y Desglose de Pago */}
        <div className="col-12 col-lg-7">
          <div className="card-soft p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                  <Wallet size={16} className="text-emerald" />
                  <span>Liquidación Estimada del Período</span>
                </h6>
                <span className="badge bg-light text-slate-dark border font-monospace" style={{ fontSize: '11px' }}>
                  Total {result.totalDays} día(s)
                </span>
              </div>

              {/* Tarjeta Principal de Monto Total */}
              <div className="p-3.5 rounded bg-light border mb-3">
                <div className="d-flex justify-content-between align-items-baseline mb-1">
                  <span className="text-muted small font-sans">Total a Recibir por la Incapacidad:</span>
                  <span className="fs-3 fw-bold font-monospace text-emerald">
                    {formatUSD(result.totalIncapacityPay)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center small font-monospace text-muted pt-2 border-top">
                  <span>Equivalente ordinario si hubieras laborado:</span>
                  <span className="text-slate-dark">{formatUSD(result.regularEquivalentGross)}</span>
                </div>
                {result.wageLoss > 0 && (
                  <div className="d-flex justify-content-between align-items-center small font-monospace text-terracotta pt-1">
                    <span>Diferencia no cubierta por ley:</span>
                    <span>-{formatUSD(result.wageLoss)}</span>
                  </div>
                )}
              </div>

              {/* Desglose: Patrono vs ISSS */}
              <div className="row g-3 mb-3">
                {/* 1. Pago Patronal */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border h-100 bg-white">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5">
                        <Building2 size={14} className="text-secondary" />
                        <span>A Cargo del Patrono</span>
                      </span>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '10px' }}>
                        {result.employerDays} día(s)
                      </span>
                    </div>
                    <div className="fs-4 fw-bold font-monospace text-slate-dark mb-1">
                      {formatUSD(result.employerTotalPay)}
                    </div>
                    <span className="text-muted small d-block font-sans" style={{ fontSize: '11px' }}>
                      {result.employerDays > 0 ? (
                        <>
                          Paga en tu planilla habitual {formatUSD(result.employerDailyAmount)} diarios (
                          {(result.employerRate * 100).toFixed(0)}% de tu salario real).
                        </>
                      ) : (
                        'No aplica pago patronal para este tipo de incapacidad.'
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Subsidio ISSS */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border h-100 bg-white d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5">
                          <ShieldAlert size={14} className="text-primary" />
                          <span>Subsidio del ISSS</span>
                        </span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '10px' }}>
                          {result.isssDays} día(s)
                        </span>
                      </div>
                      <div className="fs-4 fw-bold font-monospace text-primary mb-1">
                        {formatUSD(result.isssTotalSubsidio)}
                      </div>
                    </div>

                    {result.isssDays > 0 ? (
                      <div className="mt-2 pt-2 border-top font-monospace" style={{ fontSize: '11px' }}>
                        <div className="d-flex justify-content-between text-muted">
                          <span>Base diaria ISSS (100%):</span>
                          <span className="fw-semibold text-slate-dark">
                            {formatUSD(result.dailyCotizableSalary)}/día
                            {result.isSalaryCappedByISSS && ' (Topado)'}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between text-primary">
                          <span>Subsidio ISSS ({(result.isssRate * 100).toFixed(0)}%):</span>
                          <span className="fw-bold">{formatUSD(result.isssDailySubsidio)}/día</span>
                        </div>
                        {result.isssRate < 1 && (
                          <div className="d-flex justify-content-between text-muted">
                            <span>No cubierto (25%):</span>
                            <span className="text-terracotta">
                              -{formatUSD(round2(result.dailyRealSalary - result.isssDailySubsidio))}/día
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small d-block font-sans" style={{ fontSize: '11px' }}>
                        No aplica subsidio del ISSS (período de espera no superado).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Advertencia de Techo Salarial ISSS ($1,000) si aplica */}
              {result.isSalaryCappedByISSS && result.isssDays > 0 && (
                <div className="p-2.5 rounded bg-warning-subtle border border-warning-subtle small d-flex align-items-start gap-2 mb-2">
                  <AlertCircle size={15} className="text-warning-emphasis shrink-0 mt-0.5" />
                  <div className="text-slate-dark font-sans" style={{ fontSize: '11.5px' }}>
                    <strong>Tope de Cotización Aplicado:</strong> Tu salario real es de {formatUSD(monthlySalary)} ({formatUSD(result.dailyRealSalary)}/día),
                    pero el ISSS solo cotiza hasta {formatUSD(RATES.ISSS_CAP_MONTHLY)}/mes ($33.33/día).
                    El 100% que toma el ISSS son $33.33/día y te paga el 75%: {formatUSD(result.maxDailySubsidioCap)}/día.
                  </div>
                </div>
              )}

              {/* Tabla Comparativa de Descuentos (AFP, ISSS, Renta) */}
              <div className="p-3 rounded bg-light border mb-2">
                <span className="small fw-semibold text-slate-dark d-block mb-1.5 font-sans" style={{ fontSize: '12px' }}>
                  ¿Lleva descuentos de AFP, ISSS o Renta?
                </span>
                <div className="table-responsive">
                  <table className="table table-sm table-minimal align-middle mb-0 font-sans" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr className="text-muted">
                        <th>Concepto</th>
                        <th className="text-center">Descuento AFP</th>
                        <th className="text-center">Descuento ISSS</th>
                        <th className="text-center">Retención Renta</th>
                        <th className="text-end">Monto que recibes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-slate-dark">
                          Patrono (Días 1-3)
                        </td>
                        <td className="text-center text-muted">Sí (7.25%)</td>
                        <td className="text-center text-muted">Sí (3%)</td>
                        <td className="text-center text-muted">Sí (Tramo ISR)</td>
                        <td className="text-end font-monospace text-slate-dark">
                          En tu planilla quincenal
                        </td>
                      </tr>
                      <tr className="bg-emerald-50 text-emerald-950">
                        <td className="fw-bold text-emerald-900 d-flex align-items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald" />
                          <span>Subsidio ISSS (Día 4+)</span>
                        </td>
                        <td className="text-center fw-semibold text-emerald-800">Exento (0%)</td>
                        <td className="text-center fw-semibold text-emerald-800">Exento (0%)</td>
                        <td className="text-center fw-semibold text-emerald-800">Exento (0%)</td>
                        <td className="text-end font-monospace fw-bold text-emerald">
                          {formatUSD(result.isssTotalSubsidio)} (100% neto)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guía Informativa y de Trámites Oficiales (Portal del ISSS) */}
      <div className="card-soft p-4">
        <h6 className="fw-semibold text-slate-dark mb-3 d-flex align-items-center gap-2">
          <Info size={16} className="text-primary" />
          <span>Información Clave de Trámites y Derechos Laborales</span>
        </h6>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 rounded border bg-light h-100">
              <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-secondary" />
                <span>Requisitos de Cotización (Carencia)</span>
              </span>
              <p className="text-muted small font-sans mb-0" style={{ fontSize: '12px' }}>
                Para cobrar subsidio de enfermedad común, debes tener al menos <strong>6 meses de cotización</strong> (continuos o no)
                en los últimos 12 meses anteriores a la incapacidad. En accidentes de trabajo no se exige tiempo mínimo.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 rounded border bg-light h-100">
              <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5 mb-1.5">
                <FileText size={13} className="text-secondary" />
                <span>Incapacidades de Médicos Privados</span>
              </span>
              <p className="text-muted small font-sans mb-0" style={{ fontSize: '12px' }}>
                Si consultaste con un médico particular o clínica privada, debes acudir al centro del ISSS más cercano
                a <strong>refrendar la incapacidad</strong> presentando la constancia médica y recetas para que tenga validez legal y económica.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 rounded border bg-light h-100">
              <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5 mb-1.5">
                <HelpCircle size={13} className="text-secondary" />
                <span>Modalidad de Cobro del Subsidio</span>
              </span>
              <p className="text-muted small font-sans mb-0" style={{ fontSize: '12px' }}>
                Puedes registrar tu cuenta bancaria personal en el portal en línea del ISSS para recibir el depósito directo,
                o cobrarlo en las ventanillas de bancos autorizados presentando tu DUI vigente una vez emitida la planilla de subsidio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
