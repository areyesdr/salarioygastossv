import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
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
      <div className="card-soft p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
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

          <div className="bg-light p-2.5 rounded border w-100 w-sm-auto text-start text-sm-end">
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
          <div className="card-soft p-3 p-md-4 h-100">
            <h6 className="fw-semibold text-slate-dark mb-3 d-flex align-items-center gap-2">
              <Activity size={16} className="text-primary shrink-0" />
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
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 w-100 ${
                    incapacityType === 'common_illness'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <Activity size={16} className={`shrink-0 mt-0.5 ${incapacityType === 'common_illness' ? 'text-primary' : ''}`} />
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="fw-semibold d-block small text-wrap">Enfermedad o Accidente Común</span>
                    <span className="small text-muted font-sans d-block text-wrap" style={{ fontSize: '11px' }}>
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
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 w-100 ${
                    incapacityType === 'work_accident'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <ShieldAlert size={16} className={`shrink-0 mt-0.5 ${incapacityType === 'work_accident' ? 'text-primary' : ''}`} />
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="fw-semibold d-block small text-wrap">Accidente de Trabajo / Riesgo Profesional</span>
                    <span className="small text-muted font-sans d-block text-wrap" style={{ fontSize: '11px' }}>
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
                  className={`btn btn-sm text-start p-2.5 rounded border d-flex align-items-start gap-2.5 w-100 ${
                    incapacityType === 'maternity'
                      ? 'border-primary bg-primary-subtle text-slate-dark'
                      : 'bg-white text-muted'
                  }`}
                >
                  <Calendar size={16} className={`shrink-0 mt-0.5 ${incapacityType === 'maternity' ? 'text-primary' : ''}`} />
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="fw-semibold d-block small text-wrap">Maternidad (Pre y Post Natal)</span>
                    <span className="small text-muted font-sans d-block text-wrap" style={{ fontSize: '11px' }}>
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
          <div className="card-soft p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-3">
                <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                  <Wallet size={16} className="text-emerald shrink-0" />
                  <span>Liquidación Estimada del Período</span>
                </h6>
                <span className="badge bg-light text-slate-dark border font-monospace shrink-0" style={{ fontSize: '11px' }}>
                  Total {result.totalDays} día(s)
                </span>
              </div>

              {/* Tarjeta Principal de Monto Total - Directo al Bolsillo */}
              <div className="p-3 p-sm-3.5 rounded bg-light border mb-3">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-baseline gap-1 gap-sm-3 mb-1">
                  <div style={{ minWidth: 0 }}>
                    <span className="text-slate-dark fw-bold d-block text-wrap">
                      Dinero total que llegará a tu bolsillo:
                    </span>
                    <span className="text-muted small font-sans d-block text-wrap" style={{ fontSize: '11.5px' }}>
                      Suma de lo que te paga tu empresa más lo que te deposita el Seguro Social
                    </span>
                  </div>
                  <span className="fs-3 fw-bold font-monospace text-emerald shrink-0">
                    {formatUSD(result.totalIncapacityPay)}
                  </span>
                </div>

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center small text-muted pt-2.5 border-top mt-2 gap-1">
                  <span className="font-sans">Lo que habrías cobrado trabajando normal:</span>
                  <span className="text-slate-dark font-monospace fw-semibold shrink-0">{formatUSD(result.regularEquivalentGross)}</span>
                </div>

                {result.wageLoss > 0 && (
                  <div className="pt-2 border-top mt-2">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center small text-terracotta gap-1">
                      <span className="fw-semibold font-sans">Lo que dejas de ganar (no cubierto por ley):</span>
                      <span className="fw-bold font-monospace shrink-0">-{formatUSD(result.wageLoss)}</span>
                    </div>
                    <span className="text-muted d-block font-sans small mt-0.5" style={{ fontSize: '11px' }}>
                      ¿Por qué dejas de ganar esto? Porque a partir del 4.º día, el ISSS solo te paga el 75% de cada día. El 25% restante nadie lo cubre.
                    </span>
                  </div>
                )}
              </div>

              {/* Desglose: Patrono vs ISSS */}
              <div className="row g-3 mb-3">
                {/* 1. Pago Patronal */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border h-100 bg-white d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                        <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5">
                          <Building2 size={14} className="text-secondary shrink-0" />
                          <span>1. Te paga tu Empresa</span>
                        </span>
                        <span className="badge bg-light text-secondary border font-monospace shrink-0" style={{ fontSize: '10px' }}>
                          {result.employerDays} día(s)
                        </span>
                      </div>
                      <div className="fs-4 fw-bold font-monospace text-slate-dark mb-1">
                        {formatUSD(result.employerTotalPay)}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-top small font-sans" style={{ fontSize: '11px' }}>
                      {result.employerDays > 0 ? (
                        <>
                          <div className="mb-1 text-slate-dark">
                            <strong>{formatUSD(result.employerDailyAmount)}</strong> por cada día de reposo (
                            {(result.employerRate * 100).toFixed(0)}% de tu sueldo normal).
                          </div>
                          <div className="text-muted">
                            <strong>¿Cómo te lo pagan?</strong> En tu recibo o depósito quincenal de nómina como sueldo normal.
                          </div>
                          <div className="text-muted mt-1">
                            <strong>¿Lleva descuentos?</strong> Sí, tus descuentos normales de planilla (AFP, ISSS y Renta).
                          </div>
                        </>
                      ) : (
                        <span className="text-muted">Tu empresa no paga estos días; el pago corre por cuenta del Seguro Social desde el día 1.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Subsidio ISSS */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border h-100 bg-white d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                        <span className="small fw-semibold text-slate-dark d-flex align-items-center gap-1.5">
                          <ShieldAlert size={14} className="text-primary shrink-0" />
                          <span>2. Te paga el Seguro (ISSS)</span>
                        </span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace shrink-0" style={{ fontSize: '10px' }}>
                          {result.isssDays} día(s)
                        </span>
                      </div>
                      <div className="fs-4 fw-bold font-monospace text-primary mb-1">
                        {formatUSD(result.isssTotalSubsidio)}
                      </div>
                    </div>

                    {result.isssDays > 0 ? (
                      <div className="mt-2 pt-2 border-top small font-sans" style={{ fontSize: '11px' }}>
                        <div className="mb-1 text-slate-dark">
                          <strong>{formatUSD(result.isssDailySubsidio)}</strong> por cada día de subsidio (el{' '}
                          {(result.isssRate * 100).toFixed(0)}% que da la ley).
                        </div>
                        <div className="text-muted">
                          <strong>¿Cómo lo calculan?</strong> Tu día normal vale {formatUSD(result.dailyCotizableSalary)}. El Seguro te entrega el 75% y te deja de pagar el 25% (-{formatUSD(round2(result.dailyRealSalary - result.isssDailySubsidio))}/día).
                        </div>
                        <div className="text-emerald fw-semibold mt-1">
                          <strong>¿Lleva descuentos?</strong> No. El Seguro te entrega los {formatUSD(result.isssTotalSubsidio)} limpios (0% AFP, 0% ISSS, 0% Renta).
                        </div>
                        <div className="text-muted mt-1">
                          <strong>¿Cómo te lo pagan?</strong> Te lo deposita el ISSS directo a tu cuenta bancaria o lo cobras con tu DUI en el banco. No viene en el pago de tu empresa.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-top small text-muted font-sans" style={{ fontSize: '11px' }}>
                        El Seguro Social no paga nada porque la incapacidad duró 3 días o menos (período de espera). Todo lo asume tu empresa.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advertencia de Techo Salarial ISSS ($1,000) si aplica */}
              {result.isSalaryCappedByISSS && result.isssDays > 0 && (
                <div className="p-3 rounded bg-warning-subtle border border-warning-subtle small d-flex align-items-start gap-2 mb-3">
                  <AlertCircle size={16} className="text-warning-emphasis shrink-0 mt-0.5" />
                  <div className="text-slate-dark font-sans" style={{ fontSize: '12px' }}>
                    <strong>Por qué te pagan menos si ganas más de $1,000:</strong> Tu salario real es de {formatUSD(monthlySalary)} ({formatUSD(result.dailyRealSalary)} al día), pero la Ley del Seguro Social fija un tope máximo de {formatUSD(RATES.ISSS_CAP_MONTHLY)} al mes ($33.33 al día). Aunque ganes más, el Seguro solo calcula tu 75% sobre esos $33.33, pagándote como máximo {formatUSD(result.maxDailySubsidioCap)} al día.
                  </div>
                </div>
              )}

              {/* Resumen ultra claro de Descuentos */}
              <div className="p-3 rounded bg-light border mb-2">
                <span className="small fw-bold text-slate-dark d-block mb-1 font-sans" style={{ fontSize: '12px' }}>
                  Resumen de Descuentos: ¿Cuánto te quitan de cada pago?
                </span>
                <p className="text-muted small mb-2 font-sans" style={{ fontSize: '11px' }}>
                  Para que tengas claro por qué recibes cada cantidad y qué retenciones aplican por ley:
                </p>
                <div className="table-responsive">
                  <table className="table table-sm table-minimal align-middle mb-0 font-sans" style={{ fontSize: '11.5px', minWidth: '460px' }}>
                    <thead>
                      <tr className="text-muted">
                        <th>Quién te paga</th>
                        <th className="text-center">Descuento de AFP</th>
                        <th className="text-center">Descuento de ISSS</th>
                        <th className="text-center">Descuento de Renta</th>
                        <th className="text-end">¿Cómo te llega?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-slate-dark">
                          Tu Empresa (Días 1 a 3)
                        </td>
                        <td className="text-center text-secondary">Sí (-7.25%)</td>
                        <td className="text-center text-secondary">Sí (-3.00%)</td>
                        <td className="text-center text-secondary">Sí (según tabla)</td>
                        <td className="text-end font-monospace text-slate-dark">
                          En tu quincena normal
                        </td>
                      </tr>
                      <tr className="bg-emerald-50 text-emerald-950">
                        <td className="fw-bold text-emerald-900 d-flex align-items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald shrink-0" />
                          <span>El Seguro ISSS (Día 4 en adelante)</span>
                        </td>
                        <td className="text-center fw-bold text-emerald-800">Cero (0%)</td>
                        <td className="text-center fw-bold text-emerald-800">Cero (0%)</td>
                        <td className="text-center fw-bold text-emerald-800">Cero (0%)</td>
                        <td className="text-end font-monospace fw-bold text-emerald">
                          {formatUSD(result.isssTotalSubsidio)} (100% limpio)
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
      <div className="card-soft p-3 p-md-4">
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

        {/* Sección Especial: Retención de Subsidio por Mora Patronal o Planilla no Pagada */}
        <div className="mt-3 pt-3 border-top">
          <div className="p-3 rounded border bg-white">
            <div className="d-flex align-items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-primary shrink-0" />
              <h6 className="fw-bold text-slate-dark mb-0 font-sans" style={{ fontSize: '13px' }}>
                ¿Por qué el Seguro Social retiene tu subsidio? (Planilla presentada vs. pagada)
              </h6>
            </div>

            <div className="row g-3 small font-sans text-muted" style={{ fontSize: '11.5px' }}>
              <div className="col-12 col-md-6">
                <strong className="text-slate-dark d-block mb-1">
                  1. Planilla presentada en OVISSS no equivale a planilla pagada
                </strong>
                <p className="mb-2">
                  La empresa puede haber cargado la nómina en el Sistema de Planilla Única del ISSS, pero si no ha liquidado el mandamiento de pago (NPE) en el banco, el sistema financiero del ISSS registra a la empresa en estado de mora y <strong>congela el trámite en tránsito</strong> hacia la Sección de Subsidios. El sistema tarda entre 24 y 72 horas hábiles en liberar el subsidio tras la conciliación bancaria del pago.
                </p>
                <div className="p-2 rounded bg-light border text-slate-dark">
                  <strong>Qué pedir a tu empresa:</strong> Solicita al departamento de Recursos Humanos o Contabilidad el comprobante bancario del pago del NPE del mes de tu reposo o la captura de pantalla con estado «Pagada» en OVISSS.
                </div>
              </div>

              <div className="col-12 col-md-6">
                <strong className="text-slate-dark d-block mb-1">
                  2. Responsabilidad legal patronal (Art. 53 Ley del Seguro Social)
                </strong>
                <p className="mb-2">
                  La Ley del Seguro Social establece que si el trabajador deja de percibir las prestaciones en dinero debido al incumplimiento de obligaciones o mora patronal, <strong>el patrono está obligado a pagar directamente de sus propios fondos el 100% del subsidio que el empleado dejó de recibir</strong>, sin perjuicio de las multas impuestas por el ISSS.
                </p>
                <div className="p-2 rounded bg-light border text-slate-dark">
                  <strong>Plazo de cobro:</strong> Tienes hasta <strong>1 año</strong> a partir de la fecha de cada día de reposo para cobrar el subsidio antes de que prescriba.
                </div>
              </div>
            </div>

            {/* Canales Oficiales de Consulta del ISSS */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3 border-top mt-3">
              <div className="d-flex flex-wrap align-items-center gap-3 small font-sans text-muted" style={{ fontSize: '11px' }}>
                <span><strong>Canales Oficiales del ISSS:</strong></span>
                <span>Teléfono Call Center: <strong className="text-slate-dark">127</strong></span>
                <span>Correo Subsidios: <strong className="text-slate-dark font-monospace">secre.subsidios@isss.gob.sv</strong></span>
              </div>
              <a
                href="https://portal.isss.gob.sv"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-xs btn-primary d-inline-flex align-items-center gap-1.5 py-1 px-2.5 fw-semibold"
                style={{ fontSize: '11px' }}
              >
                <span>Consultar trámite en portal ISSS con DUI</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
