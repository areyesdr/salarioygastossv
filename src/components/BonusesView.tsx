import { motion } from 'motion/react';
import { Calendar, Gift, Plane, Check } from 'lucide-react';
import {
  RATES,
  round2,
  calcDaysBetweenInclusive,
  type VacationCalculationResult,
  type AguinaldoCalculationResult,
  type Quincena25CalculationResult,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
  type SeniorityCalculationResult,
} from '../lib/svLaborLaw.ts';

interface BonusesViewProps {
  monthlySalary: number;
  monthlyNetPay: number;
  biweeklyNetPay: number;
  totalAnnualNetBonuses: number;
  quincena25Result: Quincena25CalculationResult;
  vacationResult: VacationCalculationResult;
  aguinaldoResult: AguinaldoCalculationResult;
  q25FullYear: boolean;
  setQ25FullYear: (v: boolean) => void;
  q25DaysWorked: number;
  setQ25DaysWorked: (v: number) => void;
  q25HireDate: string;
  setQ25HireDate: (v: string) => void;
  q25VoluntaryAboveCap: boolean;
  setQ25VoluntaryAboveCap: (v: boolean) => void;
  seniority: SeniorityBracket;
  setSeniority: (v: SeniorityBracket) => void;
  aguinaldoDaysUnder1: number;
  setAguinaldoDaysUnder1: (v: number) => void;
  aguinaldoHireDate: string;
  setAguinaldoHireDate: (v: string) => void;
  aguinaldoExemptionRule: AguinaldoExemptionRule;
  setAguinaldoExemptionRule: (v: AguinaldoExemptionRule) => void;
  vacationSector: 'privado' | 'publico';
  setVacationSector: (v: 'privado' | 'publico') => void;
  vacationBonusPct: number;
  setVacationBonusPct: (v: number) => void;
  vacationMode: 'bonus_only' | 'full_advance';
  setVacationMode: (v: 'bonus_only' | 'full_advance') => void;
  splitDays: [number, number, number];
  setSplitDays: (v: [number, number, number]) => void;
  formatUSD: (val: number) => string;
  hireDate?: string;
  onHireDateChange?: (v: string) => void;
  seniorityDetails?: SeniorityCalculationResult;
}

export function BonusesView({
  monthlySalary,
  monthlyNetPay,
  biweeklyNetPay: _biweeklyNetPay,
  totalAnnualNetBonuses,
  quincena25Result,
  vacationResult,
  aguinaldoResult,
  q25FullYear,
  setQ25FullYear,
  q25DaysWorked,
  setQ25DaysWorked,
  q25HireDate,
  setQ25HireDate,
  q25VoluntaryAboveCap,
  setQ25VoluntaryAboveCap,
  seniority,
  setSeniority,
  aguinaldoDaysUnder1,
  setAguinaldoDaysUnder1,
  aguinaldoHireDate,
  setAguinaldoHireDate,
  aguinaldoExemptionRule: _aguinaldoExemptionRule,
  setAguinaldoExemptionRule: _setAguinaldoExemptionRule,
  vacationSector,
  setVacationSector,
  vacationBonusPct: _vacationBonusPct,
  setVacationBonusPct: _setVacationBonusPct,
  vacationMode,
  setVacationMode,
  splitDays,
  setSplitDays,
  formatUSD,
  hireDate,
  onHireDateChange,
  seniorityDetails,
}: BonusesViewProps) {
  return (
    <motion.div
      key="tab-bonuses"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      {/* Banner de Sincronización: Fecha de Inicio de Labores y Antigüedad */}
      <div className="card-soft p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <Calendar size={18} className="text-secondary" />
          <div>
            <span className="fw-semibold text-slate-dark d-block" style={{ fontSize: '13px' }}>
              Fecha de Inicio de Labores
            </span>
            <span className="text-muted small" style={{ fontSize: '12px' }}>
              Define automáticamente tu antigüedad acumulada y los tramos de Aguinaldo y Quincena 25.
            </span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            type="date"
            value={hireDate || ''}
            onChange={(e) => onHireDateChange?.(e.target.value)}
            className="form-control form-control-sm font-monospace fw-semibold"
            style={{ width: '160px' }}
          />
          {seniorityDetails && (
            <span className="badge-subtle font-monospace py-1.5 px-2.5">
              Antigüedad: {seniorityDetails.formattedSeniority}
            </span>
          )}
        </div>
      </div>

      {/* Resumen Anual de Prestaciones */}
      <div className="card-soft mb-4">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
              <Calendar size={17} className="text-secondary" />
              <span>Calendario Anual de Prestaciones y Bonos de Ley</span>
            </h6>
            <span className="small text-muted" style={{ fontSize: '12px' }}>
              Ingresos extraordinarios estipulados por la legislación laboral de El Salvador
            </span>
          </div>
          <div className="badge-emerald py-1 px-3 d-inline-flex align-items-center gap-1.5 flex-shrink-0">
            <span className="small opacity-75">Total Anual Neto:</span>
            <strong className="font-monospace fs-6">
              +{formatUSD(totalAnnualNetBonuses)}
            </strong>
          </div>
        </div>

        <div className="p-3">
          <div className="row g-3">
            {/* Hito 1: Quincena 25 */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded border bg-slate-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-emerald-subtle text-emerald border border-emerald-subtle font-monospace" style={{ fontSize: '10px' }}>
                      Pago: 15 – 25 Enero
                    </span>
                    <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                      Decreto 499
                    </span>
                  </div>
                  <h6 className="fw-semibold text-slate-dark mb-1">Quincena 25 (Bono de Enero)</h6>
                  <p className="text-muted small mb-2 font-sans" style={{ fontSize: '12px' }}>
                    Medio sueldo adicional (50%). <strong>Te llega 100% limpio</strong> (la ley prohíbe descontarte AFP, ISSS o Renta).
                  </p>
                </div>
                <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                  <span className="small text-muted" style={{ fontSize: '12px' }}>En tu bolsillo:</span>
                  <span className="fs-5 fw-bold font-monospace text-emerald">
                    +{formatUSD(quincena25Result.netQuincena25)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hito 2: Vacación 30% */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded border bg-slate-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace" style={{ fontSize: '10px' }}>
                      Al cumplir cada año
                    </span>
                    <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                      Art. 177 C.T.
                    </span>
                  </div>
                  <h6 className="fw-semibold text-slate-dark mb-1">Vacación (15 días + 30% Extra)</h6>
                  <p className="text-muted small mb-2 font-sans" style={{ fontSize: '12px' }}>
                    15 días continuos de descanso pagado más un <strong>30% de regalo de ley</strong> sobre esa quincena (lleva descuentos normales).
                  </p>
                </div>
                <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                  <span className="small text-muted" style={{ fontSize: '12px' }}>Solo el bono 30% neto:</span>
                  <span className="fs-5 fw-bold font-monospace text-slate-dark">
                    +{formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hito 3: Aguinaldo */}
            <div className="col-12 col-md-4">
              <div className="p-3 rounded border bg-slate-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-amber-subtle text-amber-800 border border-amber-subtle font-monospace" style={{ fontSize: '10px' }}>
                      Pago: 1 – 20 Diciembre
                    </span>
                    <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                      Art. 196 C.T.
                    </span>
                  </div>
                  <h6 className="fw-semibold text-slate-dark mb-1">Aguinaldo de Fin de Año</h6>
                  <p className="text-muted small mb-2 font-sans" style={{ fontSize: '12px' }}>
                    De 15 a 21 días de sueldo según tus años. <strong>Cero descuento de ISSS y AFP</strong>, y sin Renta hasta $1,500.
                  </p>
                </div>
                <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                  <span className="small text-muted" style={{ fontSize: '12px' }}>En tu bolsillo:</span>
                  <span className="fs-5 fw-bold font-monospace text-emerald">
                    +{formatUSD(aguinaldoResult.netAguinaldo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle en Cuadrícula: Quincena 25 y Aguinaldo */}
      <div className="row g-4 mb-4">
        {/* TARJETA 1: QUINCENA 25 */}
        <div className="col-12 col-lg-6">
          <div className="card-soft h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                    <Gift size={16} className="text-secondary" />
                    <span>Quincena 25 (Decreto Legislativo 499)</span>
                  </h6>
                  <span className="small text-muted" style={{ fontSize: '12px' }}>
                    Obligatoria a partir de enero de 2027
                  </span>
                </div>
                <span className="badge-subtle font-monospace" style={{ fontSize: '11px' }}>
                  {quincena25Result.eligibleByLaw ? 'Elegible por ley' : '> $1,500 tope'}
                </span>
              </div>

              <div className="p-3">
                <div className="mb-3">
                  <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                    Antigüedad al 25 de enero:
                  </label>
                  <div className="segmented-control w-100">
                    <button
                      type="button"
                      onClick={() => setQ25FullYear(true)}
                      className={`w-50 ${q25FullYear ? 'active' : ''}`}
                    >
                      1 año o más (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQ25FullYear(false)}
                      className={`w-50 ${!q25FullYear ? 'active' : ''}`}
                    >
                      Menos de 1 año (Proporcional)
                    </button>
                  </div>
                </div>

                {!q25FullYear && (
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="row g-2 align-items-center mb-2">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small text-muted mb-0">Fecha de ingreso:</label>
                      </div>
                      <div className="col-12 col-sm-6">
                        <input
                          type="date"
                          value={q25HireDate}
                          onChange={(e) => {
                            setQ25HireDate(e.target.value);
                            const days = calcDaysBetweenInclusive(e.target.value, '2027-01-25');
                            if (days > 0) setQ25DaysWorked(days);
                          }}
                          className="form-control form-control-sm font-monospace"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={q25DaysWorked}
                      onChange={(e) => setQ25DaysWorked(Number(e.target.value))}
                      className="form-range"
                    />
                    <div className="text-end small font-monospace text-muted" style={{ fontSize: '11px' }}>
                      {q25DaysWorked} / 365 días computados
                    </div>
                  </div>
                )}

                {monthlySalary > RATES.QUINCENA_25_CAP && (
                  <div className="form-check form-switch mb-3 p-2 bg-light rounded border">
                    <input
                      type="checkbox"
                      checked={q25VoluntaryAboveCap}
                      onChange={(e) => setQ25VoluntaryAboveCap(e.target.checked)}
                      id="switchVoluntaryQ25"
                      className="form-check-input ms-0 me-2"
                    />
                    <label htmlFor="switchVoluntaryQ25" className="form-check-label small text-muted">
                      Simular pago voluntario de la empresa (salario superior a $1,500)
                    </label>
                  </div>
                )}

                <table className="table table-minimal table-sm small font-sans mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted">
                        <strong>Cuánto te toca:</strong> 50% de tu sueldo mensual
                      </td>
                      <td className="text-end fw-semibold text-slate-dark font-monospace">{formatUSD(round2(monthlySalary * 0.5))}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">
                        <strong>Tiempo en la empresa:</strong> {quincena25Result.daysWorked} días computados
                      </td>
                      <td className="text-end text-slate-dark font-monospace">
                        {round2(quincena25Result.proportionFactor * 100)}% de pago
                      </td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="text-emerald-900">
                        <strong>Descuentos de AFP, ISSS y Renta:</strong>
                      </td>
                      <td className="text-end text-emerald fw-bold font-monospace">$0.00 (Te llega íntegro)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-top d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-slate-dark d-block small">Monto en tu bolsillo</span>
                <span className="text-muted small font-sans" style={{ fontSize: '11px' }}>
                  {monthlySalary <= 1500
                    ? 'Pago obligatorio fijado por ley entre el 15 y el 25 de enero.'
                    : 'Tu sueldo pasa de $1,500; la ley solo obliga a pagar hasta ese tope salarial.'}
                </span>
              </div>
              <span className="fs-4 fw-bold font-monospace text-emerald">
                +{formatUSD(quincena25Result.netQuincena25)}
              </span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: AGUINALDO */}
        <div className="col-12 col-lg-6">
          <div className="card-soft h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                    <Calendar size={16} className="text-secondary" />
                    <span>Aguinaldo (Gratificación de Fin de Año)</span>
                  </h6>
                  <span className="small text-muted font-sans" style={{ fontSize: '12px' }}>
                    Plazo legal de pago obligatorio: del 1 al 20 de diciembre
                  </span>
                </div>
                <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '11px' }}>
                  Sin ISSS / AFP
                </span>
              </div>

              <div className="p-3">
                <div className="mb-3">
                  <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                    Tus años en la empresa (al 12 de diciembre):
                  </label>
                  <div className="row g-1">
                    {(
                      [
                        { id: 'under-1', title: '< 1 año', sub: 'Proporcional' },
                        { id: '1-to-3', title: '1 a < 3 años', sub: '15 días' },
                        { id: '3-to-10', title: '3 a < 10 años', sub: '19 días' },
                        { id: '10-plus', title: '10+ años', sub: '21 días' },
                      ] as const
                    ).map((b) => (
                      <div key={b.id} className="col-3">
                        <button
                          type="button"
                          onClick={() => setSeniority(b.id)}
                          className={`btn btn-sm w-100 p-1.5 text-center border ${
                            seniority === b.id ? 'btn-dark' : 'btn-light text-muted'
                          }`}
                        >
                          <div className="fw-semibold" style={{ fontSize: '11px' }}>{b.title}</div>
                          <div className="small font-monospace" style={{ fontSize: '10px' }}>{b.sub}</div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {seniority === 'under-1' && (
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="row g-2 align-items-center mb-2">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small text-muted mb-0">Fecha de ingreso a trabajar:</label>
                      </div>
                      <div className="col-12 col-sm-6">
                        <input
                          type="date"
                          value={aguinaldoHireDate}
                          onChange={(e) => {
                            setAguinaldoHireDate(e.target.value);
                            const year = new Date().getFullYear();
                            const days = calcDaysBetweenInclusive(e.target.value, `${year}-12-12`);
                            if (days > 0) setAguinaldoDaysUnder1(days);
                          }}
                          className="form-control form-control-sm font-monospace"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={aguinaldoDaysUnder1}
                      onChange={(e) => setAguinaldoDaysUnder1(Number(e.target.value))}
                      className="form-range"
                    />
                    <div className="text-end small font-monospace text-muted" style={{ fontSize: '11px' }}>
                      {aguinaldoDaysUnder1} / 365 días trabajados al 12 de diciembre
                    </div>
                  </div>
                )}

                <table className="table table-minimal table-sm small font-sans mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted">
                        <strong>Cálculo:</strong> {aguinaldoResult.equivalentDays} días de sueldo ({formatUSD(aguinaldoResult.dailySalary)}/día)
                      </td>
                      <td className="text-end fw-semibold text-slate-dark font-monospace">{formatUSD(aguinaldoResult.grossAguinaldo)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">
                        <strong>Descuento de ISSS y AFP:</strong>
                      </td>
                      <td className="text-end text-emerald fw-semibold font-monospace">$0.00 (Exento por ley)</td>
                    </tr>
                    {aguinaldoResult.taxableExcess > 0 ? (
                      <tr>
                        <td className="text-terracotta">
                          <strong>Descuento de Renta:</strong> Se cobra solo sobre lo que supera {formatUSD(aguinaldoResult.exemptionLimit)}
                        </td>
                        <td className="text-end font-monospace text-terracotta fw-bold">
                          -{formatUSD(aguinaldoResult.isrWithheld)}
                        </td>
                      </tr>
                    ) : (
                      <tr className="bg-emerald-50">
                        <td className="text-emerald-900">
                          <strong>Descuento de Renta:</strong>
                        </td>
                        <td className="text-end text-emerald fw-bold font-monospace">$0.00 (Exento hasta $1,500)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-top d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-slate-dark d-block small">Monto en tu bolsillo</span>
                <span className="text-muted small font-sans" style={{ fontSize: '11px' }}>
                  {aguinaldoResult.taxableExcess > 0
                    ? `Te descuentan renta únicamente sobre el excedente de ${formatUSD(aguinaldoResult.taxableExcess)}.`
                    : 'Sin ningún descuento: te entregan el dinero completo sin tocar tu aguinaldo.'}
                </span>
              </div>
              <span className="fs-4 fw-bold font-monospace text-emerald">
                +{formatUSD(aguinaldoResult.netAguinaldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA 3: VACACIÓN ANUAL */}
      <div className="card-soft mb-4">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
              <Plane size={16} className="text-secondary" />
              <span>Vacación Anual: Modalidades y Tramos (Art. 177 Código de Trabajo)</span>
            </h6>
            <span className="small text-muted" style={{ fontSize: '12px' }}>
              15 días continuos de descanso remunerado con el 30% de recargo de ley
            </span>
          </div>

          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setVacationSector('privado')}
              className={vacationSector === 'privado' ? 'active' : ''}
            >
              Sector Privado (30%)
            </button>
            <button
              type="button"
              onClick={() => setVacationSector('publico')}
              className={vacationSector === 'publico' ? 'active' : ''}
            >
              Sector Público (Ley de Salarios)
            </button>
          </div>
        </div>

        <div className="p-3">
          {vacationSector === 'publico' ? (
            <div className="p-3 rounded bg-light border text-muted small">
              <strong className="text-slate-dark d-block mb-1">Régimen de Servicio Civil y Ley de Salarios</strong>
              En el sector público salvadoreño, las vacaciones corresponden a descanso pagado en tres períodos oficiales
              (Semana Santa, Fiestas Agostinas y Fin de Año), percibiendo el salario ordinario íntegro ({formatUSD(monthlyNetPay)} netos), sin recargo del 30% salvo contrato colectivo específico.
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-12 col-lg-7">
                <div className="row g-3">
                  {/* Modalidad A: Solo Bono 30% */}
                  <div className="col-12 col-md-6">
                    <div
                      onClick={() => setVacationMode('bonus_only')}
                      className={`p-3 rounded border cursor-pointer h-100 d-flex flex-column justify-content-between ${
                        vacationMode === 'bonus_only' ? 'bg-slate-50 border-secondary' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge-subtle" style={{ fontSize: '10px' }}>
                            Práctica A
                          </span>
                          {vacationMode === 'bonus_only' && <Check size={14} className="text-emerald" />}
                        </div>
                        <h6 className="fw-semibold text-slate-dark mb-1">Depósito solo del Bono 30%</h6>
                        <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                          La quincena se paga en la fecha habitual y se añade el 30% adicional:
                        </p>
                        <ul className="list-unstyled small font-monospace text-muted mb-3" style={{ fontSize: '11px' }}>
                          <li className="d-flex justify-content-between">
                            <span>Bono 30% Bruto:</span>
                            <span className="fw-semibold text-slate-dark">{formatUSD(vacationResult.bonus30Gross)}</span>
                          </li>
                          <li className="d-flex justify-content-between">
                            <span>- Deducciones de ley:</span>
                            <span>-{formatUSD(round2(vacationResult.bonusOnlyMode.afp + vacationResult.bonusOnlyMode.isss + vacationResult.bonusOnlyMode.isrEstimated))}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-2 border-top d-flex justify-content-between align-items-baseline">
                        <span className="small text-muted" style={{ fontSize: '12px' }}>Bono Neto:</span>
                        <span className="fs-5 fw-bold font-monospace text-emerald">
                          {formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modalidad B: Anticipo Completo */}
                  <div className="col-12 col-md-6">
                    <div
                      onClick={() => setVacationMode('full_advance')}
                      className={`p-3 rounded border cursor-pointer h-100 d-flex flex-column justify-content-between ${
                        vacationMode === 'full_advance' ? 'bg-slate-50 border-secondary' : 'bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge-subtle" style={{ fontSize: '10px' }}>
                            Práctica B
                          </span>
                          {vacationMode === 'full_advance' && <Check size={14} className="text-emerald" />}
                        </div>
                        <h6 className="fw-semibold text-slate-dark mb-1">Adelanto 15 días + Bono 30%</h6>
                        <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                          Pago adelantado de la quincena completa ({formatUSD(vacationResult.base15DaysGross)}) más el 30%:
                        </p>
                        <ul className="list-unstyled small font-monospace text-muted mb-3" style={{ fontSize: '11px' }}>
                          <li className="d-flex justify-content-between">
                            <span>Total Bruto:</span>
                            <span className="fw-semibold text-slate-dark">{formatUSD(vacationResult.completeVacationGross)}</span>
                          </li>
                          <li className="d-flex justify-content-between">
                            <span>- Deducciones:</span>
                            <span>-{formatUSD(round2(vacationResult.fullAdvanceMode.afp + vacationResult.fullAdvanceMode.isss + vacationResult.fullAdvanceMode.isr))}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-2 border-top d-flex justify-content-between align-items-baseline">
                        <span className="small text-muted" style={{ fontSize: '12px' }}>Total Adelantado:</span>
                        <span className="fs-5 fw-bold font-monospace text-slate-dark">
                          {formatUSD(vacationResult.fullAdvanceMode.netTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* División por Tramos */}
              <div className="col-12 col-lg-5">
                <div className="p-3 rounded bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-semibold text-slate-dark mb-0">División por Períodos (15 días)</h6>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '10px' }}>
                        Pacto de fraccionamiento
                      </span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                      Distribuye los 15 días en hasta tres descansos acordados con tu empleador:
                    </p>

                    <div className="row g-2 font-monospace small">
                      <div className="col-4">
                        <label className="text-muted d-block mb-1" style={{ fontSize: '11px' }}>Período 1:</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={splitDays[0]}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setSplitDays([val, splitDays[1], splitDays[2]]);
                          }}
                          className="form-control form-control-sm font-monospace text-center"
                        />
                      </div>
                      <div className="col-4">
                        <label className="text-muted d-block mb-1" style={{ fontSize: '11px' }}>Período 2:</label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={splitDays[1]}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setSplitDays([splitDays[0], val, splitDays[2]]);
                          }}
                          className="form-control form-control-sm font-monospace text-center"
                        />
                      </div>
                      <div className="col-4">
                        <label className="text-muted d-block mb-1" style={{ fontSize: '11px' }}>Período 3:</label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={splitDays[2]}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setSplitDays([splitDays[0], splitDays[1], val]);
                          }}
                          className="form-control form-control-sm font-monospace text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-top mt-3 d-flex justify-content-between align-items-center small font-monospace">
                    <span className="text-muted">Total Días:</span>
                    <span className={`fw-bold ${splitDays[0] + splitDays[1] + splitDays[2] === 15 ? 'text-emerald' : 'text-danger'}`}>
                      {splitDays[0] + splitDays[1] + splitDays[2]} / 15 días
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
