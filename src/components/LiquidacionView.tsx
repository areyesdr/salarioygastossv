import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Scale,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  Building,
  Briefcase,
  Percent,
  Plus,
  Equal,
  ChevronDown,
  ChevronUp,
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
  const [salary, setSalary] = useState<number>(initialSalary > 0 ? initialSalary : 944.19);
  const [salaryInput, setSalaryInput] = useState<string>(
    (initialSalary > 0 ? initialSalary : 944.19).toFixed(2)
  );

  // Fechas por defecto: 2 años atrás hasta hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultHireDate = new Date(Date.now() - 2 * 365 * 86_400_000).toISOString().split('T')[0];

  const [hireDate, setHireDate] = useState<string>(defaultHireDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [motivo, setMotivo] = useState<LiquidacionMotivo>('liquidacion_anual');
  const [salarioPendienteDias, setSalarioPendienteDias] = useState<number>(0);
  const [sectorId, setSectorId] = useState<MinimumWageSector['id']>('comercio');
  const [pactoPorcentaje, setPactoPorcentaje] = useState<number>(100);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showLegalDetails, setShowLegalDetails] = useState<boolean>(false);

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
    { label: 'S. Mínimo ($408.80)', amount: 408.8 },
    { label: '$600.00', amount: 600 },
    { label: '$800.00', amount: 800 },
    { label: '$944.19', amount: 944.19 },
    { label: '$1,200.00', amount: 1200 },
  ];

  const presetDiasAdeudados = [
    { label: '0 días (al día)', days: 0 },
    { label: '3 días', days: 3 },
    { label: '7 días (1 sem.)', days: 7 },
    { label: '15 días (1 quinc.)', days: 15 },
  ];

  const motivosList: {
    id: LiquidacionMotivo;
    title: string;
    sub: string;
    badge: string;
  }[] = [
    {
      id: 'liquidacion_anual',
      title: 'Liquidación anual (Finiquito de fin de año)',
      sub: 'Tu empresa te liquida cada año para abonar tu pasivo laboral',
      badge: '1 mes sueldo + Aguinaldo + Vacación',
    },
    {
      id: 'despido_injustificado',
      title: 'Me despidieron sin causa (Injustificado)',
      sub: 'Despido unilateral sin causal probada por el patrono',
      badge: 'Art. 58 CT · 30 días/año',
    },
    {
      id: 'renuncia_voluntaria',
      title: 'Renuncio voluntariamente',
      sub: 'Prestación económica si tienes 2 años o más en la empresa',
      badge: 'D.L. 592 · 15 días/año',
    },
    {
      id: 'despido_indirecto',
      title: 'Despido indirecto (Falta patronal grave)',
      sub: 'Incumplimiento de pago, rebaja de sueldo o acoso',
      badge: 'Art. 53 CT · Igual a despido',
    },
    {
      id: 'mutuo_acuerdo',
      title: 'Terminación por mutuo acuerdo',
      sub: 'Arreglo acordado entre empresa y trabajador',
      badge: 'Art. 54 CT · % convenido',
    },
    {
      id: 'despido_justificado',
      title: 'Despido con causa justificada',
      sub: 'Falta grave del trabajador según Art. 50 del Código',
      badge: '$0 indemnización · Solo prestaciones',
    },
    {
      id: 'fin_contrato',
      title: 'Vencimiento de contrato a plazo fijo',
      sub: 'Finalizó el plazo establecido en el contrato formal',
      badge: '$0 indemnización · Solo prestaciones',
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
              Calculadora de Liquidación y Finiquito Laboral
            </h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Conoce exactamente cuánto dinero te corresponde recibir en El Salvador y de dónde sale cada centavo.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Panel Izquierdo: Entradas Simples y Guiadas */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-xs border-slate-200">
            <div className="card-header bg-slate-50 border-bottom border-slate-200 py-3">
              <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                <Briefcase size={16} className="text-primary" />
                <span>Paso 1: Tus Datos de Salario y Fechas</span>
              </h6>
            </div>

            <div className="card-body p-3 p-md-4">
              {/* 1. Salario Mensual */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark d-flex justify-content-between align-items-center">
                  <span>1. ¿Cuánto ganas al mes? (Salario nominal)</span>
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
                    placeholder="944.19"
                  />
                </div>
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

              {/* 2. DÍAS DE SALARIO TRABAJADOS QUE TE DEBEN (UBICADO ARRIBA PARA VISIBILIDAD) */}
              <div className="p-3 rounded bg-light border border-slate-200 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label className="form-label small fw-bold text-slate-dark mb-0 d-flex align-items-center gap-1.5">
                    <DollarSign size={14} className="text-success" />
                    <span>2. ¿Cuántos días te deben de la quincena actual?</span>
                  </label>
                  <span className="fw-bold font-monospace text-success small">
                    {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                  </span>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                  Si trabajaste días que aún no te han pagado, márcalos aquí para sumarlos a tu cheque:
                </p>
                <div className="d-flex flex-wrap gap-1.5 mb-2">
                  {presetDiasAdeudados.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`btn btn-xs py-1 px-2 ${
                        salarioPendienteDias === item.days
                          ? 'btn-success text-white'
                          : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '11px' }}
                      onClick={() => setSalarioPendienteDias(item.days)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted">Otro número de días:</span>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    className="form-control font-monospace text-center"
                    value={salarioPendienteDias}
                    onChange={(e) => setSalarioPendienteDias(Number.parseInt(e.target.value || '0', 10))}
                  />
                  <span className="input-group-text bg-white text-muted">días</span>
                </div>
              </div>

              {/* 3. Fechas y Antigüedad */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1 mb-1.5">
                  <Calendar size={13} className="text-primary" />
                  <span>3. Fechas de tu empleo (Para calcular tu tiempo trabajado)</span>
                </label>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Fecha de Ingreso:</span>
                    <input
                      type="date"
                      className="form-control form-control-sm font-monospace"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Fecha de Salida / Fin:</span>
                    <input
                      type="date"
                      className="form-control form-control-sm font-monospace"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-body-tertiary border border-slate-200 d-flex align-items-center justify-content-between">
                  <span className="small text-muted" style={{ fontSize: '12px' }}>
                    Tu tiempo en la empresa:
                  </span>
                  <span className="fw-bold text-slate-dark font-monospace small" style={{ fontSize: '12px' }}>
                    {result.seniority.formattedSeniority}
                  </span>
                </div>
              </div>

              {/* 4. Selector de Motivo */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-slate-dark mb-1.5">
                  4. ¿Por qué motivo termina la relación de trabajo?
                </label>
                <div className="space-y-2">
                  {motivosList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setMotivo(m.id)}
                      className={`p-2.5 rounded border transition-all cursor-pointer ${
                        motivo === m.id
                          ? 'border-primary bg-primary-subtle bg-opacity-15 shadow-xs'
                          : 'border-slate-200 hover-bg-light'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <input
                          type="radio"
                          name="motivo_radio"
                          className="form-check-input mt-1 shrink-0"
                          checked={motivo === m.id}
                          onChange={() => setMotivo(m.id)}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-1">
                            <span className="small fw-bold text-slate-dark" style={{ fontSize: '13px' }}>
                              {m.title}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary border font-monospace" style={{ fontSize: '10px' }}>
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '11px' }}>
                            {m.sub}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opciones avanzadas (Colapsadas para no saturar) */}
              <div className="border-top pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-inline-flex align-items-center gap-1 small"
                  style={{ fontSize: '12px' }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <span>Opciones avanzadas (Sector de salario mínimo y mutuo acuerdo)</span>
                </button>

                {showAdvanced && (
                  <div className="p-3 rounded bg-light border border-slate-200 mt-2">
                    {motivo === 'mutuo_acuerdo' && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1.5 mb-1">
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
                          <span className="badge bg-purple font-monospace text-white py-1 px-2">
                            {pactoPorcentaje}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="form-label small fw-semibold text-slate-dark d-flex align-items-center gap-1 mb-1">
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
                        Define el tope de 4 salarios mínimos mensuales en despido o 2 diarios en renuncia.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Explicación Visual Clara y Simple de ¿De Dónde Sale el Dinero? */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-xs border-slate-200">
            {/* Header con Ecuación Visual Clara */}
            <div className="card-header bg-primary text-white p-3 p-md-4 border-0">
              <span className="text-white-50 text-uppercase fw-semibold tracking-wider d-block mb-1" style={{ fontSize: '11px' }}>
                Total a Recibir en tu Finiquito
              </span>
              <h1 className="display-5 fw-bold font-monospace mb-2 text-white">
                {formatUSD(result.totalLiquidacion)}
              </h1>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge bg-white text-primary fw-bold" style={{ fontSize: '11px' }}>
                  {result.motivoLabel}
                </span>
                <span className="badge bg-primary-subtle text-white border border-white-50" style={{ fontSize: '11px' }}>
                  Antigüedad: {result.seniority.formattedSeniority}
                </span>
              </div>

              {/* Ecuación Visual: Indemnización + Prestaciones = Total */}
              <div className="p-3 rounded bg-black bg-opacity-25 border border-white-50 border-opacity-25">
                <span className="text-white fw-bold d-block mb-2 small" style={{ fontSize: '12px' }}>
                  ¿De dónde sale este total de {formatUSD(result.totalLiquidacion)}?
                </span>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="p-2 rounded bg-white bg-opacity-10 text-center flex-grow-1">
                    <span className="d-block text-white-50 small" style={{ fontSize: '10px' }}>1. INDEMNIZACIÓN</span>
                    <strong className="font-monospace text-white fs-6">
                      {formatUSD(result.indemnizacion.amount)}
                    </strong>
                  </div>

                  <Plus size={16} className="text-white-50 shrink-0" />

                  <div className="p-2 rounded bg-white bg-opacity-10 text-center flex-grow-1">
                    <span className="d-block text-white-50 small" style={{ fontSize: '10px' }}>2. PRESTACIONES DE LEY</span>
                    <strong className="font-monospace text-white fs-6">
                      {formatUSD(result.derechosAdquiridos.total)}
                    </strong>
                  </div>

                  <Equal size={16} className="text-white-50 shrink-0" />

                  <div className="p-2 rounded bg-white text-dark text-center flex-grow-1">
                    <span className="d-block text-muted small fw-semibold" style={{ fontSize: '10px' }}>TOTAL CHEQUE</span>
                    <strong className="font-monospace text-primary fs-6">
                      {formatUSD(result.totalLiquidacion)}
                    </strong>
                  </div>
                </div>

                {/* Exento de Impuestos */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2.5 pt-2 border-top border-white border-opacity-20 small" style={{ fontSize: '11px' }}>
                  <span className="text-white-50">
                    🛡️ Libre de Renta / ISSS / AFP: <strong className="text-white font-monospace">{formatUSD(result.totalExentoISR)}</strong>
                  </span>
                  <span className="text-white-50">
                    Sujeto a deducciones ordinarias: <strong className="text-white font-monospace">{formatUSD(result.totalGravadoISR)}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-3 p-md-4">
              {/* Bloque 1: Indemnización o Compensación */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <ShieldCheck size={16} className="text-primary" />
                    <span>1. Compensación o Indemnización por Tiempo Laborado</span>
                  </h6>
                  <span className="fw-bold font-monospace text-primary fs-6">
                    {formatUSD(result.indemnizacion.amount)}
                  </span>
                </div>

                <div className="p-3 rounded bg-body-tertiary border border-slate-200">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 pb-2 border-bottom">
                    <span className="small text-muted" style={{ fontSize: '12px' }}>
                      ¿Aplica indemnización en este caso?
                    </span>
                    <span
                      className={`badge ${
                        result.indemnizacion.applies
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                      }`}
                    >
                      {result.indemnizacion.applies ? 'Sí aplica por ley' : 'No aplica indemnización'}
                    </span>
                  </div>

                  <p className="text-slate-dark small mb-2" style={{ fontSize: '12px' }}>
                    {result.indemnizacion.explanation}
                  </p>

                  {result.indemnizacion.applies && (
                    <div className="row g-2 small text-muted pt-2 border-top" style={{ fontSize: '11px' }}>
                      <div className="col-6 col-sm-3">
                        <span>Días computados:</span>
                        <strong className="d-block text-slate-dark font-monospace">
                          {result.indemnizacion.daysComputed} días
                        </strong>
                      </div>
                      <div className="col-6 col-sm-3">
                        <span>Salario base usado:</span>
                        <strong className="d-block text-slate-dark font-monospace">
                          {formatUSD(result.indemnizacion.baseMonthlySalary)}
                        </strong>
                      </div>
                      <div className="col-6 col-sm-3">
                        <span>Tope legal sector:</span>
                        <strong className="d-block text-slate-dark font-monospace">
                          {result.indemnizacion.monthlyCap > 0 ? formatUSD(result.indemnizacion.monthlyCap) : 'Sin tope'}
                        </strong>
                      </div>
                      <div className="col-6 col-sm-3">
                        <span>¿Aplica tope legal?</span>
                        <strong className={`d-block ${result.indemnizacion.isCapped ? 'text-warning fw-bold' : 'text-slate-dark'}`}>
                          {result.indemnizacion.isCapped ? 'Sí (Topado)' : 'No (Salario Real)'}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloque 2: Prestaciones de Ley Acumuladas */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <DollarSign size={16} className="text-success" />
                    <span>2. Prestaciones Acumuladas de Ley (Las que te tocan sí o sí)</span>
                  </h6>
                  <span className="fw-bold font-monospace text-success fs-6">
                    {formatUSD(result.derechosAdquiridos.total)}
                  </span>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: '11px' }}>
                  Por ley laboral en El Salvador, el empleador está obligado a pagarte estos 3 conceptos sin importar si renuncias o te despiden:
                </p>

                {/* Lista de Prestaciones sin tablas rotas en modo oscuro */}
                <div className="space-y-2.5">
                  {/* Vacación */}
                  <div className="p-3 rounded bg-body-tertiary border border-slate-200">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <div>
                        <strong className="text-slate-dark small d-block" style={{ fontSize: '13px' }}>
                          🌴 Vacación ({motivo === 'liquidacion_anual' ? 'Anual completa de 15 días' : `${result.derechosAdquiridos.vacacionDays} días proporcionales`}) + 30% bono de ley
                        </strong>
                        <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
                          {motivo === 'liquidacion_anual'
                            ? `15 días de salario ($${(salary / 2).toFixed(2)}) + 30% de bono obligatorio ($${(salary * 0.15).toFixed(2)})`
                            : `Acumulada desde tu último aniversario laboral (${result.derechosAdquiridos.vacacionDaysInPeriod} días trabajados en el periodo).`}
                        </p>
                      </div>
                      <span className="fw-bold font-monospace text-slate-dark fs-6 shrink-0">
                        {formatUSD(result.derechosAdquiridos.vacacionTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Aguinaldo */}
                  <div className="p-3 rounded bg-body-tertiary border border-slate-200">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <div>
                        <strong className="text-slate-dark small d-block" style={{ fontSize: '13px' }}>
                          🎁 Aguinaldo de ley ({result.derechosAdquiridos.aguinaldoSeniorityDays} días de base por tu antigüedad)
                        </strong>
                        <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
                          {motivo === 'liquidacion_anual'
                            ? `Aguinaldo completo de fin de año (${result.derechosAdquiridos.aguinaldoSeniorityDays} días de salario).`
                            : `Proporcional desde el 12 de diciembre anterior (${result.derechosAdquiridos.aguinaldoDaysInPeriod} días laborados en el periodo).`}
                        </p>
                      </div>
                      <span className="fw-bold font-monospace text-slate-dark fs-6 shrink-0">
                        {formatUSD(result.derechosAdquiridos.aguinaldoAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Salarios pendientes */}
                  <div className="p-3 rounded bg-body-tertiary border border-slate-200">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <div>
                        <strong className="text-slate-dark small d-block" style={{ fontSize: '13px' }}>
                          💼 Días de salario trabajados pendientes de cobro
                        </strong>
                        <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
                          {result.derechosAdquiridos.salarioPendienteDias > 0
                            ? `${result.derechosAdquiridos.salarioPendienteDias} días trabajados en la quincena actual que aún no te han pagado.`
                            : 'Estás al día con tus pagos ordinarios (0 días adeudados).'}
                        </p>
                      </div>
                      <span className="fw-bold font-monospace text-slate-dark fs-6 shrink-0">
                        {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de Subtotal compatible con temas claro y oscuro */}
                <div className="p-3 rounded bg-success-subtle bg-opacity-20 border border-success-subtle mt-3 d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold text-slate-dark" style={{ fontSize: '12px' }}>
                    Subtotal Prestaciones de Ley:
                  </span>
                  <strong className="font-monospace text-success fs-6">
                    {formatUSD(result.derechosAdquiridos.total)}
                  </strong>
                </div>
              </div>

              {/* Fundamentos Legales Oficiales (Colapsables para lectura limpia) */}
              <div className="border-top pt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-inline-flex align-items-center gap-1.5 small"
                  style={{ fontSize: '12px' }}
                  onClick={() => setShowLegalDetails(!showLegalDetails)}
                >
                  <FileText size={13} className="text-primary" />
                  <span>{showLegalDetails ? 'Ocultar base jurídica y artículos de ley' : 'Ver base jurídica oficial del Ministerio de Trabajo y Código'}</span>
                  {showLegalDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showLegalDetails && (
                  <div className="p-3 rounded bg-body-tertiary border border-slate-200 mt-2">
                    <h6 className="fw-bold text-slate-dark mb-2" style={{ fontSize: '12px' }}>
                      Artículos y Decretos Oficiales Aplicados
                    </h6>
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
                        Este cálculo sigue las tablas y procedimientos que utiliza la Dirección General de Inspección de Trabajo del MTPS para emitir la Hoja Oficial de Liquidación en El Salvador.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default LiquidacionView;
