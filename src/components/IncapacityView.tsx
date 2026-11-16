import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Building2,
  Calendar,
  CalendarDays,
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
  calcIncapacitySplitQuincenas,
  type IncapacityType,
  RATES,
} from '../lib/svLaborLaw';
import {
  PrimeButton,
  PrimeCard,
  PrimeInput,
  PrimeMessage,
  PrimeSelectButton,
  PrimeSwitch,
  PrimeTag,
} from './ui/PrimeUI.tsx';

interface IncapacityViewProps {
  monthlySalary: number;
  formatUSD: (amount: number) => string;
}

export function IncapacityView({ monthlySalary, formatUSD }: IncapacityViewProps) {
  const [calculationMode, setCalculationMode] = useState<'single' | 'split'>('single');
  const [incapacityType, setIncapacityType] = useState<IncapacityType>('common_illness');
  const [daysInput, setDaysInput] = useState<number>(5);
  const [q1Days, setQ1Days] = useState<number>(4);
  const [q2Days, setQ2Days] = useState<number>(6);
  const [employerPays100FirstDays, setEmployerPays100FirstDays] = useState<boolean>(true);

  const [useDateHelper, setUseDateHelper] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-11`;
  });
  const [totalReposoDays, setTotalReposoDays] = useState<number>(10);

  const handleApplyDateHelper = () => {
    if (!startDate || totalReposoDays <= 0) return;
    const parts = startDate.split('-');
    if (parts.length < 3) return;
    const day = parseInt(parts[2], 10);
    let q1 = 0;
    let q2 = 0;
    if (day <= 15) {
      q1 = Math.min(totalReposoDays, 15 - day + 1);
      q2 = Math.min(15, totalReposoDays - q1);
    } else {
      q1 = Math.min(totalReposoDays, 30 - day + 1);
      q2 = Math.min(15, totalReposoDays - q1);
    }
    setQ1Days(q1);
    setQ2Days(q2);
  };

  const result = useMemo(() => {
    return calcIncapacity({
      monthlySalary,
      days: daysInput,
      type: incapacityType,
      employerPays100FirstDays,
    });
  }, [monthlySalary, daysInput, incapacityType, employerPays100FirstDays]);

  const splitResult = useMemo(() => {
    return calcIncapacitySplitQuincenas({
      monthlySalary,
      type: incapacityType,
      q1IncapacityDays: q1Days,
      q2IncapacityDays: q2Days,
      employerPays100FirstDays,
    });
  }, [monthlySalary, incapacityType, q1Days, q2Days, employerPays100FirstDays]);

  const presetDays = [
    { label: '3 días', days: 3 },
    { label: '5 días', days: 5 },
    { label: '7 días', days: 7 },
    { label: '15 días', days: 15 },
    { label: '30 días', days: 30 },
  ];

  const renderSplitCard = (
    title: string,
    qData: typeof splitResult.q1,
    emptySubsidioText: string
  ) => (
    <div className="p-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] flex flex-col justify-between gap-3">
      <div>
        <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-[var(--color-rule)]">
          <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
            <Building2 size={15} className="text-[var(--color-accent)]" />
            <span>{title}</span>
          </span>
          <PrimeTag severity="info" className="font-mono">
            {qData.workedDays}d trab · {qData.incapacityDays}d reposo
          </PrimeTag>
        </div>

        <div className="surface-well p-3 mb-3">
          <span className="text-[11px] text-[var(--color-muted)] block">Total en tu bolsillo:</span>
          <span className="text-lg font-bold font-mono text-[var(--color-emerald)]">
            {formatUSD(qData.totalPocketPay)}
          </span>
          <span className="text-[11px] text-[var(--color-muted)] block mt-0.5">
            Normal: {formatUSD(qData.normalBiweeklyNetPay)} (
            {qData.pocketDifference > 0 ? `-${formatUSD(qData.pocketDifference)}` : '$0.00'})
          </span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="surface-well p-2.5">
            <div className="flex justify-between items-baseline mb-1">
              <strong className="text-[var(--color-ink)]">1. Pago de Empresa (Planilla):</strong>
              <span className="font-mono font-bold text-[var(--color-ink)]">
                {formatUSD(qData.employerNetPay)}
              </span>
            </div>
            <ul className="list-none p-0 m-0 text-[var(--color-muted)] space-y-0.5 font-mono">
              <li className="flex justify-between">
                <span>• Días trabajados ({qData.workedDays}d):</span>
                <span>{formatUSD(qData.workedGrossPay)}</span>
              </li>
              <li className="flex justify-between">
                <span>• Carencia empresa ({qData.employerIncapacityDays}d):</span>
                <span>{formatUSD(qData.employerIncapacityGrossPay)}</span>
              </li>
              <li className="flex justify-between text-[var(--color-danger)]">
                <span>• Descuentos ley (AFP/ISSS/Renta):</span>
                <span>-{formatUSD(qData.totalEmployeeDeductions)}</span>
              </li>
            </ul>
            {qData.employerDiscountAmount > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-[var(--color-rule)] text-[var(--color-muted)] text-[10.5px]">
                Descuento en colilla: <strong>-{formatUSD(qData.employerDiscountAmount)}</strong> ({qData.isssIncapacityDays}d no pagados por empresa).
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--color-emerald-soft)] border border-[var(--color-emerald)]/25">
            <div className="flex justify-between items-baseline mb-0.5">
              <strong className="text-[var(--color-emerald)]">2. Subsidio del ISSS:</strong>
              <span className="font-mono font-bold text-[var(--color-emerald)]">
                {formatUSD(qData.isssTotalSubsidio)}
              </span>
            </div>
            <span className="text-[var(--color-ink-2)] block text-[10.5px]">
              {qData.isssIncapacityDays > 0
                ? `${qData.isssIncapacityDays} día(s) al 75% (${formatUSD(qData.isssDailySubsidio)}/d). 0% retenciones.`
                : emptySubsidioText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      key="tab-incapacity"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Encabezado Principal */}
      <PrimeCard padded>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <PrimeTag severity="info" className="font-mono">ISSS y Código de Trabajo</PrimeTag>
              <PrimeTag severity="neutral" className="font-mono">
                Tope ISSS: {formatUSD(RATES.ISSS_CAP_MONTHLY)}/mes
              </PrimeTag>
            </div>
            <h5 className="text-base font-bold text-[var(--color-ink)] mb-1">
              Guía y Calculadora de Incapacidades Médicas
            </h5>
            <p className="text-[var(--color-muted)] text-xs m-0 max-w-[680px]">
              Conoce quién asume el pago de tu salario (patrono o seguro social), los porcentajes de subsidio y el monto exacto en una sola quincena o dividido entre dos quincenas consecutivas.
            </p>
          </div>

          <div className="surface-well px-3.5 py-2.5 w-full sm:w-auto text-left sm:text-right">
            <span className="text-[11px] text-[var(--color-muted)] block">
              Salario base de referencia
            </span>
            <span className="font-bold font-mono text-lg text-[var(--color-ink)]">
              {formatUSD(monthlySalary)}
            </span>
            <span className="text-[11px] text-[var(--color-muted)] block font-mono">
              Diario: {formatUSD(result.dailyRealSalary)} / día
            </span>
          </div>
        </div>
      </PrimeCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Panel Izquierdo */}
        <PrimeCard padded className="lg:col-span-5 space-y-4">
          <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
            <Activity size={16} className="text-[var(--color-accent)] shrink-0" />
            <span>Detalles de la Incapacidad</span>
          </h6>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1.5">
              Período afectado
            </label>
            <PrimeSelectButton
              fullWidth
              value={calculationMode}
              onChange={setCalculationMode}
              options={[
                { value: 'single', label: 'Una sola quincena' },
                {
                  value: 'split',
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <ArrowRightLeft size={12} />
                      <span>Cruza 2 quincenas</span>
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1.5">
              Tipo de incapacidad
            </label>
            <div className="flex flex-col gap-2">
              {[
                {
                  id: 'common_illness' as const,
                  icon: Activity,
                  title: 'Enfermedad o Accidente Común',
                  desc: 'Días 1 a 3 a cargo del patrono (75%). Día 4 en adelante subsidiado por el ISSS (75%).',
                  onSelect: () => {
                    setIncapacityType('common_illness');
                    if (daysInput > 60) setDaysInput(5);
                  },
                },
                {
                  id: 'work_accident' as const,
                  icon: ShieldAlert,
                  title: 'Accidente de Trabajo / Riesgo Profesional',
                  desc: 'Cubierto por el ISSS desde el 1.er día al 75% sin período de espera ni carencia.',
                  onSelect: () => {
                    setIncapacityType('work_accident');
                    if (daysInput > 60) setDaysInput(5);
                  },
                },
                {
                  id: 'maternity' as const,
                  icon: Calendar,
                  title: 'Maternidad (Pre y Post Natal)',
                  desc: '16 semanas (112 días continuos) cubiertas al 100% por el ISSS (tope $1,000/mes).',
                  onSelect: () => {
                    setIncapacityType('maternity');
                    setDaysInput(112);
                  },
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = incapacityType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors duration-150 ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]'
                        : 'border-[var(--color-rule)] bg-[var(--color-card)] text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 mt-0.5 ${active ? 'text-[var(--color-accent)]' : ''}`} />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block text-xs text-[var(--color-ink)]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)] block mt-0.5 leading-snug">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {calculationMode === 'single' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="incapacity-days-input" className="font-medium text-[var(--color-ink-2)]">
                  Días de reposo prescritos
                </label>
                <span className="font-mono font-bold text-[var(--color-ink)]">{daysInput} día(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <PrimeInput
                  id="incapacity-days-input"
                  type="number"
                  mono
                  min="1"
                  max="365"
                  value={daysInput}
                  onChange={(e) => setDaysInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="font-bold"
                />
                <span className="text-xs text-[var(--color-muted)] shrink-0">días</span>
              </div>

              {incapacityType !== 'maternity' ? (
                <div className="flex flex-wrap gap-1.5">
                  {presetDays.map((p) => (
                    <PrimeButton
                      key={p.days}
                      size="xs"
                      variant={daysInput === p.days ? 'primary' : 'outline'}
                      className="font-mono"
                      onClick={() => setDaysInput(p.days)}
                    >
                      {p.label}
                    </PrimeButton>
                  ))}
                </div>
              ) : (
                <PrimeButton
                  size="xs"
                  variant="outline"
                  className="font-mono"
                  onClick={() => setDaysInput(112)}
                >
                  112 días (16 semanas de Ley)
                </PrimeButton>
              )}
            </div>
          ) : (
            <div className="surface-well p-3.5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-[var(--color-accent)]" />
                  <span>Días por quincena</span>
                </span>
                <PrimeTag severity="info" className="font-mono">
                  Total: {q1Days + q2Days} días
                </PrimeTag>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label htmlFor="q1-days-input" className="font-medium text-[var(--color-ink)]">
                    1.ª Quincena (Días 1 al 15 o corte inicial)
                  </label>
                  <span className="text-[var(--color-muted)] font-mono text-[11px]">
                    {15 - q1Days}d trabajados
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <PrimeInput
                    id="q1-days-input"
                    type="number"
                    inputSize="sm"
                    mono
                    min="0"
                    max="15"
                    value={q1Days}
                    onChange={(e) => setQ1Days(Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)))}
                    className="font-bold"
                  />
                  <span className="text-[11px] text-[var(--color-muted)] shrink-0">días reposo</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[2, 3, 4, 5, 7].map((d) => (
                    <PrimeButton
                      key={d}
                      size="xs"
                      variant={q1Days === d ? 'primary' : 'outline'}
                      className="font-mono"
                      onClick={() => setQ1Days(d)}
                    >
                      {d}d
                    </PrimeButton>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label htmlFor="q2-days-input" className="font-medium text-[var(--color-ink)]">
                    2.ª Quincena (Días 16 al 30 o corte siguiente)
                  </label>
                  <span className="text-[var(--color-muted)] font-mono text-[11px]">
                    {15 - q2Days}d trabajados
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <PrimeInput
                    id="q2-days-input"
                    type="number"
                    inputSize="sm"
                    mono
                    min="0"
                    max="15"
                    value={q2Days}
                    onChange={(e) => setQ2Days(Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)))}
                    className="font-bold"
                  />
                  <span className="text-[11px] text-[var(--color-muted)] shrink-0">días reposo</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[3, 5, 6, 7, 10].map((d) => (
                    <PrimeButton
                      key={d}
                      size="xs"
                      variant={q2Days === d ? 'primary' : 'outline'}
                      className="font-mono"
                      onClick={() => setQ2Days(d)}
                    >
                      {d}d
                    </PrimeButton>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-rule)]">
                <PrimeButton
                  variant="ghost"
                  size="xs"
                  className="text-[var(--color-accent)] px-0"
                  onClick={() => setUseDateHelper(!useDateHelper)}
                >
                  <Clock size={12} />
                  <span>
                    {useDateHelper ? 'Ocultar asistente por fecha' : 'Calcular días según fecha de boleta'}
                  </span>
                </PrimeButton>

                {useDateHelper && (
                  <div className="mt-2 p-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card)] space-y-2">
                    <div>
                      <label htmlFor="date-helper-start" className="block text-[11px] text-[var(--color-muted)] mb-1">
                        Fecha de inicio del reposo médico
                      </label>
                      <PrimeInput
                        id="date-helper-start"
                        type="date"
                        inputSize="sm"
                        mono
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="date-helper-total" className="block text-[11px] text-[var(--color-muted)] mb-1">
                        Total de días de reposo prescritos
                      </label>
                      <PrimeInput
                        id="date-helper-total"
                        type="number"
                        inputSize="sm"
                        mono
                        min="1"
                        max="30"
                        value={totalReposoDays}
                        onChange={(e) => setTotalReposoDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>
                    <PrimeButton variant="primary" size="xs" fullWidth onClick={handleApplyDateHelper}>
                      Distribuir automáticamente en Q1 y Q2
                    </PrimeButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {incapacityType === 'common_illness' && (
            <div className="surface-well p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="switch-employer-100" className="text-xs font-semibold text-[var(--color-ink)] cursor-pointer">
                  Mi empresa cubre el 100% de los primeros 3 días
                </label>
                <PrimeSwitch
                  id="switch-employer-100"
                  checked={employerPays100FirstDays}
                  onChange={setEmployerPays100FirstDays}
                />
              </div>
              <span className="text-[11px] text-[var(--color-muted)] block">
                El Art. 307 del Código de Trabajo obliga al 75%. Algunas empresas conceden el 100%.
              </span>
            </div>
          )}
        </PrimeCard>

        {/* Panel Derecho */}
        <PrimeCard padded className="lg:col-span-7 space-y-4">
          {calculationMode === 'single' ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <Wallet size={16} className="text-[var(--color-emerald)] shrink-0" />
                  <span>Liquidación Estimada del Período</span>
                </h6>
                <PrimeTag severity="neutral" className="font-mono">
                  Total {result.totalDays} día(s)
                </PrimeTag>
              </div>

              <div className="surface-well p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
                  <div>
                    <span className="font-bold text-sm text-[var(--color-ink)] block">
                      Dinero total que llegará a tu bolsillo:
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      Suma de lo que paga tu empresa más lo que deposita el Seguro Social
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[var(--color-emerald)] shrink-0">
                    {formatUSD(result.totalIncapacityPay)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-[var(--color-muted)] pt-2.5 border-t border-[var(--color-rule)]">
                  <span>Lo que habrías cobrado trabajando normal:</span>
                  <span className="font-mono font-semibold text-[var(--color-ink)]">
                    {formatUSD(result.regularEquivalentGross)}
                  </span>
                </div>

                {result.wageLoss > 0 && (
                  <div className="pt-2 border-t border-[var(--color-rule)]">
                    <div className="flex justify-between items-center text-xs text-[var(--color-danger)]">
                      <span className="font-semibold">Lo que dejas de ganar (no cubierto por ley):</span>
                      <span className="font-mono font-bold">-{formatUSD(result.wageLoss)}</span>
                    </div>
                    <span className="text-[var(--color-muted)] text-[11px] block mt-0.5">
                      A partir del 4.º día, el ISSS cubre el 75% de cada día; el 25% restante no está cubierto.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                        <Building2 size={14} className="text-[var(--color-muted)] shrink-0" />
                        <span>1. Te paga tu Empresa</span>
                      </span>
                      <PrimeTag severity="neutral" className="font-mono">{result.employerDays} día(s)</PrimeTag>
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--color-ink)]">
                      {formatUSD(result.employerTotalPay)}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--color-rule)] text-[11px] text-[var(--color-muted)] space-y-1">
                    {result.employerDays > 0 ? (
                      <>
                        <div className="text-[var(--color-ink)]">
                          <strong>{formatUSD(result.employerDailyAmount)}</strong> por día ({(result.employerRate * 100).toFixed(0)}%).
                        </div>
                        <div>En tu recibo quincenal con deducciones normales (AFP, ISSS y Renta).</div>
                      </>
                    ) : (
                      <span>El pago corre por cuenta del Seguro Social desde el día 1.</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[var(--color-accent)] shrink-0" />
                        <span>2. Te paga el Seguro (ISSS)</span>
                      </span>
                      <PrimeTag severity="info" className="font-mono">{result.isssDays} día(s)</PrimeTag>
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--color-accent)]">
                      {formatUSD(result.isssTotalSubsidio)}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--color-rule)] text-[11px] space-y-1">
                    {result.isssDays > 0 ? (
                      <>
                        <div className="text-[var(--color-ink)]">
                          <strong>{formatUSD(result.isssDailySubsidio)}</strong> por día ({(result.isssRate * 100).toFixed(0)}%).
                        </div>
                        <div className="text-[var(--color-emerald)] font-semibold">
                          Sin descuentos: {formatUSD(result.isssTotalSubsidio)} limpios (0% AFP, ISSS, Renta).
                        </div>
                      </>
                    ) : (
                      <span className="text-[var(--color-muted)]">
                        El ISSS no paga incapacidades de 3 días o menos (período de espera).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result.isSalaryCappedByISSS && result.isssDays > 0 && (
                <PrimeMessage severity="warning" icon={<AlertCircle size={16} />}>
                  <strong>Tope salarial ISSS ({formatUSD(RATES.ISSS_CAP_MONTHLY)}/mes):</strong> Tu salario diario es {formatUSD(result.dailyRealSalary)}, pero el Seguro calcula el 75% sobre el tope de $33.33/día, pagando un máximo de {formatUSD(result.maxDailySubsidioCap)}/día.
                </PrimeMessage>
              )}

              <div className="surface-well p-3.5">
                <span className="text-xs font-semibold text-[var(--color-ink)] block mb-2">
                  Resumen de descuentos por pagador
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11.5px] min-w-[460px]">
                    <thead>
                      <tr className="border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                        <th className="py-2 pr-2 font-medium">Pagador</th>
                        <th className="py-2 px-2 text-center font-medium">AFP</th>
                        <th className="py-2 px-2 text-center font-medium">ISSS</th>
                        <th className="py-2 px-2 text-center font-medium">Renta</th>
                        <th className="py-2 pl-2 text-right font-medium">Entrega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-rule)]">
                      <tr>
                        <td className="py-2 pr-2 font-semibold text-[var(--color-ink)]">
                          Tu Empresa (Días 1 a 3)
                        </td>
                        <td className="py-2 px-2 text-center text-[var(--color-muted)]">-7.25%</td>
                        <td className="py-2 px-2 text-center text-[var(--color-muted)]">-3.00%</td>
                        <td className="py-2 px-2 text-center text-[var(--color-muted)]">Según tabla</td>
                        <td className="py-2 pl-2 text-right font-mono text-[var(--color-ink)]">
                          Quincena normal
                        </td>
                      </tr>
                      <tr className="bg-[var(--color-emerald-soft)]">
                        <td className="py-2 pr-2 font-bold text-[var(--color-emerald)] flex items-center gap-1">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>ISSS (Día 4+)</span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[var(--color-emerald)]">0%</td>
                        <td className="py-2 px-2 text-center font-bold text-[var(--color-emerald)]">0%</td>
                        <td className="py-2 px-2 text-center font-bold text-[var(--color-emerald)]">0%</td>
                        <td className="py-2 pl-2 text-right font-mono font-bold text-[var(--color-emerald)]">
                          {formatUSD(result.isssTotalSubsidio)} limpio
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <Wallet size={16} className="text-[var(--color-emerald)] shrink-0" />
                  <span>Liquidación de Incapacidad en Dos Quincenas</span>
                </h6>
                <PrimeTag severity="info" className="font-mono">
                  Total: {splitResult.totalIncapacityDays} días de reposo
                </PrimeTag>
              </div>

              <div className="surface-well p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
                  <div>
                    <span className="font-bold text-sm text-[var(--color-ink)] block">
                      Total que llegará a tu bolsillo (2 Quincenas):
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      Suma neta acumulada de empresa e ISSS
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[var(--color-emerald)] shrink-0">
                    {formatUSD(splitResult.totalPocketPay)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-[var(--color-muted)] pt-2 border-t border-[var(--color-rule)]">
                  <span>Salario neto normal de dos quincenas:</span>
                  <span className="font-mono font-semibold text-[var(--color-ink)]">
                    {formatUSD(splitResult.normalTwoQuincenasNet)}
                  </span>
                </div>
                {splitResult.totalPocketLoss > 0 && (
                  <div className="flex justify-between items-center text-xs text-[var(--color-danger)] pt-2 border-t border-[var(--color-rule)]">
                    <span className="font-semibold">Pérdida neta de bolsillo acumulada:</span>
                    <span className="font-mono font-bold">-{formatUSD(splitResult.totalPocketLoss)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderSplitCard(
                  '1.ª Quincena Afectada',
                  splitResult.q1,
                  'No hay subsidio en Q1 porque el reposo cubrió solo carencia patronal.'
                )}
                {renderSplitCard('2.ª Quincena Afectada', splitResult.q2, 'No hay subsidio en Q2.')}
              </div>

              <div className="surface-well p-3 text-xs text-[var(--color-muted)]">
                <strong className="text-[var(--color-ink)] block mb-1">
                  ¿Por qué ves un descuento en tu colilla de pago?
                </strong>
                En cada quincena, la empresa descuenta de tu nómina los días que asume el Seguro Social para no duplicar el pago. Esos días los cobras directamente con el ISSS (100% libre de retenciones).
              </div>
            </>
          )}
        </PrimeCard>
      </div>

      {/* Guía Informativa */}
      <PrimeCard padded className="space-y-4">
        <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
          <Info size={16} className="text-[var(--color-accent)]" />
          <span>Información Clave de Trámites y Derechos Laborales</span>
        </h6>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="surface-well p-3.5">
            <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5 mb-1.5">
              <Clock size={13} className="text-[var(--color-muted)]" />
              <span>Requisitos de Cotización (Carencia)</span>
            </span>
            <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
              Para enfermedad común debes tener al menos <strong>6 meses de cotización</strong> en los últimos 12 meses. En accidentes de trabajo no se exige tiempo mínimo.
            </p>
          </div>

          <div className="surface-well p-3.5">
            <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5 mb-1.5">
              <FileText size={13} className="text-[var(--color-muted)]" />
              <span>Incapacidades de Médicos Privados</span>
            </span>
            <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
              Si consultaste con un médico particular, debes acudir al centro del ISSS más cercano a <strong>refrendar la incapacidad</strong> con constancia y recetas.
            </p>
          </div>

          <div className="surface-well p-3.5">
            <span className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5 mb-1.5">
              <HelpCircle size={13} className="text-[var(--color-muted)]" />
              <span>Modalidad de Cobro del Subsidio</span>
            </span>
            <p className="text-xs text-[var(--color-muted)] m-0 leading-relaxed">
              Registra tu cuenta bancaria en el portal en línea del ISSS para depósito directo o cóbralo con tu DUI vigente en bancos autorizados.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--color-accent)] shrink-0" />
            <h6 className="text-xs font-bold text-[var(--color-ink)] m-0">
              ¿Por qué el Seguro Social retiene tu subsidio? (Planilla presentada vs. pagada)
            </h6>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--color-muted)]">
            <div className="space-y-2">
              <strong className="text-[var(--color-ink)] block">
                1. Planilla presentada en OVISSS no equivale a planilla pagada
              </strong>
              <p className="m-0 leading-relaxed">
                Si la empresa cargó la nómina pero no liquidó el NPE en el banco, el ISSS registra mora y congela el trámite. Tarda 24 a 72 horas hábiles tras la conciliación bancaria.
              </p>
              <div className="surface-well p-2.5 text-[var(--color-ink-2)]">
                <strong>Qué pedir:</strong> Comprobante bancario del NPE del mes o captura con estado «Pagada» en OVISSS.
              </div>
            </div>

            <div className="space-y-2">
              <strong className="text-[var(--color-ink)] block">
                2. Responsabilidad legal patronal (Art. 53 Ley del Seguro Social)
              </strong>
              <p className="m-0 leading-relaxed">
                Si el trabajador pierde prestaciones por mora patronal, <strong>el patrono está obligado a pagar directamente el 100% del subsidio</strong>.
              </p>
              <div className="surface-well p-2.5 text-[var(--color-ink-2)]">
                <strong>Plazo de cobro:</strong> Tienes hasta <strong>1 año</strong> desde cada día de reposo antes de que prescriba.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--color-rule)] text-[11px] text-[var(--color-muted)]">
            <div className="flex flex-wrap items-center gap-3">
              <span><strong>Canales ISSS:</strong></span>
              <span>Call Center: <strong className="text-[var(--color-ink)]">127</strong></span>
              <span>Correo: <strong className="text-[var(--color-ink)] font-mono">secre.subsidios@isss.gob.sv</strong></span>
            </div>
            <a
              href="https://portal.isss.gob.sv"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <PrimeButton variant="primary" size="xs">
                <span>Consultar trámite en portal ISSS con DUI</span>
                <ExternalLink size={12} />
              </PrimeButton>
            </a>
          </div>
        </div>
      </PrimeCard>
    </motion.div>
  );
}
