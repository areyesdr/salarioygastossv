import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Scale,
  Calendar,
  FileText,
  Info,
  DollarSign,
  ShieldCheck,
  Building,
  Briefcase,
  Percent,
} from 'lucide-react';
import {
  calcLiquidacion,
  type LiquidacionMotivo,
  MINIMUM_WAGES_2026,
  type MinimumWageSector,
} from '../lib/svLaborLaw';

interface LiquidacionViewProps {
  monthlySalary: number;
  formatUSD: (amount: number) => string;
}

export function LiquidacionView({ monthlySalary: initialSalary, formatUSD }: LiquidacionViewProps) {
  const [salary, setSalary] = useState<number>(initialSalary > 0 ? initialSalary : 408.8);
  const [salaryInput, setSalaryInput] = useState<string>(
    (initialSalary > 0 ? initialSalary : 408.8).toFixed(2)
  );

  // Fechas por defecto: 2 años atrás hasta la fecha actual
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultHireDate = new Date(Date.now() - 2 * 365 * 86_400_000).toISOString().split('T')[0];

  const [hireDate, setHireDate] = useState<string>(defaultHireDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [motivo, setMotivo] = useState<LiquidacionMotivo>('despido_injustificado');
  const [salarioPendienteDias, setSalarioPendienteDias] = useState<number>(0);
  const [sectorId, setSectorId] = useState<MinimumWageSector['id']>('comercio');
  const [pactoPorcentaje, setPactoPorcentaje] = useState<number>(100);

  const result = useMemo(() => {
    return calcLiquidacion({
      monthlySalary: salary,
      hireDate,
      endDate,
      motivo,
      salarioPendienteDias,
      sectorId,
      pactoPorcentajeMutuo: pactoPorcentaje,
    });
  }, [salary, hireDate, endDate, motivo, salarioPendienteDias, sectorId, pactoPorcentaje]);

  const handleSalaryChange = (valStr: string) => {
    setSalaryInput(valStr);
    const parsed = Number.parseFloat(valStr);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setSalary(parsed);
    }
  };

  const presetSalaries = [
    { label: 'S. Mín. ($408.80)', amount: 408.8 },
    { label: '$600.00', amount: 600 },
    { label: '$800.00', amount: 800 },
    { label: '$1,200.00', amount: 1200 },
    { label: '$2,000.00 (Topado)', amount: 2000 },
  ];

  const motivosList: { id: LiquidacionMotivo; label: string; badge: string; badgeColor: string }[] = [
    {
      id: 'despido_injustificado',
      label: 'Despido sin causa justificada (Injustificado)',
      badge: 'Art. 58 CT · 30 días/año',
      badgeColor: 'bg-primary-subtle text-primary border-primary-subtle',
    },
    {
      id: 'renuncia_voluntaria',
      label: 'Renuncia voluntaria con prestación de ley',
      badge: 'D.L. 592 · 15 días/año (≥ 2 años)',
      badgeColor: 'bg-info-subtle text-info border-info-subtle',
    },
    {
      id: 'liquidacion_anual',
      label: 'Liquidación anual / Finiquito de fin de año',
      badge: '1 mes + Aguinaldo + Vacación',
      badgeColor: 'bg-success-subtle text-success border-success-subtle',
    },
    {
      id: 'despido_indirecto',
      label: 'Despido indirecto (Falta grave patronal)',
      badge: 'Art. 53 CT · Equivalente a despido',
      badgeColor: 'bg-warning-subtle text-warning border-warning-subtle',
    },
    {
      id: 'mutuo_acuerdo',
      label: 'Terminación por mutuo acuerdo',
      badge: 'Art. 54 CT · Porcentaje acordado',
      badgeColor: 'bg-purple-subtle text-purple border-purple-subtle',
    },
    {
      id: 'despido_justificado',
      label: 'Despido con causa justificada (Falta grave del empleado)',
      badge: 'Art. 50 CT · Solo derechos adquiridos',
      badgeColor: 'bg-danger-subtle text-danger border-danger-subtle',
    },
    {
      id: 'fin_contrato',
      label: 'Vencimiento de contrato a plazo fijo',
      badge: 'Art. 25/48 CT · Solo derechos adquiridos',
      badgeColor: 'bg-secondary-subtle text-secondary border-secondary-subtle',
    },
  ];

  return (
    <motion.div
      key="tab-liquidacion"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      {/* Encabezado Principal */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Scale className="text-primary" size={24} />
            <h5 className="fw-bold mb-0 text-slate-dark">
              Calculadora de Liquidaciones y Finiquitos de Ley
            </h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Cálculo oficial conforme al Código de Trabajo de El Salvador, Ley D.L. 592 y parámetros del Ministerio de Trabajo (MTPS).
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Panel Izquierdo: Parámetros del Trabajador y Motivo */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-xs border-slate-200 h-100">
            <div className="card-header bg-slate-50 border-bottom border-slate-200 py-3">
              <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                <Briefcase size={16} className="text-secondary" />
                <span>Datos Laborales y Motivo de Salida</span>
              </h6>
            </div>
            <div className="card-body p-3 p-md-4">
              {/* Salario Mensual */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark d-flex justify-content-between align-items-center">
                  <span>Salario Mensual Nominal</span>
                  <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                    Diario: {formatUSD(result.dailyRealSalary)}
                  </span>
                </label>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text bg-light text-muted fw-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control font-monospace fw-semibold"
                    value={salaryInput}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    placeholder="408.80"
                  />
                </div>
                {/* Salarios rápidos */}
                <div className="d-flex flex-wrap gap-1.5">
                  {presetSalaries.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`btn btn-xs py-1 px-2 ${
                        Math.abs(salary - preset.amount) < 0.01
                          ? 'btn-primary'
                          : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '11px' }}
                      onClick={() => {
                        setSalary(preset.amount);
                        setSalaryInput(preset.amount.toFixed(2));
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas de Ingreso y Salida */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1">
                    <Calendar size={13} className="text-secondary" />
                    <span>Fecha de Ingreso</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm font-monospace"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1">
                    <Calendar size={13} className="text-secondary" />
                    <span>Fecha de Finalización</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm font-monospace"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Badge de Antigüedad Resultante */}
              <div className="p-2.5 rounded bg-light border border-slate-200 mb-3 d-flex align-items-center justify-content-between">
                <span className="small text-muted" style={{ fontSize: '12px' }}>
                  Antigüedad Laboral:
                </span>
                <span className="fw-bold text-slate-dark font-monospace small" style={{ fontSize: '12px' }}>
                  {result.seniority.formattedSeniority} ({result.seniority.totalDays} días)
                </span>
              </div>

              {/* Selector de Motivo de Salida */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark">
                  Motivo de Terminación o Cálculo
                </label>
                <div className="space-y-1.5">
                  {motivosList.map((m) => (
                    <label
                      key={m.id}
                      className={`d-flex flex-column p-2.5 rounded border cursor-pointer transition-all ${
                        motivo === m.id
                          ? 'border-primary bg-primary-subtle bg-opacity-10 shadow-xs'
                          : 'border-slate-200 hover-bg-light'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="motivo_radio"
                            className="form-check-input mt-0"
                            checked={motivo === m.id}
                            onChange={() => setMotivo(m.id)}
                          />
                          <span className="small fw-semibold text-slate-dark" style={{ fontSize: '13px' }}>
                            {m.label}
                          </span>
                        </div>
                      </div>
                      <span className="badge align-self-start font-monospace" style={{ fontSize: '10px' }}>
                        {m.badge}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parámetros específicos según motivo */}
              {motivo === 'mutuo_acuerdo' && (
                <div className="p-2.5 rounded bg-purple-subtle bg-opacity-20 border border-purple-subtle mb-3">
                  <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1.5 mb-1.5">
                    <Percent size={13} className="text-purple" />
                    <span>Porcentaje de Indemnización Pactado</span>
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="form-range"
                      value={pactoPorcentaje}
                      onChange={(e) => setPactoPorcentaje(Number.parseInt(e.target.value, 10))}
                    />
                    <span className="badge bg-purple font-monospace text-white py-1.5 px-2" style={{ fontSize: '12px' }}>
                      {pactoPorcentaje}%
                    </span>
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                    Porcentaje acordado sobre la indemnización de despido (Art. 54 CT).
                  </small>
                </div>
              )}

              {/* Días pendientes de pago */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark d-flex justify-content-between align-items-center">
                  <span>Días de salario adeudados en la quincena/mes</span>
                  <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                    {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                  </span>
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">Días:</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="form-control font-monospace"
                    value={salarioPendienteDias}
                    onChange={(e) => setSalarioPendienteDias(Number.parseInt(e.target.value || '0', 10))}
                  />
                </div>
              </div>

              {/* Sector Económico */}
              <div>
                <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1.5">
                  <Building size={13} className="text-secondary" />
                  <span>Sector para Salario Mínimo Legal</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value as MinimumWageSector['id'])}
                >
                  {Object.values(MINIMUM_WAGES_2026).map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} (${sec.monthly.toFixed(2)}/mes)
                    </option>
                  ))}
                </select>
                <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Determina los topes de 4 salarios mínimos (despido) o 2 diarios (renuncia).
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Liquidación Oficial y Desglose Financiero */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-xs border-slate-200">
            {/* Header del Total Neto */}
            <div className="card-body p-3 p-md-4 bg-primary text-white rounded-top">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <span className="text-white-50 text-uppercase fw-semibold tracking-wider" style={{ fontSize: '11px' }}>
                    Total Liquidación / Finiquito a Percibir
                  </span>
                  <h2 className="display-6 fw-bold font-monospace mb-0 mt-1">
                    {formatUSD(result.totalLiquidacion)}
                  </h2>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge bg-white text-primary fw-bold" style={{ fontSize: '11px' }}>
                      {result.motivoLabel}
                    </span>
                  </div>
                </div>

                <div className="text-sm-end border-sm-start border-white-50 ps-sm-3">
                  <div className="small mb-1">
                    <span className="text-white-50">Exento de ISR / ISSS / AFP: </span>
                    <strong className="font-monospace text-white">{formatUSD(result.totalExentoISR)}</strong>
                  </div>
                  <div className="small">
                    <span className="text-white-50">Sujeto a deducciones ordinarias: </span>
                    <strong className="font-monospace text-white">{formatUSD(result.totalGravadoISR)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body p-3 p-md-4">
              {/* Bloque 1: Indemnización o Prestación por Tiempo Laborado */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Compensación o Indemnización por Tiempo Laborado</span>
                  </h6>
                  <span className="fw-bold font-monospace text-primary" style={{ fontSize: '15px' }}>
                    {formatUSD(result.indemnizacion.amount)}
                  </span>
                </div>

                <div className="p-3 rounded bg-light border border-slate-200">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 pb-2 border-bottom">
                    <span className="text-muted small" style={{ fontSize: '12px' }}>
                      Estado del Derecho:
                    </span>
                    <span
                      className={`badge ${
                        result.indemnizacion.applies
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {result.indemnizacion.applies ? 'Aplica Indemnización / Prestación' : 'No Aplica'}
                    </span>
                  </div>

                  <div className="row g-2 small text-muted mb-2" style={{ fontSize: '12px' }}>
                    <div className="col-6 col-sm-3">
                      <span>Días computados:</span>
                      <strong className="d-block text-slate-dark font-monospace">
                        {result.indemnizacion.daysComputed} días
                      </strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span>Salario base cálculo:</span>
                      <strong className="d-block text-slate-dark font-monospace">
                        {formatUSD(result.indemnizacion.baseMonthlySalary)}
                      </strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span>Tope legal sector:</span>
                      <strong className="d-block text-slate-dark font-monospace">
                        {result.indemnizacion.monthlyCap > 0 ? formatUSD(result.indemnizacion.monthlyCap) : 'N/A'}
                      </strong>
                    </div>
                    <div className="col-6 col-sm-3">
                      <span>¿Aplica tope legal?</span>
                      <strong className={`d-block ${result.indemnizacion.isCapped ? 'text-warning fw-bold' : 'text-slate-dark'}`}>
                        {result.indemnizacion.isCapped ? 'Sí (Topado)' : 'No (Salario Real)'}
                      </strong>
                    </div>
                  </div>

                  <p className="small text-muted mb-0 font-sans" style={{ fontSize: '11px' }}>
                    <Info size={12} className="d-inline me-1 text-primary" />
                    {result.indemnizacion.explanation}
                  </p>
                </div>
              </div>

              {/* Bloque 2: Derechos Adquiridos Irrenunciables */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <DollarSign size={16} className="text-success" />
                    <span>Derechos Adquiridos de Ley (Irrenunciables)</span>
                  </h6>
                  <span className="fw-bold font-monospace text-success" style={{ fontSize: '15px' }}>
                    {formatUSD(result.derechosAdquiridos.total)}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered mb-0 align-middle" style={{ fontSize: '12px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Concepto Legal</th>
                        <th className="text-center">Días Computados</th>
                        <th className="text-end">Monto Calculado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Vacación Proporcional + 30%</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            {result.derechosAdquiridos.vacacionDays} días de vacación sobre {result.derechosAdquiridos.vacacionDaysInPeriod} días trabajados en el periodo (Art. 177 y 187 CT).
                          </div>
                        </td>
                        <td className="text-center font-monospace">
                          {result.derechosAdquiridos.vacacionDays} d
                        </td>
                        <td className="text-end font-monospace fw-semibold text-slate-dark">
                          {formatUSD(result.derechosAdquiridos.vacacionTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Aguinaldo Proporcional</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            Calculado desde el 12 de diciembre anterior ({result.derechosAdquiridos.aguinaldoDaysInPeriod} días laborados, base de {result.derechosAdquiridos.aguinaldoSeniorityDays} días, Art. 196-202 CT).
                          </div>
                        </td>
                        <td className="text-center font-monospace">
                          {result.derechosAdquiridos.aguinaldoSeniorityDays} d base
                        </td>
                        <td className="text-end font-monospace fw-semibold text-slate-dark">
                          {formatUSD(result.derechosAdquiridos.aguinaldoAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Salarios Pendientes Adeudados</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            Días laborados devengados en la última quincena o mes no cobrados.
                          </div>
                        </td>
                        <td className="text-center font-monospace">
                          {result.derechosAdquiridos.salarioPendienteDias} d
                        </td>
                        <td className="text-end font-monospace fw-semibold text-slate-dark">
                          {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td colSpan={2} className="text-end">Subtotal Derechos Adquiridos:</td>
                        <td className="text-end font-monospace text-success">
                          {formatUSD(result.derechosAdquiridos.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Fundamento Jurídico Oficial y Normativa MTPS */}
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FileText size={15} className="text-primary" />
                  <h6 className="fw-semibold text-slate-dark mb-0" style={{ fontSize: '13px' }}>
                    Fundamentos Jurídicos Oficiales Aplicados
                  </h6>
                </div>
                <div className="d-flex flex-wrap gap-1.5 mb-2.5">
                  {result.legalArticles.map((art) => (
                    <span key={art} className="badge bg-light text-slate-dark border border-slate-300 font-sans" style={{ fontSize: '11px' }}>
                      {art}
                    </span>
                  ))}
                </div>
                <ul className="text-muted small ps-3 mb-0 space-y-1" style={{ fontSize: '11px' }}>
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                  <li>
                    Este cálculo sigue el procedimiento formal del Ministerio de Trabajo y Previsión Social (MTPS) para audiencias de conciliación y finiquitos ante la Dirección General de Inspección de Trabajo.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default LiquidacionView;
