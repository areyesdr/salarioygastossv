import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Gift,
  Pencil,
  Check,
  X,
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
import { round2 } from '../lib/svLaborLaw.ts';

export interface LegalBonusesPayload {
  vacationBonusNet: number;
  vacationFullNet: number;
  vacationBonusGross: number;
  aguinaldoNet: number;
  q25Net: number;
}

interface MonthlyLedgerViewProps {
  currentOwnerId: string;
  defaultQ1NetPay: number;
  defaultQ2NetPay: number;
  monthLedgers: MonthLedger[];
  onSaveMonthLedger: (updated: MonthLedger) => void;
  legalBonuses?: LegalBonusesPayload;
}

export function MonthlyLedgerView({
  currentOwnerId,
  defaultQ1NetPay,
  defaultQ2NetPay,
  monthLedgers,
  onSaveMonthLedger,
  legalBonuses,
}: MonthlyLedgerViewProps) {
  const today = new Date();
  const currentYear = today.getFullYear() >= 2026 ? today.getFullYear() : 2026;
  const currentMonthNum = today.getMonth() + 1; // 1 to 12

  const [selectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  // Modal para agregar bonos de ley a los gastos
  const [showBonusModal, setShowBonusModal] = useState<boolean>(false);
  const [targetBonusQuincena, setTargetBonusQuincena] = useState<'q1' | 'q2'>('q1');

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

  // Edición inline de partidas
  const [editingEntry, setEditingEntry] = useState<{
    id: string;
    quincena: 'q1' | 'q2';
    desc: string;
    amount: string;
    day: number;
    type: LedgerEntryType;
    isRecurring: boolean;
  } | null>(null);

  // Localizar o inicializar el ledger del mes seleccionado
  const activeMonthLedger =
    monthLedgers.find(
      (m) =>
        m.year === selectedYear &&
        m.month === selectedMonth &&
        (m.ownerId === currentOwnerId || !currentOwnerId || !m.ownerId)
    ) ||
    monthLedgers.find(
      (m) => m.year === selectedYear && m.month === selectedMonth
    ) ||
    createEmptyMonthLedger(currentOwnerId, selectedYear, selectedMonth);

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

  const handleStartEditItem = (item: LedgerItem, quincena: 'q1' | 'q2') => {
    setEditingEntry({
      id: item.id,
      quincena,
      desc: item.desc,
      amount: String(item.amount),
      day: item.day,
      type: item.type,
      isRecurring: Boolean(item.isRecurring),
    });
  };

  const handleSaveEditItem = () => {
    if (!editingEntry) return;
    const amt = parseFloat(editingEntry.amount);
    if (!editingEntry.desc.trim() || Number.isNaN(amt) || amt <= 0) return;

    const targetQuincena = editingEntry.quincena;
    const updatedItems = activeMonthLedger[targetQuincena].items.map((i) => {
      if (i.id !== editingEntry.id) return i;
      return {
        ...i,
        desc: editingEntry.desc.trim(),
        amount: round2(amt),
        day: editingEntry.day,
        type: editingEntry.type,
        isRecurring: editingEntry.isRecurring,
      };
    });

    const updated: MonthLedger = {
      ...activeMonthLedger,
      [targetQuincena]: {
        ...activeMonthLedger[targetQuincena],
        items: updatedItems,
      },
    };

    onSaveMonthLedger(updated);
    setEditingEntry(null);
  };

  const handleCancelEditItem = () => {
    setEditingEntry(null);
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

    const prevMonthLedger =
      monthLedgers.find(
        (m) =>
          m.year === prevYear &&
          m.month === prevMonthNum &&
          (m.ownerId === currentOwnerId || !currentOwnerId || !m.ownerId)
      ) ||
      monthLedgers.find((m) => m.year === prevYear && m.month === prevMonthNum);

    if (!prevMonthLedger) {
      alert(`No se encontraron registros previos para ${MONTH_NAMES_ES[prevMonthNum - 1]} ${prevYear}.`);
      return;
    }

    const updated = copyRecurringToMonth(prevMonthLedger, activeMonthLedger);
    onSaveMonthLedger(updated);
  };

  const hasAguinaldoInMonth =
    activeMonthLedger.q1.items.some((i) => i.desc.toLowerCase().includes('aguinaldo')) ||
    activeMonthLedger.q2.items.some((i) => i.desc.toLowerCase().includes('aguinaldo'));

  const hasQ25InMonth =
    activeMonthLedger.q1.items.some(
      (i) => i.desc.toLowerCase().includes('quincena 25') || i.desc.toLowerCase().includes('q25')
    ) ||
    activeMonthLedger.q2.items.some(
      (i) => i.desc.toLowerCase().includes('quincena 25') || i.desc.toLowerCase().includes('q25')
    );

  const handleAddLegalBonus = (
    bonusKey: 'vacation_bonus' | 'vacation_full' | 'aguinaldo' | 'q25',
    quincena: 'q1' | 'q2'
  ) => {
    if (!legalBonuses) return;
    let desc = '';
    let amount = 0;
    const day = quincena === 'q1' ? 15 : 30;

    switch (bonusKey) {
      case 'vacation_bonus':
        desc = 'Recargo Vacacional 30% (Ley)';
        amount = legalBonuses.vacationBonusNet;
        break;
      case 'vacation_full':
        desc = 'Vacación Completa 15 días + 30% (Ley)';
        amount = legalBonuses.vacationFullNet;
        break;
      case 'aguinaldo':
        desc = 'Aguinaldo Legal';
        amount = legalBonuses.aguinaldoNet;
        break;
      case 'q25':
        desc = 'Quincena 25 (Decreto 499)';
        amount = legalBonuses.q25Net;
        break;
    }

    if (amount <= 0) return;

    const newItem: LedgerItem = {
      id: `${quincena}-bonus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      desc,
      amount,
      type: 'income',
      day,
      isRecurring: false,
    };

    const updated: MonthLedger = {
      ...activeMonthLedger,
      ownerId: currentOwnerId,
      [quincena]: {
        ...activeMonthLedger[quincena],
        items: [...activeMonthLedger[quincena].items, newItem],
      },
    };

    onSaveMonthLedger(updated);
    setShowBonusModal(false);
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
          {legalBonuses && (
            <button
              type="button"
              onClick={() => {
                setTargetBonusQuincena('q1');
                setShowBonusModal(true);
              }}
              className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1.5 py-1 px-2.5 fw-semibold"
              style={{ fontSize: '11px' }}
              title="Agregar ingreso de Aguinaldo, Quincena 25 o Vacación legal"
            >
              <Gift size={13} className="text-emerald" />
              <span>+ Bono de Ley</span>
            </button>
          )}
          <span className="badge-subtle font-monospace d-inline-flex align-items-center gap-1.5 py-1 px-2.5 text-slate-dark" style={{ fontSize: '11px' }}>
            <CheckCircle2 size={12} className="text-emerald" />
            <span>Sincronizado con Supabase</span>
          </span>
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

      {/* Sugerencias contextuales de bonos de ley por mes */}
      {selectedMonth === 12 && !hasAguinaldoInMonth && legalBonuses && (
        <div className="alert bg-amber-subtle border-amber text-slate-dark py-2.5 px-3 rounded mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <Gift size={16} className="text-amber" />
            <span className="small">
              <strong>Diciembre:</strong> Mes de pago de Aguinaldo de Ley (<strong>+{formatUSD(legalBonuses.aguinaldoNet)}</strong> estimado neto).
            </span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddLegalBonus('aguinaldo', 'q1')}
              className="btn btn-xs btn-dark py-1 px-2.5 fw-semibold"
              style={{ fontSize: '11px' }}
            >
              + Agregar a Pago del 15
            </button>
            <button
              type="button"
              onClick={() => handleAddLegalBonus('aguinaldo', 'q2')}
              className="btn btn-xs btn-outline-dark py-1 px-2.5 fw-semibold"
              style={{ fontSize: '11px' }}
            >
              + A Pago del 30
            </button>
          </div>
        </div>
      )}

      {selectedMonth === 6 && !hasQ25InMonth && legalBonuses && (
        <div className="alert bg-blue-subtle border-primary text-slate-dark py-2.5 px-3 rounded mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <Gift size={16} className="text-primary" />
            <span className="small">
              <strong>Junio:</strong> Mes de pago de Quincena 25 (<strong>+{formatUSD(legalBonuses.q25Net)}</strong> estimado neto).
            </span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddLegalBonus('q25', 'q1')}
              className="btn btn-xs btn-dark py-1 px-2.5 fw-semibold"
              style={{ fontSize: '11px' }}
            >
              + Agregar a Pago del 15
            </button>
            <button
              type="button"
              onClick={() => handleAddLegalBonus('q25', 'q2')}
              className="btn btn-xs btn-outline-dark py-1 px-2.5 fw-semibold"
              style={{ fontSize: '11px' }}
            >
              + A Pago del 30
            </button>
          </div>
        </div>
      )}

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
                  Gastos del 15 al 29 de {MONTH_NAMES_ES[selectedMonth - 1]}
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
                    const isEditing = editingEntry?.id === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="table-warning">
                          <td className="align-middle text-muted small font-sans">—</td>
                          <td className="align-middle">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text px-1 py-0 text-muted">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={editingEntry.amount}
                                onChange={(e) =>
                                  setEditingEntry({ ...editingEntry, amount: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditItem();
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEditItem();
                                  }
                                }}
                                className="form-control form-control-sm font-monospace p-1"
                                style={{ minWidth: '70px', maxWidth: '100px' }}
                                autoFocus
                              />
                            </div>
                          </td>
                          <td className="align-middle">
                            <input
                              type="text"
                              value={editingEntry.desc}
                              onChange={(e) =>
                                setEditingEntry({ ...editingEntry, desc: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditItem();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditItem();
                                }
                              }}
                              className="form-control form-control-sm font-sans p-1"
                            />
                          </td>
                          <td className="align-middle text-center">
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={editingEntry.day}
                              onChange={(e) =>
                                setEditingEntry({
                                  ...editingEntry,
                                  day: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditItem();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditItem();
                                }
                              }}
                              className="form-control form-control-sm font-monospace text-center p-1"
                              style={{ width: '45px', margin: '0 auto' }}
                            />
                          </td>
                          <td className="align-middle text-end text-nowrap">
                            <button
                              type="button"
                              onClick={handleSaveEditItem}
                              className="btn btn-sm btn-link text-emerald p-0 border-0 me-2"
                              title="Guardar cambios"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="btn btn-sm btn-link text-secondary p-0 border-0"
                              title="Cancelar edición"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    }

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
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            onClick={() => handleStartEditItem(item, 'q1')}
                            className="btn btn-sm btn-link text-muted p-0 border-0 me-2"
                            title="Editar partida"
                          >
                            <Pencil size={13} />
                          </button>
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
                    max="31"
                    value={q1Day}
                    onChange={(e) => setQ1Day(e.target.value)}
                    placeholder="Día"
                    title="Día del mes (15 al 29)"
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

            {/* Saldo Sobrante Final Q1 (Estilo celda destacada de Excel) */}
            <div
              className={`p-3 border-top d-flex justify-content-between align-items-center ${
                q1Sobrante >= 0 ? 'highlight-surplus-box' : 'highlight-deficit-box'
              }`}
            >
              <div>
                <span className="fw-bold font-sans d-block surplus-title" style={{ fontSize: '13px' }}>
                  Sobrante de la 1.ª Quincena (Pago del 15)
                </span>
                <span className="small font-sans surplus-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>
                  Te sobran {formatUSD(q1Sobrante)} de {formatUSD(q1Available)} disponibles ({q1SobrantePct}% libre)
                </span>
              </div>
              <span className="fs-3 fw-bold font-monospace surplus-amount">
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
                  Gastos del 30 al 14
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
                    const isEditing = editingEntry?.id === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="table-warning">
                          <td className="align-middle text-muted small font-sans">—</td>
                          <td className="align-middle">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text px-1 py-0 text-muted">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={editingEntry.amount}
                                onChange={(e) =>
                                  setEditingEntry({ ...editingEntry, amount: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditItem();
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEditItem();
                                  }
                                }}
                                className="form-control form-control-sm font-monospace p-1"
                                style={{ minWidth: '70px', maxWidth: '100px' }}
                                autoFocus
                              />
                            </div>
                          </td>
                          <td className="align-middle">
                            <input
                              type="text"
                              value={editingEntry.desc}
                              onChange={(e) =>
                                setEditingEntry({ ...editingEntry, desc: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditItem();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditItem();
                                }
                              }}
                              className="form-control form-control-sm font-sans p-1"
                            />
                          </td>
                          <td className="align-middle text-center">
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={editingEntry.day}
                              onChange={(e) =>
                                setEditingEntry({
                                  ...editingEntry,
                                  day: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditItem();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditItem();
                                }
                              }}
                              className="form-control form-control-sm font-monospace text-center p-1"
                              style={{ width: '45px', margin: '0 auto' }}
                            />
                          </td>
                          <td className="align-middle text-end text-nowrap">
                            <button
                              type="button"
                              onClick={handleSaveEditItem}
                              className="btn btn-sm btn-link text-emerald p-0 border-0 me-2"
                              title="Guardar cambios"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="btn btn-sm btn-link text-secondary p-0 border-0"
                              title="Cancelar edición"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    }

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
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            onClick={() => handleStartEditItem(item, 'q2')}
                            className="btn btn-sm btn-link text-muted p-0 border-0 me-2"
                            title="Editar partida"
                          >
                            <Pencil size={13} />
                          </button>
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
                    min="1"
                    max="31"
                    value={q2Day}
                    onChange={(e) => setQ2Day(e.target.value)}
                    placeholder="Día"
                    title="Día del mes (30 al 14)"
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
              className={`p-3 border-top d-flex justify-content-between align-items-center ${
                q2Sobrante >= 0 ? 'highlight-surplus-box' : 'highlight-deficit-box'
              }`}
            >
              <div>
                <span className="fw-bold font-sans d-block surplus-title" style={{ fontSize: '13px' }}>
                  Sobrante de la 2.ª Quincena (Pago del 30)
                </span>
                <span className="small font-sans surplus-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>
                  Te sobran {formatUSD(q2Sobrante)} de {formatUSD(q2Available)} disponibles ({q2SobrantePct}% libre)
                </span>
              </div>
              <span className="fs-3 fw-bold font-monospace surplus-amount">
                {formatUSD(q2Sobrante)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Seleccionar e Insertar Bonos de Ley */}
      {showBonusModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBonusModal(false);
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h6 className="modal-title fw-semibold text-slate-dark d-flex align-items-center gap-2 mb-0">
                  <Gift size={16} className="text-emerald" />
                  <span>Agregar Ingreso por Bonos de Ley — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}</span>
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBonusModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Selecciona la quincena de destino y el bono de ley a incorporar. Los montos calculados aplican las deducciones legales vigentes de El Salvador (AFP, ISSS e ISR) según tu salario actual.
                </p>

                {/* Selector de Quincena Destino */}
                <div className="d-flex align-items-center gap-2 mb-4 p-2.5 bg-slate-50 border rounded">
                  <span className="small fw-semibold text-slate-dark ms-1">Asignar a:</span>
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      onClick={() => setTargetBonusQuincena('q1')}
                      className={`btn btn-sm ${
                        targetBonusQuincena === 'q1' ? 'btn-dark fw-semibold' : 'btn-outline-secondary'
                      }`}
                    >
                      Pago del 15 (1.ª Quincena)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetBonusQuincena('q2')}
                      className={`btn btn-sm ${
                        targetBonusQuincena === 'q2' ? 'btn-dark fw-semibold' : 'btn-outline-secondary'
                      }`}
                    >
                      Pago del 30 (2.ª Quincena)
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Tarjeta 1: Recargo Vacacional 30% */}
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 border rounded shadow-2xs">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-emerald-subtle text-emerald fw-semibold" style={{ fontSize: '11px' }}>
                          Vacación (Solo Recargo 30%)
                        </span>
                        <span className="fs-5 fw-bold font-monospace text-emerald">
                          +{formatUSD(legalBonuses?.vacationBonusNet ?? 0)}
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                        Calculado sumando el 30% vacacional al salario quincenal y deduciendo AFP, ISSS y retención de renta marginal. Se suma a tu quincena ordinaria.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddLegalBonus('vacation_bonus', targetBonusQuincena)}
                        className="btn btn-sm btn-dark mt-auto w-100 fw-semibold d-flex justify-content-center align-items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Insertar a {targetBonusQuincena === 'q1' ? 'Pago del 15' : 'Pago del 30'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta 2: Vacación Completa 15 días + 30% */}
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 border rounded shadow-2xs">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-primary-subtle text-primary fw-semibold" style={{ fontSize: '11px' }}>
                          Vacación Completa (Adelantada)
                        </span>
                        <span className="fs-5 fw-bold font-monospace text-primary">
                          +{formatUSD(legalBonuses?.vacationFullNet ?? 0)}
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                        Pago completo adelantado de 15 días continuos de descanso remunerado más el 30% de ley con deducciones totales aplicadas.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddLegalBonus('vacation_full', targetBonusQuincena)}
                        className="btn btn-sm btn-dark mt-auto w-100 fw-semibold d-flex justify-content-center align-items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Insertar a {targetBonusQuincena === 'q1' ? 'Pago del 15' : 'Pago del 30'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta 3: Aguinaldo Legal */}
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 border rounded shadow-2xs">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-amber-subtle text-amber fw-semibold" style={{ fontSize: '11px' }}>
                          Aguinaldo de Ley (Diciembre)
                        </span>
                        <span className="fs-5 fw-bold font-monospace text-slate-dark">
                          +{formatUSD(legalBonuses?.aguinaldoNet ?? 0)}
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                        Prestación anual obligatoria calculada según tus años de antigüedad laboral. Exenta de impuesto sobre la renta hasta $1,500.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddLegalBonus('aguinaldo', targetBonusQuincena)}
                        className="btn btn-sm btn-dark mt-auto w-100 fw-semibold d-flex justify-content-center align-items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Insertar a {targetBonusQuincena === 'q1' ? 'Pago del 15' : 'Pago del 30'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta 4: Quincena 25 */}
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 border rounded shadow-2xs">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-secondary-subtle text-secondary fw-semibold" style={{ fontSize: '11px' }}>
                          Quincena 25 (Decreto 499)
                        </span>
                        <span className="fs-5 fw-bold font-monospace text-slate-dark">
                          +{formatUSD(legalBonuses?.q25Net ?? 0)}
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
                        Compensación legal quincenal libre de descuentos (hasta el tope de 2 salarios mínimos del sector comercio).
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddLegalBonus('q25', targetBonusQuincena)}
                        className="btn btn-sm btn-dark mt-auto w-100 fw-semibold d-flex justify-content-center align-items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Insertar a {targetBonusQuincena === 'q1' ? 'Pago del 15' : 'Pago del 30'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top py-2.5 px-4">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowBonusModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
