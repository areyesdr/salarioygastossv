import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  type MonthLedger,
  type LedgerItem,
  type LedgerEntryType,
  computeQuincenaBalance,
  copyRecurringToMonth,
  createEmptyMonthLedger,
  MONTH_NAMES_ES,
} from '../lib/monthlyLedger.ts';
import { formatUSD } from '../lib/formatters.ts';

interface MonthlyLedgerViewProps {
  currentOwnerId: string;
  defaultQ1NetPay: number;
  defaultQ2NetPay: number;
  monthLedgers: MonthLedger[];
  onSaveMonthLedger: (updated: MonthLedger) => void;
}

export function MonthlyLedgerView({
  currentOwnerId,
  defaultQ1NetPay,
  defaultQ2NetPay,
  monthLedgers,
  onSaveMonthLedger,
}: MonthlyLedgerViewProps) {
  const today = new Date();
  const currentYear = today.getFullYear() >= 2026 ? today.getFullYear() : 2026;
  const currentMonthNum = today.getMonth() + 1; // 1 to 12

  const [selectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  // Formulario en línea para Q1
  const [q1Day, setQ1Day] = useState<string>('15');
  const [q1Desc, setQ1Desc] = useState<string>('');
  const [q1Amount, setQ1Amount] = useState<string>('');
  const [q1Type, setQ1Type] = useState<LedgerEntryType>('expense');
  const [q1Recurring, setQ1Recurring] = useState<boolean>(false);

  // Formulario en línea para Q2
  const [q2Day, setQ2Day] = useState<string>('30');
  const [q2Desc, setQ2Desc] = useState<string>('');
  const [q2Amount, setQ2Amount] = useState<string>('');
  const [q2Type, setQ2Type] = useState<LedgerEntryType>('expense');
  const [q2Recurring, setQ2Recurring] = useState<boolean>(false);

  // Edición de saldo inicial manual
  const [editingQ1Balance, setEditingQ1Balance] = useState<boolean>(false);
  const [customQ1Input, setCustomQ1Input] = useState<string>('');
  const [editingQ2Balance, setEditingQ2Balance] = useState<boolean>(false);
  const [customQ2Input, setCustomQ2Input] = useState<string>('');

  // Localizar o inicializar el ledger del mes seleccionado
  const activeMonthLedger =
    monthLedgers.find(
      (m) =>
        m.ownerId === currentOwnerId &&
        m.year === selectedYear &&
        m.month === selectedMonth
    ) || createEmptyMonthLedger(currentOwnerId, selectedYear, selectedMonth);

  // Computar balances de Q1 y Q2
  const q1Balance = computeQuincenaBalance(defaultQ1NetPay, activeMonthLedger.q1);
  const q2Balance = computeQuincenaBalance(defaultQ2NetPay, activeMonthLedger.q2);

  // Resumen global del mes y cálculo de sobrantes
  const totalStarting = q1Balance.startingBalance + q2Balance.startingBalance;
  const totalExtraIncome = q1Balance.totalIncome + q2Balance.totalIncome;
  const totalExpenses = q1Balance.totalExpenses + q2Balance.totalExpenses;
  const netRemaining = q1Balance.endingBalance + q2Balance.endingBalance;

  const q1Available = q1Balance.startingBalance + q1Balance.totalIncome;
  const q1Sobrante = q1Balance.endingBalance;
  const q1SobrantePct = q1Available > 0 ? Math.round((q1Sobrante / q1Available) * 100) : 0;

  const q2Available = q2Balance.startingBalance + q2Balance.totalIncome;
  const q2Sobrante = q2Balance.endingBalance;
  const q2SobrantePct = q2Available > 0 ? Math.round((q2Sobrante / q2Available) * 100) : 0;

  const totalAvailableMonth = totalStarting + totalExtraIncome;
  const totalSobranteMonthPct =
    totalAvailableMonth > 0 ? Math.round((netRemaining / totalAvailableMonth) * 100) : 0;

  // Handlers para agregar partidas
  const handleAddQ1Item = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(q1Amount);
    if (!q1Desc.trim() || Number.isNaN(amt) || amt <= 0) return;

    const newItem: LedgerItem = {
      id: `q1-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      desc: q1Desc.trim(),
      amount: amt,
      type: q1Type,
      day: parseInt(q1Day, 10) || 15,
      isRecurring: q1Recurring,
    };

    const updated: MonthLedger = {
      ...activeMonthLedger,
      q1: {
        ...activeMonthLedger.q1,
        items: [...activeMonthLedger.q1.items, newItem],
      },
    };

    onSaveMonthLedger(updated);
    setQ1Desc('');
    setQ1Amount('');
  };

  const handleAddQ2Item = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(q2Amount);
    if (!q2Desc.trim() || Number.isNaN(amt) || amt <= 0) return;

    const newItem: LedgerItem = {
      id: `q2-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      desc: q2Desc.trim(),
      amount: amt,
      type: q2Type,
      day: parseInt(q2Day, 10) || 30,
      isRecurring: q2Recurring,
    };

    const updated: MonthLedger = {
      ...activeMonthLedger,
      q2: {
        ...activeMonthLedger.q2,
        items: [...activeMonthLedger.q2.items, newItem],
      },
    };

    onSaveMonthLedger(updated);
    setQ2Desc('');
    setQ2Amount('');
  };

  const handleDeleteQ1Item = (id: string) => {
    const updated: MonthLedger = {
      ...activeMonthLedger,
      q1: {
        ...activeMonthLedger.q1,
        items: activeMonthLedger.q1.items.filter((i) => i.id !== id),
      },
    };
    onSaveMonthLedger(updated);
  };

  const handleDeleteQ2Item = (id: string) => {
    const updated: MonthLedger = {
      ...activeMonthLedger,
      q2: {
        ...activeMonthLedger.q2,
        items: activeMonthLedger.q2.items.filter((i) => i.id !== id),
      },
    };
    onSaveMonthLedger(updated);
  };

  const handleSaveCustomQ1 = () => {
    const parsed = parseFloat(customQ1Input);
    const updated: MonthLedger = {
      ...activeMonthLedger,
      q1: {
        ...activeMonthLedger.q1,
        customStartingBalance: Number.isNaN(parsed) || parsed < 0 ? undefined : parsed,
      },
    };
    onSaveMonthLedger(updated);
    setEditingQ1Balance(false);
  };

  const handleSaveCustomQ2 = () => {
    const parsed = parseFloat(customQ2Input);
    const updated: MonthLedger = {
      ...activeMonthLedger,
      q2: {
        ...activeMonthLedger.q2,
        customStartingBalance: Number.isNaN(parsed) || parsed < 0 ? undefined : parsed,
      },
    };
    onSaveMonthLedger(updated);
    setEditingQ2Balance(false);
  };

  const handleCopyFromPreviousMonth = () => {
    const prevMonthNum = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    const prevMonthLedger = monthLedgers.find(
      (m) =>
        m.ownerId === currentOwnerId &&
        m.year === prevYear &&
        m.month === prevMonthNum
    );

    if (!prevMonthLedger) {
      alert(`No se encontraron registros previos para ${MONTH_NAMES_ES[prevMonthNum - 1]} ${prevYear}.`);
      return;
    }

    const updated = copyRecurringToMonth(prevMonthLedger, activeMonthLedger);
    onSaveMonthLedger(updated);
  };

  return (
    <div className="w-100">
      {/* Barra de Pestañas de Meses (Estilo Hojas de Excel) */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex align-items-center gap-1 overflow-auto pb-1" style={{ maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setSelectedMonth((prev) => (prev > 1 ? prev - 1 : 12))}
            className="btn btn-sm btn-light border p-1"
            title="Mes anterior"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="d-flex gap-1">
            {MONTH_NAMES_ES.map((name, idx) => {
              const monthNum = idx + 1;
              const isActive = selectedMonth === monthNum;
              const isCurrent = monthNum === currentMonthNum;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedMonth(monthNum)}
                  className={`btn btn-sm py-1 px-2.5 font-monospace ${
                    isActive
                      ? 'btn-dark fw-semibold'
                      : 'btn-outline-secondary border-slate-200 bg-white text-slate-dark'
                  }`}
                  style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  {name}
                  {isCurrent && <span className="ms-1 small opacity-75">•</span>}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonth((prev) => (prev < 12 ? prev + 1 : 1))}
            className="btn btn-sm btn-light border p-1"
            title="Siguiente mes"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Acciones del Mes */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleCopyFromPreviousMonth}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 py-1 px-2.5"
            style={{ fontSize: '11px' }}
            title="Copiar gastos marcados como fijos del mes anterior"
          >
            <Copy size={13} />
            <span>Copiar fijos de {selectedMonth === 1 ? 'Diciembre' : MONTH_NAMES_ES[selectedMonth - 2]}</span>
          </button>
        </div>
      </div>

      {/* Resumen Mensual Consolidado */}
      <div className="card-soft p-3 mb-4">
        <div className="row g-2 text-center text-sm-start font-monospace">
          <div className="col-6 col-md-3">
            <span className="text-slate-muted d-block font-sans" style={{ fontSize: '11px' }}>
              Ingreso Salarial Neto ({MONTH_NAMES_ES[selectedMonth - 1]}):
            </span>
            <strong className="text-slate-dark fs-6">{formatUSD(totalStarting)}</strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="text-slate-muted d-block font-sans" style={{ fontSize: '11px' }}>
              Ingresos Extra (Q25 / Bonos):
            </span>
            <strong className="text-emerald fs-6">+{formatUSD(totalExtraIncome)}</strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="text-slate-muted d-block font-sans" style={{ fontSize: '11px' }}>
              Total Gastos del Mes:
            </span>
            <strong className="text-danger fs-6">-{formatUSD(totalExpenses)}</strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="text-slate-muted d-block font-sans" style={{ fontSize: '11px' }}>
              Sobrante Mensual Total:
            </span>
            <strong className={`fs-6 ${netRemaining >= 0 ? 'text-emerald' : 'text-danger'}`}>
              {formatUSD(netRemaining)}
            </strong>
            <span className="text-muted small font-sans d-block" style={{ fontSize: '10px' }}>
              ({totalSobranteMonthPct}% del presupuesto mensual libre)
            </span>
          </div>
        </div>
      </div>

      {/* Doble Columna Quincenal: Pago del 15 y Pago del 30 */}
      <div className="row g-4 align-items-start">
        {/* COLUMNA 1: PAGO DEL 15 */}
        <div className="col-12 col-lg-6">
          <div className="card-soft overflow-hidden h-100">
            {/* Cabecera Pago del 15 */}
            <div className="p-3 border-bottom bg-slate-50 d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center gap-2 mb-0.5">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-secondary" />
                    <span>Pago del 15</span>
                  </h6>
                  <span className={`font-monospace ${q1Sobrante >= 0 ? 'badge-emerald' : 'badge-terracotta'}`} style={{ fontSize: '11px' }}>
                    Sobrante: {formatUSD(q1Sobrante)} ({q1SobrantePct}%)
                  </span>
                </div>
                <span className="small text-muted" style={{ fontSize: '11px' }}>
                  Período del 1 al 15 de {MONTH_NAMES_ES[selectedMonth - 1]}
                </span>
              </div>

              {/* Saldo inicial configurable */}
              <div className="text-end">
                {editingQ1Balance ? (
                  <div className="d-flex align-items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={customQ1Input}
                      onChange={(e) => setCustomQ1Input(e.target.value)}
                      placeholder={defaultQ1NetPay.toFixed(2)}
                      className="form-control form-control-sm font-monospace"
                      style={{ width: '90px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomQ1}
                      className="btn btn-sm btn-dark py-0 px-2"
                      style={{ fontSize: '11px' }}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomQ1Input(q1Balance.startingBalance.toFixed(2));
                      setEditingQ1Balance(true);
                    }}
                    className="btn btn-link btn-sm text-decoration-none p-0 text-end"
                    title="Editar saldo inicial de la quincena"
                  >
                    <span className="small text-muted font-sans d-block" style={{ fontSize: '10px' }}>
                      Saldo Inicial:
                    </span>
                    <strong className="text-slate-dark font-monospace fs-6">
                      {formatUSD(q1Balance.startingBalance)}
                    </strong>
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de Movimientos Q1 */}
            <div className="table-responsive">
              <table className="table table-minimal align-middle mb-0 font-monospace" style={{ fontSize: '12px' }}>
                <thead className="bg-light small">
                  <tr>
                    <th style={{ width: '25%' }}>Saldo</th>
                    <th style={{ width: '25%' }}>Monto</th>
                    <th style={{ width: '35%' }}>Descripción</th>
                    <th className="text-center" style={{ width: '15%' }}>Día</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila Base: Saldo Inicial */}
                  <tr className="bg-slate-50 text-muted">
                    <td className="fw-bold text-slate-dark">{formatUSD(q1Balance.startingBalance)}</td>
                    <td className="text-muted">—</td>
                    <td className="font-sans small">Saldo inicial (Salario Neto)</td>
                    <td className="text-center">15</td>
                    <td></td>
                  </tr>

                  {/* Filas de Partidas Q1 */}
                  {q1Balance.computedItems.map((item) => {
                    const isIncome = item.type === 'income';
                    return (
                      <tr key={item.id}>
                        <td className="fw-semibold text-slate-dark">{formatUSD(item.runningBalance)}</td>
                        <td className={`fw-semibold ${isIncome ? 'text-emerald' : 'text-slate-dark'}`}>
                          {isIncome ? `+${formatUSD(item.amount)}` : `-${formatUSD(item.amount)}`}
                        </td>
                        <td className="font-sans">
                          <span>{item.desc}</span>
                          {item.isRecurring && (
                            <span className="badge-subtle ms-1" style={{ fontSize: '9px' }}>
                              Fijo
                            </span>
                          )}
                        </td>
                        <td className="text-center text-muted">{item.day}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteQ1Item(item.id)}
                            className="btn btn-sm btn-link text-danger p-0 border-0"
                            title="Eliminar partida"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {q1Balance.computedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3 font-sans small">
                        Sin gastos registrados en la 1.ª quincena. Agrega uno abajo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario en línea para agregar movimiento Q1 */}
            <form onSubmit={handleAddQ1Item} className="p-2.5 bg-light border-top">
              <div className="row g-1.5 align-items-center">
                <div className="col-3 col-sm-2">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={q1Day}
                    onChange={(e) => setQ1Day(e.target.value)}
                    placeholder="Día"
                    title="Día del mes (1 al 15)"
                    className="form-control form-control-sm text-center font-monospace"
                  />
                </div>
                <div className="col-9 col-sm-4">
                  <input
                    type="text"
                    required
                    value={q1Desc}
                    onChange={(e) => setQ1Desc(e.target.value)}
                    placeholder="Descripción (ej. Luz, Tarjeta)"
                    className="form-control form-control-sm font-sans"
                  />
                </div>
                <div className="col-6 col-sm-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text p-1 text-muted">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={q1Amount}
                      onChange={(e) => setQ1Amount(e.target.value)}
                      placeholder="0.00"
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>
                </div>
                <div className="col-6 col-sm-3 d-flex gap-1">
                  <select
                    value={q1Type}
                    onChange={(e) => setQ1Type(e.target.value as LedgerEntryType)}
                    className="form-select form-select-sm font-sans"
                  >
                    <option value="expense">Gasto (-)</option>
                    <option value="income">Ingreso (+)</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-sm btn-dark d-inline-flex align-items-center px-2"
                    title="Agregar movimiento"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 mt-1.5 small font-sans text-muted" style={{ fontSize: '11px' }}>
                <label className="d-inline-flex align-items-center gap-1">
                  <input
                    type="checkbox"
                    checked={q1Recurring}
                    onChange={(e) => setQ1Recurring(e.target.checked)}
                    className="form-check-input mt-0"
                  />
                  <span>Gasto fijo mensual (recurrente)</span>
                </label>
              </div>
            </form>

            {/* Saldo Remanente Final Q1 (Estilo celda destacada de Excel) */}
            {/* Saldo Sobrante Final Q1 (Estilo celda destacada de Excel) */}
            <div
              className="p-3 border-top d-flex justify-content-between align-items-center"
              style={{ backgroundColor: q1Sobrante >= 0 ? '#fef08a' : '#fee2e2' }}
            >
              <div>
                <span className="fw-bold text-dark font-sans d-block" style={{ fontSize: '13px' }}>
                  Sobrante de la 1.ª Quincena (Pago del 15)
                </span>
                <span className="text-dark small font-sans" style={{ fontSize: '11px', opacity: 0.9 }}>
                  Te sobran {formatUSD(q1Sobrante)} de {formatUSD(q1Available)} disponibles ({q1SobrantePct}% libre)
                </span>
              </div>
              <span className="fs-3 fw-bold font-monospace text-dark">
                {formatUSD(q1Sobrante)}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: PAGO DEL 30 */}
        <div className="col-12 col-lg-6">
          <div className="card-soft overflow-hidden h-100">
            {/* Cabecera Pago del 30 */}
            <div className="p-3 border-bottom bg-slate-50 d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center gap-2 mb-0.5">
                  <h6 className="fw-bold text-slate-dark mb-0 d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-secondary" />
                    <span>Pago del 30</span>
                  </h6>
                  <span className={`font-monospace ${q2Sobrante >= 0 ? 'badge-emerald' : 'badge-terracotta'}`} style={{ fontSize: '11px' }}>
                    Sobrante: {formatUSD(q2Sobrante)} ({q2SobrantePct}%)
                  </span>
                </div>
                <span className="small text-muted" style={{ fontSize: '11px' }}>
                  Período del 16 al 30/31 de {MONTH_NAMES_ES[selectedMonth - 1]}
                </span>
              </div>

              {/* Saldo inicial configurable */}
              <div className="text-end">
                {editingQ2Balance ? (
                  <div className="d-flex align-items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={customQ2Input}
                      onChange={(e) => setCustomQ2Input(e.target.value)}
                      placeholder={defaultQ2NetPay.toFixed(2)}
                      className="form-control form-control-sm font-monospace"
                      style={{ width: '90px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomQ2}
                      className="btn btn-sm btn-dark py-0 px-2"
                      style={{ fontSize: '11px' }}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomQ2Input(q2Balance.startingBalance.toFixed(2));
                      setEditingQ2Balance(true);
                    }}
                    className="btn btn-link btn-sm text-decoration-none p-0 text-end"
                    title="Editar saldo inicial de la quincena"
                  >
                    <span className="small text-muted font-sans d-block" style={{ fontSize: '10px' }}>
                      Saldo Inicial:
                    </span>
                    <strong className="text-slate-dark font-monospace fs-6">
                      {formatUSD(q2Balance.startingBalance)}
                    </strong>
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de Movimientos Q2 */}
            <div className="table-responsive">
              <table className="table table-minimal align-middle mb-0 font-monospace" style={{ fontSize: '12px' }}>
                <thead className="bg-light small">
                  <tr>
                    <th style={{ width: '25%' }}>Saldo</th>
                    <th style={{ width: '25%' }}>Monto</th>
                    <th style={{ width: '35%' }}>Descripción</th>
                    <th className="text-center" style={{ width: '15%' }}>Día</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila Base: Saldo Inicial */}
                  <tr className="bg-slate-50 text-muted">
                    <td className="fw-bold text-slate-dark">{formatUSD(q2Balance.startingBalance)}</td>
                    <td className="text-muted">—</td>
                    <td className="font-sans small">Saldo inicial (Salario Neto)</td>
                    <td className="text-center">30</td>
                    <td></td>
                  </tr>

                  {/* Filas de Partidas Q2 */}
                  {q2Balance.computedItems.map((item) => {
                    const isIncome = item.type === 'income';
                    return (
                      <tr key={item.id}>
                        <td className="fw-semibold text-slate-dark">{formatUSD(item.runningBalance)}</td>
                        <td className={`fw-semibold ${isIncome ? 'text-emerald' : 'text-slate-dark'}`}>
                          {isIncome ? `+${formatUSD(item.amount)}` : `-${formatUSD(item.amount)}`}
                        </td>
                        <td className="font-sans">
                          <span>{item.desc}</span>
                          {item.isRecurring && (
                            <span className="badge-subtle ms-1" style={{ fontSize: '9px' }}>
                              Fijo
                            </span>
                          )}
                        </td>
                        <td className="text-center text-muted">{item.day}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteQ2Item(item.id)}
                            className="btn btn-sm btn-link text-danger p-0 border-0"
                            title="Eliminar partida"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {q2Balance.computedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3 font-sans small">
                        Sin gastos registrados en la 2.ª quincena. Agrega uno abajo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario en línea para agregar movimiento Q2 */}
            <form onSubmit={handleAddQ2Item} className="p-2.5 bg-light border-top">
              <div className="row g-1.5 align-items-center">
                <div className="col-3 col-sm-2">
                  <input
                    type="number"
                    min="16"
                    max="31"
                    value={q2Day}
                    onChange={(e) => setQ2Day(e.target.value)}
                    placeholder="Día"
                    title="Día del mes (16 al 31)"
                    className="form-control form-control-sm text-center font-monospace"
                  />
                </div>
                <div className="col-9 col-sm-4">
                  <input
                    type="text"
                    required
                    value={q2Desc}
                    onChange={(e) => setQ2Desc(e.target.value)}
                    placeholder="Descripción (ej. Internet, Spotify)"
                    className="form-control form-control-sm font-sans"
                  />
                </div>
                <div className="col-6 col-sm-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text p-1 text-muted">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={q2Amount}
                      onChange={(e) => setQ2Amount(e.target.value)}
                      placeholder="0.00"
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>
                </div>
                <div className="col-6 col-sm-3 d-flex gap-1">
                  <select
                    value={q2Type}
                    onChange={(e) => setQ2Type(e.target.value as LedgerEntryType)}
                    className="form-select form-select-sm font-sans"
                  >
                    <option value="expense">Gasto (-)</option>
                    <option value="income">Ingreso (+)</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-sm btn-dark d-inline-flex align-items-center px-2"
                    title="Agregar movimiento"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 mt-1.5 small font-sans text-muted" style={{ fontSize: '11px' }}>
                <label className="d-inline-flex align-items-center gap-1">
                  <input
                    type="checkbox"
                    checked={q2Recurring}
                    onChange={(e) => setQ2Recurring(e.target.checked)}
                    className="form-check-input mt-0"
                  />
                  <span>Gasto fijo mensual (recurrente)</span>
                </label>
              </div>
            </form>

            {/* Saldo Sobrante Final Q2 (Estilo celda destacada de Excel) */}
            <div
              className="p-3 border-top d-flex justify-content-between align-items-center"
              style={{ backgroundColor: q2Sobrante >= 0 ? '#fef08a' : '#fee2e2' }}
            >
              <div>
                <span className="fw-bold text-dark font-sans d-block" style={{ fontSize: '13px' }}>
                  Sobrante de la 2.ª Quincena (Pago del 30)
                </span>
                <span className="text-dark small font-sans" style={{ fontSize: '11px', opacity: 0.9 }}>
                  Te sobran {formatUSD(q2Sobrante)} de {formatUSD(q2Available)} disponibles ({q2SobrantePct}% libre)
                </span>
              </div>
              <span className="fs-3 fw-bold font-monospace text-dark">
                {formatUSD(q2Sobrante)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
