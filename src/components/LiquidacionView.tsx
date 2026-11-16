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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Gift,
  Palmtree,
  Star,
} from 'lucide-react';
import {
  calcLiquidacion,
  type LiquidacionMotivo,
  MINIMUM_WAGES_2026,
  type MinimumWageSector,
} from '../lib/svLaborLaw';
import {
  PrimeButton,
  PrimeCard,
  PrimeCheckbox,
  PrimeInput,
  PrimeMessage,
  PrimeSelect,
  PrimeTag,
} from './ui/PrimeUI.tsx';

interface LiquidacionViewProps {
  monthlySalary: number;
  formatUSD: (amount: number) => string;
}

export function LiquidacionView({ monthlySalary: initialSalary, formatUSD }: LiquidacionViewProps) {
  const [salary, setSalary] = useState<number>(initialSalary > 0 ? initialSalary : 944.19);
  const [salaryInput, setSalaryInput] = useState<string>(
    (initialSalary > 0 ? initialSalary : 944.19).toFixed(2)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultHireDate = new Date(Date.now() - 2 * 365 * 86_400_000).toISOString().split('T')[0];

  const [hireDate, setHireDate] = useState<string>(defaultHireDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [motivo, setMotivo] = useState<LiquidacionMotivo>('liquidacion_anual');
  const [salarioPendienteDias, setSalarioPendienteDias] = useState<number>(0);
  const [sectorId, setSectorId] = useState<MinimumWageSector['id']>('comercio');
  const [pactoPorcentaje, setPactoPorcentaje] = useState<number>(100);
  const [incluirQuincena25, setIncluirQuincena25] = useState<boolean>(false);
  const [yaCobroVacacion, setYaCobroVacacion] = useState<boolean>(false);
  const [yaCobroAguinaldo, setYaCobroAguinaldo] = useState<boolean>(false);
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
      incluirQuincena25,
      yaCobroVacacion,
      yaCobroAguinaldo,
    });
  }, [
    salary,
    hireDate,
    endDate,
    motivo,
    salarioPendienteDias,
    sectorId,
    pactoPorcentaje,
    incluirQuincena25,
    yaCobroVacacion,
    yaCobroAguinaldo,
  ]);

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
      className="space-y-5"
    >
      <div className="border-b border-[var(--color-rule)] pb-3">
        <div className="flex items-center gap-2">
          <Scale className="text-[var(--color-accent)]" size={22} />
          <h5 className="text-lg font-bold text-[var(--color-ink)] m-0">
            Calculadora de Liquidación y Finiquito Laboral
          </h5>
        </div>
        <p className="text-[var(--color-muted)] text-xs mt-1 mb-0">
          Conoce exactamente cuánto dinero te corresponde recibir en El Salvador y el origen de cada monto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Panel Izquierdo */}
        <PrimeCard className="lg:col-span-5">
          <div className="px-4 py-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
            <h6 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2 m-0">
              <Briefcase size={15} className="text-[var(--color-accent)]" />
              <span>Paso 1: Tus datos de salario y fechas</span>
            </h6>
          </div>

          <div className="p-4 space-y-4">
            {/* 1. Salario Mensual */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-semibold text-[var(--color-ink)]">
                  1. ¿Cuánto ganas al mes? (Salario nominal)
                </span>
                <span className="text-[var(--color-muted)] font-mono text-[11px]">
                  Diario: {formatUSD(result.dailyRealSalary)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="px-2.5 py-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-muted)]">
                  $
                </span>
                <PrimeInput
                  type="number"
                  inputSize="sm"
                  mono
                  step="0.01"
                  min="0"
                  className="font-semibold"
                  value={salaryInput}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  placeholder="944.19"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presetSalaries.map((preset) => (
                  <PrimeButton
                    key={preset.label}
                    size="xs"
                    variant={Math.abs(salary - preset.amount) < 0.01 ? 'primary' : 'outline'}
                    onClick={() => {
                      setSalary(preset.amount);
                      setSalaryInput(preset.amount.toFixed(2));
                    }}
                  >
                    {preset.label}
                  </PrimeButton>
                ))}
              </div>
            </div>

            {/* 2. Días adeudados */}
            <div className="surface-well p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[var(--color-emerald)]" />
                  <span>2. ¿Cuántos días te deben de la quincena?</span>
                </span>
                <span className="font-bold font-mono text-[var(--color-emerald)]">
                  {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] m-0">
                Si trabajaste días que aún no te han pagado, márcalos aquí para sumarlos:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presetDiasAdeudados.map((item) => (
                  <PrimeButton
                    key={item.label}
                    size="xs"
                    variant={salarioPendienteDias === item.days ? 'success' : 'outline'}
                    onClick={() => setSalarioPendienteDias(item.days)}
                  >
                    {item.label}
                  </PrimeButton>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-[var(--color-muted)] shrink-0">Otro número de días:</span>
                <PrimeInput
                  type="number"
                  inputSize="sm"
                  mono
                  min="0"
                  max="31"
                  className="text-center w-[76px]"
                  value={salarioPendienteDias}
                  onChange={(e) => setSalarioPendienteDias(Number.parseInt(e.target.value || '0', 10))}
                />
                <span className="text-[11px] text-[var(--color-muted)]">días</span>
              </div>
            </div>

            {/* 3. Fechas y Antigüedad */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                <Calendar size={13} className="text-[var(--color-accent)]" />
                <span>3. Fechas de tu empleo</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-[var(--color-muted)] block mb-1">Fecha de Ingreso:</span>
                  <PrimeInput
                    type="date"
                    inputSize="sm"
                    mono
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-muted)] block mb-1">Fecha de Salida / Fin:</span>
                  <PrimeInput
                    type="date"
                    inputSize="sm"
                    mono
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="surface-well px-3 py-2 flex justify-between items-center text-xs">
                <span className="text-[var(--color-muted)]">Tu tiempo en la empresa:</span>
                <span className="font-bold font-mono text-[var(--color-ink)]">
                  {result.seniority.formattedSeniority}
                </span>
              </div>
            </div>

            {/* 4. Motivo */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--color-ink)] block">
                4. ¿Por qué motivo termina la relación de trabajo?
              </span>
              <div className="space-y-1.5">
                {motivosList.map((m) => {
                  const active = motivo === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMotivo(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl border cursor-pointer transition-colors duration-150 ${
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                          : 'border-[var(--color-rule)] bg-[var(--color-card)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            active ? 'border-[var(--color-accent)]' : 'border-[var(--color-muted)]'
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[var(--color-ink)]">{m.title}</span>
                            <PrimeTag severity={active ? 'info' : 'neutral'} className="font-mono text-[10px]">
                              {m.badge}
                            </PrimeTag>
                          </div>
                          <p className="text-[11px] text-[var(--color-muted)] m-0 mt-0.5">{m.sub}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Ajustes */}
            <div className="surface-well p-3 space-y-2.5">
              <span className="text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[var(--color-accent)]" />
                <span>5. ¿Ya te pagaron alguna prestación o incluyes Quincena 25?</span>
              </span>

              <label htmlFor="check_ya_vacacion" className="flex items-start gap-2 cursor-pointer text-xs">
                <PrimeCheckbox
                  id="check_ya_vacacion"
                  checked={yaCobroVacacion}
                  onChange={setYaCobroVacacion}
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-[var(--color-ink)] block">
                    Ya me pagaron o ya gocé las vacaciones
                  </strong>
                  <span className="text-[11px] text-[var(--color-muted)]">
                    Márcalo si tu empresa ya canceló tus vacaciones ($0.00).
                  </span>
                </span>
              </label>

              <label htmlFor="check_ya_aguinaldo" className="flex items-start gap-2 cursor-pointer text-xs">
                <PrimeCheckbox
                  id="check_ya_aguinaldo"
                  checked={yaCobroAguinaldo}
                  onChange={setYaCobroAguinaldo}
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-[var(--color-ink)] block">
                    Ya me pagaron el aguinaldo de este periodo
                  </strong>
                  <span className="text-[11px] text-[var(--color-muted)]">
                    Márcalo si ya recibiste el aguinaldo de estas fechas.
                  </span>
                </span>
              </label>

              <div className="pt-2 border-t border-[var(--color-rule)]">
                <label htmlFor="check_q25" className="flex items-start gap-2 cursor-pointer text-xs">
                  <PrimeCheckbox
                    id="check_q25"
                    checked={incluirQuincena25}
                    onChange={setIncluirQuincena25}
                    className="mt-0.5"
                  />
                  <span>
                    <strong className="text-[var(--color-accent)] flex items-center gap-1">
                      <Star size={12} />
                      <span>Incluir pago de Quincena 25 (Decreto 499)</span>
                    </strong>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      Suma 1 quincena completa ({formatUSD(salary / 2)}) 100% exenta (sueldo ≤ $1,500).
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div className="pt-2 border-t border-[var(--color-rule)]">
              <PrimeButton
                variant="ghost"
                size="xs"
                className="px-0"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                <span>Opciones avanzadas (Sector y mutuo acuerdo)</span>
              </PrimeButton>

              {showAdvanced && (
                <div className="surface-well p-3 mt-2 space-y-3">
                  {motivo === 'mutuo_acuerdo' && (
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-[var(--color-ink)] flex items-center gap-1">
                          <Percent size={13} />
                          <span>Porcentaje de Indemnización Pactado</span>
                        </span>
                        <PrimeTag severity="info" className="font-mono">{pactoPorcentaje}%</PrimeTag>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="w-full accent-[var(--color-accent)]"
                        value={pactoPorcentaje}
                        onChange={(e) => setPactoPorcentaje(Number.parseInt(e.target.value, 10))}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1 mb-1">
                      <Building size={13} className="text-[var(--color-muted)]" />
                      <span>Sector para Salario Mínimo Legal</span>
                    </label>
                    <PrimeSelect
                      selectSize="sm"
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value as MinimumWageSector['id'])}
                    >
                      {Object.values(MINIMUM_WAGES_2026).map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} (${sec.monthly.toFixed(2)}/mes)
                        </option>
                      ))}
                    </PrimeSelect>
                    <small className="text-[var(--color-muted)] block mt-1 text-[11px]">
                      Define el tope de 4 salarios mínimos mensuales en despido o 2 diarios en renuncia.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PrimeCard>

        {/* Panel Derecho */}
        <PrimeCard className="lg:col-span-7">
          <div className="p-4 sm:p-5 bg-[var(--color-ink)] text-[var(--color-card)] space-y-3">
            <div>
              <span className="text-xs opacity-75 block mb-1">Total a recibir en tu finiquito</span>
              <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
                {formatUSD(result.totalLiquidacion)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PrimeTag severity="info">{result.motivoLabel}</PrimeTag>
              <PrimeTag severity="neutral">Antigüedad: {result.seniority.formattedSeniority}</PrimeTag>
            </div>

            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-2.5">
              <span className="text-xs font-semibold block">
                Desglose del total ({formatUSD(result.totalLiquidacion)}):
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="p-2.5 rounded-lg bg-[var(--color-card)] text-[var(--color-ink)] text-center flex-1 min-w-[110px]">
                  <span className="block text-[10px] text-[var(--color-muted)] font-medium">
                    1. Indemnización
                  </span>
                  <strong className="font-mono text-sm">{formatUSD(result.indemnizacion.amount)}</strong>
                </div>

                <Plus size={16} className="shrink-0 opacity-80" />

                <div className="p-2.5 rounded-lg bg-[var(--color-card)] text-[var(--color-ink)] text-center flex-1 min-w-[110px]">
                  <span className="block text-[10px] text-[var(--color-muted)] font-medium">
                    2. Prestaciones de ley
                  </span>
                  <strong className="font-mono text-sm">
                    {formatUSD(result.derechosAdquiridos.total)}
                  </strong>
                </div>

                <Equal size={16} className="shrink-0 opacity-80" />

                <div className="p-2.5 rounded-lg bg-[var(--color-card)] text-[var(--color-emerald)] text-center flex-1 min-w-[110px]">
                  <span className="block text-[10px] font-semibold">Total cheque</span>
                  <strong className="font-mono text-sm">{formatUSD(result.totalLiquidacion)}</strong>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-white/15 text-[11px] opacity-90">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Libre de Renta / ISSS / AFP:</span>
                  <strong className="font-mono">{formatUSD(result.totalExentoISR)}</strong>
                </span>
                <span>
                  Sujeto a deducciones ordinarias:{' '}
                  <strong className="font-mono">{formatUSD(result.totalGravadoISR)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {/* Aclaración Jurídica Dinámica */}
            <div className="surface-well p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h6 className="text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5 m-0">
                  <Scale size={15} className="text-[var(--color-accent)] shrink-0" />
                  <span>¿Qué conceptos aplican por ley y cuáles no en tu caso?</span>
                </h6>
                <PrimeTag severity="info">{result.motivoLabel}</PrimeTag>
              </div>

              {motivo === 'renuncia_voluntaria' && (
                <div className="space-y-2">
                  {result.seniority.years < 2 ? (
                    <>
                      <PrimeMessage severity="danger" icon={<XCircle size={15} />}>
                        <strong>NO aplica indemnización por renuncia ($0.00):</strong> La Ley D.L. 592 exige al menos 2 años cumplidos de servicio continuo. Con {result.seniority.formattedSeniority}, la indemnización es $0.00.
                      </PrimeMessage>
                      <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                        <strong>SÍ aplican obligatoriamente tus prestaciones acumuladas (Art. 52 Constitución):</strong>
                        <ul className="pl-4 mt-1 mb-0 space-y-1 list-disc">
                          <li>
                            <strong>Aguinaldo proporcional (Art. 202 CT):</strong> Por los {result.derechosAdquiridos.aguinaldoDaysInPeriod} días laborados desde el 12 de diciembre. No requiere 2 años.
                          </li>
                          <li>
                            <strong>Vacación proporcional (Art. 187 CT):</strong> Por los {result.derechosAdquiridos.vacacionDaysInPeriod} días laborados desde tu último aniversario.
                          </li>
                          <li>
                            <strong>Días de salario trabajados:</strong> Todo día laborado pendiente de pago.
                          </li>
                        </ul>
                      </PrimeMessage>
                      <PrimeMessage severity="warning" icon={<AlertTriangle size={15} />}>
                        <strong>Aclaración importante:</strong> Cuando indican que «si renuncias antes de 2 años no te corresponde», se refieren únicamente a la indemnización. Tus vacaciones y aguinaldo proporcionales son irrenunciables.
                      </PrimeMessage>
                    </>
                  ) : (
                    <>
                      <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                        <strong>SÍ aplica prestación por renuncia (D.L. 592):</strong> Al tener 2 o más años ({result.seniority.formattedSeniority}), corresponden 15 días de salario por año laborado ({result.indemnizacion.daysComputed} días) con tope de 2 salarios mínimos diarios del sector.
                      </PrimeMessage>
                      <PrimeMessage severity="info" icon={<Info size={15} />}>
                        <strong>Requisito de preaviso:</strong> Presentar carta de renuncia con 15 días de anticipación (operativos) o 30 días (jefaturas o técnicos especializados).
                      </PrimeMessage>
                    </>
                  )}
                </div>
              )}

              {motivo === 'despido_injustificado' && (
                <div className="space-y-2">
                  <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                    <strong>SÍ aplica indemnización completa (Art. 58 CT):</strong> 30 días de salario básico por año de servicio y proporcional, con garantía mínima de 15 días y tope de 4 salarios mínimos mensuales.
                  </PrimeMessage>
                  <PrimeMessage severity="info" icon={<Info size={15} />}>
                    <strong>SÍ aplican prestaciones acumuladas:</strong> Vacación y aguinaldo proporcionales más días adeudados. La indemnización está exenta de ISR, ISSS y AFP.
                  </PrimeMessage>
                </div>
              )}

              {motivo === 'despido_justificado' && (
                <div className="space-y-2">
                  <PrimeMessage severity="danger" icon={<XCircle size={15} />}>
                    <strong>NO aplica indemnización por despido ($0.00):</strong> Al existir causal grave según el Art. 50 del Código de Trabajo.
                  </PrimeMessage>
                  <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                    <strong>SÍ aplican prestaciones acumuladas:</strong> Vacación proporcional, aguinaldo proporcional y días trabajados pendientes.
                  </PrimeMessage>
                </div>
              )}

              {motivo === 'liquidacion_anual' && (
                <div className="space-y-2">
                  <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                    <strong>SÍ aplica 1 mes completo de salario ({formatUSD(salary)}):</strong> Pago convenido para saldar el pasivo laboral anual, junto con vacación anual (15d + 30%) y aguinaldo completo.
                  </PrimeMessage>
                </div>
              )}

              {motivo === 'despido_indirecto' && (
                <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                  <strong>SÍ aplica indemnización de 30 días/año (Art. 53 y 58 CT):</strong> Por falta patronal grave (impago, acoso o rebaja salarial) más el 100% de prestaciones acumuladas.
                </PrimeMessage>
              )}

              {motivo === 'mutuo_acuerdo' && (
                <PrimeMessage severity="info" icon={<CheckCircle2 size={15} />}>
                  <strong>SÍ aplica la indemnización convenida ({pactoPorcentaje}%):</strong> Más el 100% de prestaciones acumuladas. Debe formalizarse ante el MTPS o acta notarial.
                </PrimeMessage>
              )}

              {motivo === 'fin_contrato' && (
                <div className="space-y-2">
                  <PrimeMessage severity="warning" icon={<XCircle size={15} />}>
                    <strong>NO aplica indemnización ($0.00):</strong> Al finalizar el plazo pactado en contrato por tiempo determinado.
                  </PrimeMessage>
                  <PrimeMessage severity="success" icon={<CheckCircle2 size={15} />}>
                    <strong>SÍ aplican las prestaciones proporcionales:</strong> Calculadas sobre el tiempo laborado durante el contrato.
                  </PrimeMessage>
                </div>
              )}
            </div>

            {/* Bloque 1: Indemnización */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <ShieldCheck size={16} className="text-[var(--color-accent)]" />
                  <span>1. Compensación o Indemnización</span>
                </h6>
                <span className="font-bold font-mono text-[var(--color-accent)] text-sm">
                  {formatUSD(result.indemnizacion.amount)}
                </span>
              </div>

              <div className="surface-well p-3.5 space-y-2.5">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-[var(--color-rule)]">
                  <span className="text-xs text-[var(--color-muted)]">
                    ¿Aplica indemnización en este caso?
                  </span>
                  <PrimeTag severity={result.indemnizacion.applies ? 'success' : 'neutral'}>
                    {result.indemnizacion.applies ? 'Sí aplica por ley' : 'No aplica indemnización'}
                  </PrimeTag>
                </div>

                <p className="text-xs text-[var(--color-ink)] m-0">{result.indemnizacion.explanation}</p>

                {result.indemnizacion.applies && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--color-rule)] text-[11px]">
                    <div>
                      <span className="text-[var(--color-muted)] block">Días computados</span>
                      <strong className="font-mono text-[var(--color-ink)]">
                        {result.indemnizacion.daysComputed} días
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted)] block">Salario base usado</span>
                      <strong className="font-mono text-[var(--color-ink)]">
                        {formatUSD(result.indemnizacion.baseMonthlySalary)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted)] block">Tope legal sector</span>
                      <strong className="font-mono text-[var(--color-ink)]">
                        {result.indemnizacion.monthlyCap > 0 ? formatUSD(result.indemnizacion.monthlyCap) : 'Sin tope'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted)] block">¿Aplica tope?</span>
                      <strong className={result.indemnizacion.isCapped ? 'text-[var(--color-amber)]' : 'text-[var(--color-ink)]'}>
                        {result.indemnizacion.isCapped ? 'Sí (Topado)' : 'No (Real)'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloque 2: Prestaciones */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <DollarSign size={16} className="text-[var(--color-emerald)]" />
                  <span>2. Prestaciones Acumuladas de Ley</span>
                </h6>
                <span className="font-bold font-mono text-[var(--color-emerald)] text-sm">
                  {formatUSD(result.derechosAdquiridos.total)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="surface-well p-3 flex justify-between items-start gap-2">
                  <div>
                    <strong className="text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                      <Palmtree size={13} className="text-[var(--color-emerald)]" />
                      <span>
                        Vacación{' '}
                        {yaCobroVacacion
                          ? '(Ya gozada o pagada)'
                          : motivo === 'liquidacion_anual'
                            ? 'Anual completa de 15 días (+30% bono)'
                            : `${result.derechosAdquiridos.vacacionDays} días proporcionales (+30% bono)`}
                      </span>
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)] m-0 mt-0.5">
                      {yaCobroVacacion
                        ? 'Marcado como ya cancelado o gozado ($0.00).'
                        : motivo === 'liquidacion_anual'
                          ? `15 días de salario ($${(salary / 2).toFixed(2)}) + 30% bono ($${(salary * 0.15).toFixed(2)})`
                          : `Acumulada desde tu último aniversario (${result.derechosAdquiridos.vacacionDaysInPeriod} días).`}
                    </p>
                  </div>
                  <span
                    className={`font-bold font-mono text-sm shrink-0 ${
                      yaCobroVacacion ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
                    }`}
                  >
                    {formatUSD(result.derechosAdquiridos.vacacionTotal)}
                  </span>
                </div>

                <div className="surface-well p-3 flex justify-between items-start gap-2">
                  <div>
                    <strong className="text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                      <Gift size={13} className="text-[var(--color-amber)]" />
                      <span>
                        Aguinaldo de ley{' '}
                        {yaCobroAguinaldo
                          ? '(Ya pagado)'
                          : `(${result.derechosAdquiridos.aguinaldoSeniorityDays} días de base por antigüedad)`}
                      </span>
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)] m-0 mt-0.5">
                      {yaCobroAguinaldo
                        ? 'Marcado como ya cancelado ($0.00).'
                        : motivo === 'liquidacion_anual'
                          ? `Aguinaldo completo de fin de año (${result.derechosAdquiridos.aguinaldoSeniorityDays} días).`
                          : `Proporcional desde el 12 de diciembre (${result.derechosAdquiridos.aguinaldoDaysInPeriod} días).`}
                    </p>
                  </div>
                  <span
                    className={`font-bold font-mono text-sm shrink-0 ${
                      yaCobroAguinaldo ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
                    }`}
                  >
                    {formatUSD(result.derechosAdquiridos.aguinaldoAmount)}
                  </span>
                </div>

                {result.derechosAdquiridos.quincena25Applies && (
                  <div className="p-3 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 flex justify-between items-start gap-2">
                    <div>
                      <strong className="text-xs text-[var(--color-accent)] flex items-center gap-1.5">
                        <Star size={13} />
                        <span>Quincena 25 (Decreto Legislativo N.º 499)</span>
                      </strong>
                      <p className="text-[11px] text-[var(--color-muted)] m-0 mt-0.5">
                        1 quincena completa ({formatUSD(salary / 2)}), 100% libre de Renta, ISSS y AFP.
                      </p>
                    </div>
                    <span className="font-bold font-mono text-sm text-[var(--color-accent)] shrink-0">
                      {formatUSD(result.derechosAdquiridos.quincena25Amount)}
                    </span>
                  </div>
                )}

                <div className="surface-well p-3 flex justify-between items-start gap-2">
                  <div>
                    <strong className="text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                      <Briefcase size={13} className="text-[var(--color-muted)]" />
                      <span>Días de salario trabajados pendientes de cobro</span>
                    </strong>
                    <p className="text-[11px] text-[var(--color-muted)] m-0 mt-0.5">
                      {result.derechosAdquiridos.salarioPendienteDias > 0
                        ? `${result.derechosAdquiridos.salarioPendienteDias} días trabajados pendientes en la quincena actual.`
                        : 'Al día con pagos ordinarios (0 días adeudados).'}
                    </p>
                  </div>
                  <span className="font-bold font-mono text-sm text-[var(--color-ink)] shrink-0">
                    {formatUSD(result.derechosAdquiridos.salarioPendienteAmount)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-emerald-soft)] border border-[var(--color-emerald)]/30 flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--color-ink)]">
                  Subtotal Prestaciones de Ley:
                </span>
                <strong className="font-mono text-[var(--color-emerald)] text-sm">
                  {formatUSD(result.derechosAdquiridos.total)}
                </strong>
              </div>
            </div>

            {/* Fundamentos Legales */}
            <div className="pt-3 border-t border-[var(--color-rule)]">
              <PrimeButton
                variant="ghost"
                size="xs"
                className="px-0"
                onClick={() => setShowLegalDetails(!showLegalDetails)}
              >
                <FileText size={13} className="text-[var(--color-accent)]" />
                <span>
                  {showLegalDetails
                    ? 'Ocultar base jurídica y artículos de ley'
                    : 'Ver base jurídica oficial del MTPS y Código de Trabajo'}
                </span>
                {showLegalDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </PrimeButton>

              {showLegalDetails && (
                <div className="surface-well p-3.5 mt-2 space-y-2.5">
                  <h6 className="text-xs font-bold text-[var(--color-ink)] m-0">
                    Artículos y Decretos Oficiales Aplicados
                  </h6>
                  <div className="flex flex-wrap gap-1.5">
                    {result.legalArticles.map((art) => (
                      <PrimeTag key={art} severity="neutral">{art}</PrimeTag>
                    ))}
                  </div>
                  <ul className="text-[11px] text-[var(--color-muted)] pl-4 m-0 space-y-1 list-disc">
                    {result.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                    <li>
                      Cálculo alineado con los procedimientos de la Dirección General de Inspección de Trabajo del MTPS en El Salvador.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </PrimeCard>
      </div>
    </motion.div>
  );
}

export default LiquidacionView;
