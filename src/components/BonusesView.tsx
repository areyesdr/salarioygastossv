import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Calendar, Gift, Plane, Check } from 'lucide-react';
import {
  RATES,
  round2,
  calcDaysBetweenInclusive,
  type VacationCalculationResult,
  type AguinaldoCalculationResult,
  type Quincena25CalculationResult,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
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
  aguinaldoExemptionRule,
  setAguinaldoExemptionRule,
  vacationSector,
  setVacationSector,
  vacationBonusPct: _vacationBonusPct,
  setVacationBonusPct: _setVacationBonusPct,
  vacationMode,
  setVacationMode,
  splitDays,
  setSplitDays,
  formatUSD,
}: BonusesViewProps) {
  return (
    <motion.div
      key="tab-bonuses"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="container-fluid px-0"
    >
      {/* Resumen Anual de Bonos */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <Calendar className="text-primary" size={20} />
              <span>Calendario Anual de Prestaciones y Bonos de Ley</span>
            </h5>
            <p className="card-subtitle text-muted small mb-0">
              Resumen de ingresos extraordinarios garantizados por la legislación salvadoreña
            </p>
          </div>
          <span className="badge bg-success-subtle text-success border border-success-subtle fs-6 font-monospace py-2 px-3">
            Total Anual Neto: +{formatUSD(totalAnnualNetBonuses)}
          </span>
        </div>

        <div className="card-body">
          <div className="row g-3">
            {/* Hito 1: Quincena 25 */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border bg-light shadow-2xs">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary">15 – 25 Enero</span>
                    <span className="badge bg-dark">Obligatoria 2027</span>
                  </div>
                  <h6 className="card-title fw-bold text-dark">Quincena 25 (Decreto 499)</h6>
                  <p className="card-text text-muted small mb-3">
                    50% salario nominal (hasta $1,500), 100% libre de ISSS, AFP y Renta.
                  </p>
                  <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                    <span className="small text-muted">Líquido a recibir:</span>
                    <span className="fs-5 fw-bold font-monospace text-primary">
                      {formatUSD(quincena25Result.netQuincena25)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hito 2: Vacación 30% */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border bg-light shadow-2xs">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-warning text-dark">Anual / Tramos</span>
                    <span className="badge bg-secondary">Art. 177 C.T.</span>
                  </div>
                  <h6 className="card-title fw-bold text-dark">Vacación Anual (15 días + 30%)</h6>
                  <p className="card-text text-muted small mb-3">
                    Recargo legal del 30% sobre 15 días ({formatUSD(vacationResult.bonus30Gross)} bruto).
                  </p>
                  <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                    <span className="small text-muted">Bono 30% neto est.:</span>
                    <span className="fs-5 fw-bold font-monospace text-dark">
                      {formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hito 3: Aguinaldo */}
            <div className="col-12 col-md-4">
              <div className="card h-100 border bg-light shadow-2xs">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-danger">1 Oct – 20 Dic</span>
                    <span className="badge bg-secondary">15/19/21 días</span>
                  </div>
                  <h6 className="card-title fw-bold text-dark">Aguinaldo de Ley</h6>
                  <p className="card-text text-muted small mb-3">
                    Sin descuento de ISSS ni AFP. Exento de ISR hasta {formatUSD(aguinaldoResult.exemptionLimit)}.
                  </p>
                  <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                    <span className="small text-muted">Líquido a recibir:</span>
                    <span className="fs-5 fw-bold font-monospace text-success">
                      {formatUSD(aguinaldoResult.netAguinaldo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle en Cuadrícula: Quincena 25 y Aguinaldo */}
      <div className="row g-4 mb-4">
        {/* TARJETA 1: QUINCENA 25 (DECRETO 499) */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <Gift className="text-primary" size={20} />
                  <span>Quincena 25 (Enero · Decreto 499)</span>
                </h5>
                <p className="card-subtitle text-muted small mb-0">
                  Obligatoria para todo empleador a partir de enero de 2027
                </p>
              </div>
              {quincena25Result.eligibleByLaw ? (
                <span className="badge bg-success d-flex align-items-center gap-1">
                  <CheckCircle2 size={13} /> Elegible por ley
                </span>
              ) : (
                <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                  <AlertCircle size={13} /> &gt; $1,500 tope
                </span>
              )}
            </div>

            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Antigüedad al 25 de enero:</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    onClick={() => setQ25FullYear(true)}
                    className={`btn btn-sm ${q25FullYear ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    1 año o más (100% de la cuota)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ25FullYear(false)}
                    className={`btn btn-sm ${!q25FullYear ? 'btn-primary' : 'btn-outline-secondary'}`}
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
                  <div className="text-end small font-monospace text-muted">
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
                  <label htmlFor="switchVoluntaryQ25" className="form-check-label small">
                    Simular pago voluntario de la empresa (salario supera $1,500)
                  </label>
                </div>
              )}

              <table className="table table-sm table-borderless small font-monospace mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Base (50% salario mensual):</td>
                    <td className="text-end fw-bold">{formatUSD(round2(monthlySalary * 0.5))}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Factor de antigüedad:</td>
                    <td className="text-end fw-bold">
                      {round2(quincena25Result.proportionFactor * 100)}% ({quincena25Result.daysWorked} días)
                    </td>
                  </tr>
                  <tr className="table-success">
                    <td className="text-success fw-bold">Descuentos ISSS, AFP y Renta:</td>
                    <td className="text-end text-success fw-bold">$0.00 (Exento 100%)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-dark text-uppercase small d-block">
                  Quincena 25 Neta a Recibir
                </span>
                <span className="text-muted small">{quincena25Result.legalNote}</span>
              </div>
              <span className="fs-3 fw-bold font-monospace text-primary">
                {formatUSD(quincena25Result.netQuincena25)}
              </span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: AGUINALDO DE LEY */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <Calendar className="text-danger" size={20} />
                  <span>Aguinaldo por Antigüedad (Arts. 196–202 C.T.)</span>
                </h5>
                <p className="card-subtitle text-muted small mb-0">
                  Ventana legal de pago: 1 de octubre al 20 de diciembre
                </p>
              </div>
              <span className="badge bg-secondary font-monospace">Exento ISSS/AFP</span>
            </div>

            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Antigüedad al 12 de diciembre:</label>
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
                        className={`btn btn-sm w-100 p-2 text-center ${
                          seniority === b.id ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                      >
                        <div className="fw-bold" style={{ fontSize: '11px' }}>{b.title}</div>
                        <div className="small font-monospace">{b.sub}</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {seniority === 'under-1' && (
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="row g-2 align-items-center mb-2">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small text-muted mb-0">Fecha de ingreso:</label>
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
                  <div className="text-end small font-monospace text-muted">
                    {aguinaldoDaysUnder1} / 365 días al 12 dic.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded border">
                <span className="small text-muted">Tope de exención de Renta:</span>
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    onClick={() => setAguinaldoExemptionRule('decreto_1500')}
                    className={`btn btn-sm ${
                      aguinaldoExemptionRule === 'decreto_1500' ? 'btn-dark' : 'btn-outline-secondary'
                    }`}
                  >
                    Decreto $1,500
                  </button>
                  <button
                    type="button"
                    onClick={() => setAguinaldoExemptionRule('dos_minimos')}
                    className={`btn btn-sm ${
                      aguinaldoExemptionRule === 'dos_minimos' ? 'btn-dark' : 'btn-outline-secondary'
                    }`}
                  >
                    2 Mínimos ($817.60)
                  </button>
                </div>
              </div>

              <table className="table table-sm table-borderless small font-monospace mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">
                      Salario diario ({formatUSD(aguinaldoResult.dailySalary)}) × {aguinaldoResult.equivalentDays} días:
                    </td>
                    <td className="text-end fw-bold">{formatUSD(aguinaldoResult.grossAguinaldo)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Monto exento de ISR:</td>
                    <td className="text-end text-success fw-bold">
                      {formatUSD(aguinaldoResult.exemptAmount)}
                    </td>
                  </tr>
                  {aguinaldoResult.taxableExcess > 0 ? (
                    <tr className="table-danger">
                      <td className="text-danger fw-bold">
                        ISR s/excedente ({formatUSD(aguinaldoResult.taxableExcess)}):
                      </td>
                      <td className="text-end text-danger fw-bold">
                        -{formatUSD(aguinaldoResult.isrWithheld)}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="text-muted">Retención ISR:</td>
                      <td className="text-end text-success fw-bold">$0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-dark text-uppercase small d-block">
                  Aguinaldo Líquido a Recibir
                </span>
                <span className="text-muted small">Pago libre de ISSS y AFP</span>
              </div>
              <span className="fs-3 fw-bold font-monospace text-success">
                {formatUSD(aguinaldoResult.netAguinaldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA 3: VACACIÓN ANUAL (15 DÍAS + 30%) Y TRAMOS */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <Plane className="text-warning" size={20} />
              <span>Vacación Anual: Comparativa de Modalidades y División en Períodos</span>
            </h5>
            <p className="card-subtitle text-muted small mb-0">
              Art. 177 Código de Trabajo · 15 días continuos con el 30% de recargo sobre dicha quincena
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                onClick={() => setVacationSector('privado')}
                className={`btn ${vacationSector === 'privado' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                Sector Privado (30%)
              </button>
              <button
                type="button"
                onClick={() => setVacationSector('publico')}
                className={`btn ${vacationSector === 'publico' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                Sector Público (Servicio Civil)
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {vacationSector === 'publico' ? (
            <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
              <Info size={20} className="shrink-0 mt-1" />
              <div>
                <strong className="d-block">Régimen de Servicio Civil / Ley de Salarios (Sector Público)</strong>
                En el sector público las vacaciones corresponden a descanso remunerado dentro de los 3 períodos
                oficiales (Semana Santa, Fiestas Agostinas y Fin de Año), percibiendo el salario ordinario íntegro (
                {formatUSD(monthlyNetPay)} líquidos), sin recargo del 30% salvo contrato colectivo institucional.
              </div>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-12 col-lg-7">
                <div className="row g-3">
                  {/* Práctica A: Depósito solo del bono 30% */}
                  <div className="col-12 col-md-6">
                    <div
                      onClick={() => setVacationMode('bonus_only')}
                      className={`card h-100 p-3 border cursor-pointer ${
                        vacationMode === 'bonus_only' ? 'border-primary bg-primary-subtle' : 'bg-light'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary">Práctica A · Solo 30%</span>
                        {vacationMode === 'bonus_only' && <Check size={16} className="text-primary" />}
                      </div>
                      <h6 className="fw-bold text-dark">Depósito exclusivo del Bono 30%</h6>
                      <p className="text-muted small mb-3">
                        Tu quincena ordinaria se deposita normal en planilla y la empresa te abona el 30% vacacional:
                      </p>
                      <ul className="list-unstyled small font-monospace space-y-1 mb-3">
                        <li className="d-flex justify-content-between">
                          <span className="text-muted">Bono 30% Bruto:</span>
                          <strong>{formatUSD(vacationResult.bonus30Gross)}</strong>
                        </li>
                        <li className="d-flex justify-content-between text-warning-emphasis">
                          <span>- AFP s/bono:</span>
                          <span>-{formatUSD(vacationResult.bonusOnlyMode.afp)}</span>
                        </li>
                        <li className="d-flex justify-content-between text-info">
                          <span>- ISSS s/bono:</span>
                          <span>-{formatUSD(vacationResult.bonusOnlyMode.isss)}</span>
                        </li>
                        <li className="d-flex justify-content-between text-danger">
                          <span>- ISR estimado:</span>
                          <span>-{formatUSD(vacationResult.bonusOnlyMode.isrEstimated)}</span>
                        </li>
                      </ul>
                      <div className="d-flex justify-content-between align-items-baseline pt-2 border-top mt-auto">
                        <span className="small fw-bold text-dark">Bono Neto Real:</span>
                        <span className="fs-5 fw-bold font-monospace text-primary">
                          {formatUSD(vacationResult.bonusOnlyMode.netBonusAfterDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Práctica B: Pago completo adelantado 15d + 30% */}
                  <div className="col-12 col-md-6">
                    <div
                      onClick={() => setVacationMode('full_advance')}
                      className={`card h-100 p-3 border cursor-pointer ${
                        vacationMode === 'full_advance' ? 'border-primary bg-primary-subtle' : 'bg-light'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-warning text-dark">Práctica B · Completo</span>
                        {vacationMode === 'full_advance' && <Check size={16} className="text-primary" />}
                      </div>
                      <h6 className="fw-bold text-dark">Adelanto 15 días + Bono 30%</h6>
                      <p className="text-muted small mb-3">
                        Liquidación completa de la quincena ({formatUSD(vacationResult.base15DaysGross)}) más el 30%:
                      </p>
                      <ul className="list-unstyled small font-monospace space-y-1 mb-3">
                        <li className="d-flex justify-content-between">
                          <span className="text-muted">Total Bruto (15d + 30%):</span>
                          <strong>{formatUSD(vacationResult.completeVacationGross)}</strong>
                        </li>
                        <li className="d-flex justify-content-between text-warning-emphasis">
                          <span>- AFP (7.25%):</span>
                          <span>-{formatUSD(vacationResult.fullAdvanceMode.afp)}</span>
                        </li>
                        <li className="d-flex justify-content-between text-info">
                          <span>- ISSS (tope $15):</span>
                          <span>-{formatUSD(vacationResult.fullAdvanceMode.isss)}</span>
                        </li>
                        <li className="d-flex justify-content-between text-danger">
                          <span>- ISR total:</span>
                          <span>-{formatUSD(vacationResult.fullAdvanceMode.isr)}</span>
                        </li>
                      </ul>
                      <div className="d-flex justify-content-between align-items-baseline pt-2 border-top mt-auto">
                        <span className="small fw-bold text-dark">Líquido Adelantado:</span>
                        <span className="fs-5 fw-bold font-monospace text-success">
                          {formatUSD(vacationResult.fullAdvanceMode.netTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* División en Tramos (Semana Santa, Agosto, Diciembre) */}
              <div className="col-12 col-lg-5">
                <div className="card h-100 bg-light border p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">División por Períodos (15 días)</h6>
                    <span className="badge bg-secondary font-monospace">
                      {splitDays[0] + splitDays[1] + splitDays[2]} / 15 días
                    </span>
                  </div>
                  <p className="text-muted small mb-3">
                    Configura los días asignados a cada período si tu empresa fracciona la vacación:
                  </p>

                  <div className="space-y-2 mb-3">
                    {vacationResult.splits.map((tramo, idx) => (
                      <div key={tramo.name} className="p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="d-block small text-dark">{tramo.name}</strong>
                          <span className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                            Neto: {formatUSD(tramo.netBonusPart)}
                          </span>
                        </div>
                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={splitDays[idx]}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(15, Number(e.target.value) || 0));
                              const next: [number, number, number] = [...splitDays] as [number, number, number];
                              next[idx] = val;
                              setSplitDays(next);
                            }}
                            className="form-control text-center font-monospace"
                          />
                          <span className="input-group-text">d</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSplitDays([5, 5, 5])}
                    className="btn btn-outline-secondary btn-sm w-100"
                  >
                    Restablecer distribución (5 / 5 / 5)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
