import React, { useMemo, useState } from 'react';
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
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  type MonthLedger,
  type LedgerItem,
  type LedgerEntryType,
  computeQuincenaBalance,
  copyRecurringToMonth,
  createEmptyMonthLedger,
  groupLedgerExpenses,
  groupAllMonthsExpenses,
  MONTH_NAMES_ES,
} from '../lib/monthlyLedger.ts';
import { formatUSD } from '../lib/formatters.ts';
import { round2 } from '../lib/svLaborLaw.ts';
import {
  PrimeButton,
  PrimeCard,
  PrimeChart,
  PrimeCheckbox,
  PrimeDialog,
  PrimeInput,
  PrimeMessage,
  PrimeSelect,
  PrimeSelectButton,
  PrimeTag,
} from './ui/PrimeUI.tsx';

export interface LegalBonusesPayload {
  vacationBonusNet: number;
  vacationFullNet: number;
  vacationWorkedNet?: number;
  vacationWorkedExtraNet?: number;
  vacationBonusGross: number;
  aguinaldoNet: number;
  q25Net: number;
}

export type LegalBonusType =
  | 'vacation_bonus'
  | 'vacation_worked'
  | 'vacation_full'
  | 'aguinaldo'
  | 'q25';

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
  const currentMonthNum = today.getMonth() + 1;

  const [selectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  const [showBonusModal, setShowBonusModal] = useState<boolean>(false);
  const [targetBonusQuincena, setTargetBonusQuincena] = useState<'q1' | 'q2'>('q1');

  const [q1Day, setQ1Day] = useState<string>('15');
  const [q1Desc, setQ1Desc] = useState<string>('');
  const [q1Amount, setQ1Amount] = useState<string>('');
  const [q1Type, setQ1Type] = useState<LedgerEntryType>('expense');
  const [q1Recurring, setQ1Recurring] = useState<boolean>(false);

  const [q2Day, setQ2Day] = useState<string>('30');
  const [q2Desc, setQ2Desc] = useState<string>('');
  const [q2Amount, setQ2Amount] = useState<string>('');
  const [q2Type, setQ2Type] = useState<LedgerEntryType>('expense');
  const [q2Recurring, setQ2Recurring] = useState<boolean>(false);

  const [editingQ1Balance, setEditingQ1Balance] = useState<boolean>(false);
  const [customQ1Input, setCustomQ1Input] = useState<string>('');
  const [editingQ2Balance, setEditingQ2Balance] = useState<boolean>(false);
  const [customQ2Input, setCustomQ2Input] = useState<string>('');

  const [editingEntry, setEditingEntry] = useState<{
    id: string;
    quincena: 'q1' | 'q2';
    desc: string;
    amount: string;
    day: number;
    type: LedgerEntryType;
    isRecurring: boolean;
    checked: boolean;
  } | null>(null);

  const [mobileQuincenaTab, setMobileQuincenaTab] = useState<'both' | 'q1' | 'q2'>('both');

  const activeMonthLedger =
    monthLedgers.find(
      (m) =>
        m.year === selectedYear &&
        m.month === selectedMonth &&
        (m.ownerId === currentOwnerId || !currentOwnerId || !m.ownerId)
    ) ||
    monthLedgers.find((m) => m.year === selectedYear && m.month === selectedMonth) ||
    createEmptyMonthLedger(currentOwnerId, selectedYear, selectedMonth);

  const q1Balance = computeQuincenaBalance(defaultQ1NetPay, activeMonthLedger.q1);
  const q2Balance = computeQuincenaBalance(defaultQ2NetPay, activeMonthLedger.q2);

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

  const q1ExpenseItems = q1Balance.computedItems.filter((i) => i.type === 'expense');
  const q1PaidCount = q1ExpenseItems.filter((i) => Boolean(i.paid)).length;
  const q1PaidAmount = round2(
    q1ExpenseItems.filter((i) => Boolean(i.paid)).reduce((acc, i) => acc + i.amount, 0)
  );
  const q1PendingAmount = round2(q1Balance.totalExpenses - q1PaidAmount);

  const q2ExpenseItems = q2Balance.computedItems.filter((i) => i.type === 'expense');
  const q2PaidCount = q2ExpenseItems.filter((i) => Boolean(i.paid)).length;
  const q2PaidAmount = round2(
    q2ExpenseItems.filter((i) => Boolean(i.paid)).reduce((acc, i) => acc + i.amount, 0)
  );
  const q2PendingAmount = round2(q2Balance.totalExpenses - q2PaidAmount);

  const totalAvailableMonth = totalStarting + totalExtraIncome;
  const totalSobranteMonthPct =
    totalAvailableMonth > 0 ? Math.round((netRemaining / totalAvailableMonth) * 100) : 0;

  const groupedSummary = groupLedgerExpenses(activeMonthLedger);
  const allMonthsSummary = groupAllMonthsExpenses(monthLedgers, selectedYear);

  const ledgerBarChartData = useMemo(
    () => ({
      labels: ['Pago del 15 (Q1)', 'Pago del 30 (Q2)'],
      datasets: [
        {
          label: 'Disponible',
          data: [q1Available, q2Available],
          backgroundColor: '#2563eb',
          borderRadius: 6,
        },
        {
          label: 'Gastos',
          data: [q1Balance.totalExpenses, q2Balance.totalExpenses],
          backgroundColor: '#dc2626',
          borderRadius: 6,
        },
        {
          label: 'Sobrante',
          data: [Math.max(0, q1Sobrante), Math.max(0, q2Sobrante)],
          backgroundColor: '#059669',
          borderRadius: 6,
        },
      ],
    }),
    [q1Available, q2Available, q1Balance.totalExpenses, q2Balance.totalExpenses, q1Sobrante, q2Sobrante]
  );

  const handleToggleItemCheck = (itemId: string, quincena: 'q1' | 'q2') => {
    const updatedItems = activeMonthLedger[quincena].items.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: { ...activeMonthLedger[quincena], items: updatedItems },
    });
  };

  const handleToggleAllChecks = (quincena: 'q1' | 'q2', selectAll: boolean) => {
    const updatedItems = activeMonthLedger[quincena].items.map((i) =>
      i.type === 'expense' ? { ...i, checked: selectAll } : i
    );
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: { ...activeMonthLedger[quincena], items: updatedItems },
    });
  };

  const handleToggleItemPaid = (itemId: string, quincena: 'q1' | 'q2') => {
    const updatedItems = activeMonthLedger[quincena].items.map((i) =>
      i.id === itemId ? { ...i, paid: !i.paid } : i
    );
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: { ...activeMonthLedger[quincena], items: updatedItems },
    });
  };

  const handleToggleAllPaid = (quincena: 'q1' | 'q2', markAllPaid: boolean) => {
    const updatedItems = activeMonthLedger[quincena].items.map((i) =>
      i.type === 'expense' ? { ...i, paid: markAllPaid } : i
    );
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: { ...activeMonthLedger[quincena], items: updatedItems },
    });
  };

  const handleAddItem = (quincena: 'q1' | 'q2', e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = quincena === 'q1' ? q1Amount : q2Amount;
    const rawDesc = quincena === 'q1' ? q1Desc : q2Desc;
    const rawDay = quincena === 'q1' ? q1Day : q2Day;
    const rawType = quincena === 'q1' ? q1Type : q2Type;
    const rawRec = quincena === 'q1' ? q1Recurring : q2Recurring;

    const amt = parseFloat(rawAmt);
    if (!rawDesc.trim() || Number.isNaN(amt) || amt <= 0) return;

    const newItem: LedgerItem = {
      id: `${quincena}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      desc: rawDesc.trim(),
      amount: amt,
      type: rawType,
      day: parseInt(rawDay, 10) || (quincena === 'q1' ? 15 : 30),
      isRecurring: rawRec,
      checked: false,
      paid: false,
    };

    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: {
        ...activeMonthLedger[quincena],
        items: [...activeMonthLedger[quincena].items, newItem],
      },
    });

    if (quincena === 'q1') {
      setQ1Desc('');
      setQ1Amount('');
    } else {
      setQ2Desc('');
      setQ2Amount('');
    }
  };

  const handleDeleteItem = (id: string, quincena: 'q1' | 'q2') => {
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: {
        ...activeMonthLedger[quincena],
        items: activeMonthLedger[quincena].items.filter((i) => i.id !== id),
      },
    });
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
      checked: Boolean(item.checked),
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
        checked: editingEntry.checked,
      };
    });

    onSaveMonthLedger({
      ...activeMonthLedger,
      [targetQuincena]: {
        ...activeMonthLedger[targetQuincena],
        items: updatedItems,
      },
    });
    setEditingEntry(null);
  };

  const handleCancelEditItem = () => setEditingEntry(null);

  const handleSaveCustomBalance = (quincena: 'q1' | 'q2') => {
    const raw = quincena === 'q1' ? customQ1Input : customQ2Input;
    const parsed = parseFloat(raw);
    onSaveMonthLedger({
      ...activeMonthLedger,
      [quincena]: {
        ...activeMonthLedger[quincena],
        customStartingBalance: Number.isNaN(parsed) || parsed < 0 ? undefined : parsed,
      },
    });
    if (quincena === 'q1') setEditingQ1Balance(false);
    else setEditingQ2Balance(false);
  };

  const handleCopyFromPreviousMonth = () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevLedger = monthLedgers.find((m) => m.year === prevYear && m.month === prevMonth);
    if (!prevLedger) return;
    const copied = copyRecurringToMonth(prevLedger, activeMonthLedger);
    onSaveMonthLedger(copied);
  };

  const matchBonusDesc = (bonusKey: LegalBonusType, descRaw: string): boolean => {
    const desc = descRaw.toLowerCase();
    switch (bonusKey) {
      case 'vacation_bonus':
        return (
          desc.includes('recargo vacacional') ||
          (desc.includes('vacaci') &&
            desc.includes('30%') &&
            !desc.includes('trabajada') &&
            !desc.includes('completa'))
        );
      case 'vacation_worked':
        return desc.includes('trabajada');
      case 'vacation_full':
        return desc.includes('completa');
      case 'aguinaldo':
        return desc.includes('aguinaldo');
      case 'q25':
        return desc.includes('quincena 25') || desc.includes('q25');
    }
  };

  const isBonusInQuincena = (bonusKey: LegalBonusType, quincena: 'q1' | 'q2'): boolean =>
    activeMonthLedger[quincena].items.some(
      (item) => item.type === 'income' && matchBonusDesc(bonusKey, item.desc)
    );

  const handleRemoveLegalBonus = (bonusKey: LegalBonusType, quincena: 'q1' | 'q2') => {
    const updatedItems = activeMonthLedger[quincena].items.filter(
      (item) => !(item.type === 'income' && matchBonusDesc(bonusKey, item.desc))
    );
    onSaveMonthLedger({
      ...activeMonthLedger,
      ownerId: currentOwnerId,
      [quincena]: { ...activeMonthLedger[quincena], items: updatedItems },
    });
  };

  const handleMoveLegalBonus = (
    bonusKey: LegalBonusType,
    fromQ: 'q1' | 'q2',
    toQ: 'q1' | 'q2'
  ) => {
    const itemToMove = activeMonthLedger[fromQ].items.find(
      (item) => item.type === 'income' && matchBonusDesc(bonusKey, item.desc)
    );
    const newFromItems = activeMonthLedger[fromQ].items.filter((i) => i.id !== itemToMove?.id);
    const newToItems = itemToMove
      ? [
          ...activeMonthLedger[toQ].items,
          {
            ...itemToMove,
            id: `${toQ}-bonus-${bonusKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            day: toQ === 'q1' ? 15 : 30,
          },
        ]
      : activeMonthLedger[toQ].items;

    onSaveMonthLedger({
      ...activeMonthLedger,
      ownerId: currentOwnerId,
      [fromQ]: { ...activeMonthLedger[fromQ], items: newFromItems },
      [toQ]: { ...activeMonthLedger[toQ], items: newToItems },
    });
  };

  const handleAddLegalBonus = (bonusKey: LegalBonusType, quincena: 'q1' | 'q2') => {
    if (!legalBonuses) return;
    let desc = '';
    let amount = 0;
    const day = quincena === 'q1' ? 15 : 30;

    switch (bonusKey) {
      case 'vacation_bonus':
        desc = 'Recargo Vacacional 30% (Ley)';
        amount = legalBonuses.vacationBonusNet;
        break;
      case 'vacation_worked':
        desc = 'Vacación Trabajada (15d + 30% Ley)';
        amount = legalBonuses.vacationWorkedExtraNet ?? legalBonuses.vacationWorkedNet ?? 0;
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

    if (amount <= 0 || isBonusInQuincena(bonusKey, quincena)) return;

    const newItem: LedgerItem = {
      id: `${quincena}-bonus-${bonusKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      desc,
      amount,
      type: 'income',
      day,
      isRecurring: false,
    };

    onSaveMonthLedger({
      ...activeMonthLedger,
      ownerId: currentOwnerId,
      [quincena]: {
        ...activeMonthLedger[quincena],
        items: [...activeMonthLedger[quincena].items, newItem],
      },
    });
    setShowBonusModal(false);
  };

  const hasAguinaldoInMonth =
    isBonusInQuincena('aguinaldo', 'q1') || isBonusInQuincena('aguinaldo', 'q2');
  const hasQ25InMonth = isBonusInQuincena('q25', 'q1') || isBonusInQuincena('q25', 'q2');

  const renderQuincenaColumn = (quincena: 'q1' | 'q2') => {
    const isQ1 = quincena === 'q1';
    const balance = isQ1 ? q1Balance : q2Balance;
    const available = isQ1 ? q1Available : q2Available;
    const sobrante = isQ1 ? q1Sobrante : q2Sobrante;
    const sobrantePct = isQ1 ? q1SobrantePct : q2SobrantePct;
    const expenseItems = isQ1 ? q1ExpenseItems : q2ExpenseItems;
    const paidCount = isQ1 ? q1PaidCount : q2PaidCount;
    const paidAmount = isQ1 ? q1PaidAmount : q2PaidAmount;
    const pendingAmount = isQ1 ? q1PendingAmount : q2PendingAmount;
    const editingBalance = isQ1 ? editingQ1Balance : editingQ2Balance;
    const customInput = isQ1 ? customQ1Input : customQ2Input;
    const setCustomInput = isQ1 ? setCustomQ1Input : setCustomQ2Input;
    const setEditingBalance = isQ1 ? setEditingQ1Balance : setEditingQ2Balance;
    const defaultNetPay = isQ1 ? defaultQ1NetPay : defaultQ2NetPay;
    const dayVal = isQ1 ? q1Day : q2Day;
    const setDayVal = isQ1 ? setQ1Day : setQ2Day;
    const descVal = isQ1 ? q1Desc : q2Desc;
    const setDescVal = isQ1 ? setQ1Desc : setQ2Desc;
    const amountVal = isQ1 ? q1Amount : q2Amount;
    const setAmountVal = isQ1 ? setQ1Amount : setQ2Amount;
    const typeVal = isQ1 ? q1Type : q2Type;
    const setTypeVal = isQ1 ? setQ1Type : setQ2Type;
    const recVal = isQ1 ? q1Recurring : q2Recurring;
    const setRecVal = isQ1 ? setQ1Recurring : setQ2Recurring;

    const allChecked =
      expenseItems.length > 0 && expenseItems.every((i) => Boolean(i.checked));
    const allPaid = expenseItems.length > 0 && paidCount === expenseItems.length;

    return (
      <div
        className={
          mobileQuincenaTab !== 'both' && mobileQuincenaTab !== quincena
            ? 'hidden lg:block'
            : ''
        }
      >
        <PrimeCard className="h-full flex flex-col justify-between">
          <div>
            {/* Cabecera */}
            <div className="p-3.5 border-b border-[var(--color-rule)] bg-[var(--color-surface)] flex justify-between items-center gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h6 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-1.5 m-0">
                    <Calendar size={15} className="text-[var(--color-muted)]" />
                    <span>{isQ1 ? 'Pago del 15' : 'Pago del 30'}</span>
                  </h6>
                  <PrimeButton
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setTargetBonusQuincena(quincena);
                      setShowBonusModal(true);
                    }}
                    title="Agregar bono de ley a esta quincena"
                  >
                    <Plus size={10} />
                    <span>Bono</span>
                  </PrimeButton>
                  <PrimeTag severity={sobrante >= 0 ? 'success' : 'danger'} className="font-mono">
                    Sobrante: {formatUSD(sobrante)} ({sobrantePct}%)
                  </PrimeTag>
                </div>
                <span className="text-[11px] text-[var(--color-muted)]">
                  {isQ1
                    ? `Gastos del 15 al 29 de ${MONTH_NAMES_ES[selectedMonth - 1]}`
                    : 'Gastos del 30 al 14'}
                </span>
              </div>

              <div className="text-right shrink-0">
                {editingBalance ? (
                  <div className="flex items-center gap-1">
                    <PrimeInput
                      type="number"
                      inputSize="sm"
                      mono
                      step="0.01"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder={defaultNetPay.toFixed(2)}
                      className="w-[88px]"
                    />
                    <PrimeButton
                      variant="secondary"
                      size="xs"
                      onClick={() => handleSaveCustomBalance(quincena)}
                    >
                      OK
                    </PrimeButton>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInput(balance.startingBalance.toFixed(2));
                      setEditingBalance(true);
                    }}
                    className="text-right bg-transparent border-0 p-0 cursor-pointer hover:opacity-80"
                    title="Editar saldo inicial de la quincena"
                  >
                    <span className="text-[10px] text-[var(--color-muted)] block">
                      Saldo inicial:
                    </span>
                    <strong className="text-[var(--color-ink)] font-mono text-sm">
                      {formatUSD(balance.startingBalance)}
                    </strong>
                  </button>
                )}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[var(--color-muted)] text-[11px]">
                    <th className="py-2 px-2 text-center w-[34px]">
                      <PrimeCheckbox
                        checked={allChecked}
                        onChange={(val) => handleToggleAllChecks(quincena, val)}
                        title="Marcar o desmarcar todos para suma agrupada"
                      />
                    </th>
                    <th className="py-2 px-1.5 text-center w-[40px]">
                      <button
                        type="button"
                        onClick={() => handleToggleAllPaid(quincena, !allPaid)}
                        className="bg-transparent border-0 p-0 text-[var(--color-muted)] hover:text-[var(--color-ink)] font-sans font-semibold text-[11px] cursor-pointer"
                        title="Marcar o desmarcar todos los gastos como pagados"
                      >
                        Pag.
                      </button>
                    </th>
                    <th className="py-2 px-2">Saldo</th>
                    <th className="py-2 px-2">Monto</th>
                    <th className="py-2 px-2 font-sans">Descripción</th>
                    <th className="py-2 px-2 text-center">Día</th>
                    <th className="py-2 px-2 w-[56px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)]">
                  <tr className="bg-[var(--color-surface)] text-[var(--color-muted)]">
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-1.5 text-center">—</td>
                    <td className="py-2 px-2 font-bold text-[var(--color-ink)]">
                      {formatUSD(balance.startingBalance)}
                    </td>
                    <td className="py-2 px-2">—</td>
                    <td className="py-2 px-2 font-sans text-[11px]">Saldo inicial (Salario Neto)</td>
                    <td className="py-2 px-2 text-center">{isQ1 ? 15 : 30}</td>
                    <td className="py-2 px-2"></td>
                  </tr>

                  {balance.computedItems.map((item) => {
                    const isIncome = item.type === 'income';
                    const isEditing = editingEntry?.id === item.id;
                    const isPaid = !isIncome && Boolean(item.paid);

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="bg-[var(--color-surface)]">
                          <td className="py-2 px-2 text-center">
                            {editingEntry.type === 'expense' ? (
                              <PrimeCheckbox
                                checked={editingEntry.checked}
                                onChange={(val) =>
                                  setEditingEntry({ ...editingEntry, checked: val })
                                }
                              />
                            ) : (
                              <span className="text-[var(--color-muted)]">—</span>
                            )}
                          </td>
                          <td className="py-2 px-1.5 text-center text-[var(--color-muted)]">—</td>
                          <td className="py-2 px-2 text-[var(--color-muted)] font-sans">—</td>
                          <td className="py-1.5 px-1.5">
                            <PrimeInput
                              type="number"
                              inputSize="sm"
                              mono
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
                              className="min-w-[68px] max-w-[92px]"
                              autoFocus
                            />
                          </td>
                          <td className="py-1.5 px-1.5 font-sans">
                            <PrimeInput
                              type="text"
                              inputSize="sm"
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
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <PrimeInput
                              type="number"
                              inputSize="sm"
                              mono
                              min="1"
                              max="31"
                              value={editingEntry.day}
                              onChange={(e) =>
                                setEditingEntry({
                                  ...editingEntry,
                                  day: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-[46px] text-center mx-auto"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1">
                              <PrimeButton
                                variant="ghost"
                                size="xs"
                                className="p-1 text-[var(--color-emerald)]"
                                onClick={handleSaveEditItem}
                                title="Guardar cambios"
                              >
                                <Check size={14} />
                              </PrimeButton>
                              <PrimeButton
                                variant="ghost"
                                size="xs"
                                className="p-1"
                                onClick={handleCancelEditItem}
                                title="Cancelar edición"
                              >
                                <X size={14} />
                              </PrimeButton>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={item.id}
                        className={isPaid ? 'bg-[var(--color-surface)] text-[var(--color-muted)]' : ''}
                      >
                        <td className="py-2 px-2 text-center">
                          {!isIncome ? (
                            <PrimeCheckbox
                              checked={Boolean(item.checked)}
                              onChange={() => handleToggleItemCheck(item.id, quincena)}
                              title={
                                item.checked
                                  ? 'Marcado para agrupar'
                                  : 'Clic para incluir en suma agrupada'
                              }
                            />
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          {!isIncome ? (
                            <button
                              type="button"
                              onClick={() => handleToggleItemPaid(item.id, quincena)}
                              className={`w-5 h-5 rounded-full border inline-flex items-center justify-center cursor-pointer transition-colors ${
                                isPaid
                                  ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                                  : 'bg-transparent border-[var(--color-rule)] text-transparent hover:border-[var(--color-muted)]'
                              }`}
                              title={
                                isPaid
                                  ? 'Pagado (clic para marcar pendiente)'
                                  : 'Pendiente (clic para marcar pagado)'
                              }
                              aria-label={isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                            >
                              {isPaid && <Check size={11} strokeWidth={3} />}
                            </button>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td
                          className={`py-2 px-2 font-semibold ${
                            isPaid ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
                          }`}
                        >
                          {formatUSD(item.runningBalance)}
                        </td>
                        <td
                          className={`py-2 px-2 font-semibold ${
                            isIncome
                              ? 'text-[var(--color-emerald)]'
                              : isPaid
                                ? 'text-[var(--color-muted)]'
                                : 'text-[var(--color-ink)]'
                          }`}
                        >
                          {isIncome ? `+${formatUSD(item.amount)}` : `-${formatUSD(item.amount)}`}
                        </td>
                        <td className="py-2 px-2 font-sans">
                          <span className={isPaid ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-ink)]'}>
                            {item.desc}
                          </span>
                          {item.isRecurring && (
                            <PrimeTag severity="neutral" className="ml-1 text-[9px] py-0 px-1.5">
                              Fijo
                            </PrimeTag>
                          )}
                          {isPaid && (
                            <PrimeTag severity="success" className="ml-1 text-[9px] py-0 px-1.5">
                              Pagado
                            </PrimeTag>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-[var(--color-muted)]">
                          {item.day}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <div className="inline-flex gap-0.5">
                            <PrimeButton
                              variant="ghost"
                              size="xs"
                              className="p-1"
                              onClick={() => handleStartEditItem(item, quincena)}
                              title="Editar partida"
                            >
                              <Pencil size={12} />
                            </PrimeButton>
                            <PrimeButton
                              variant="ghost"
                              size="xs"
                              className="p-1 text-[var(--color-danger)]"
                              onClick={() => handleDeleteItem(item.id, quincena)}
                              title="Eliminar partida"
                            >
                              <Trash2 size={12} />
                            </PrimeButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {balance.computedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[var(--color-muted)] font-sans">
                        Sin gastos registrados en la {isQ1 ? '1.ª' : '2.ª'} quincena. Agrega uno abajo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            {/* Formulario inline */}
            <form
              onSubmit={(e) => handleAddItem(quincena, e)}
              className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-rule)] space-y-2"
            >
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-3 sm:col-span-2">
                  <PrimeInput
                    type="number"
                    inputSize="sm"
                    mono
                    min="1"
                    max="31"
                    value={dayVal}
                    onChange={(e) => setDayVal(e.target.value)}
                    placeholder="Día"
                    className="text-center"
                  />
                </div>
                <div className="col-span-9 sm:col-span-4">
                  <PrimeInput
                    type="text"
                    inputSize="sm"
                    required
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    placeholder={isQ1 ? 'Descripción (ej. Luz, Tarjeta)' : 'Descripción (ej. Alquiler, Agua)'}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <PrimeInput
                    type="number"
                    inputSize="sm"
                    mono
                    step="0.01"
                    min="0.01"
                    required
                    value={amountVal}
                    onChange={(e) => setAmountVal(e.target.value)}
                    placeholder="$0.00"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3 flex gap-1">
                  <PrimeSelect
                    selectSize="sm"
                    value={typeVal}
                    onChange={(e) => setTypeVal(e.target.value as LedgerEntryType)}
                  >
                    <option value="expense">Gasto (-)</option>
                    <option value="income">Ingreso (+)</option>
                  </PrimeSelect>
                  <PrimeButton type="submit" variant="secondary" size="xs" title="Agregar movimiento">
                    <Plus size={14} />
                  </PrimeButton>
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] cursor-pointer">
                <PrimeCheckbox checked={recVal} onChange={setRecVal} />
                <span>Gasto fijo mensual (recurrente)</span>
              </label>
            </form>

            {/* Sobrante Footer */}
            <div
              className={`p-3.5 border-t flex justify-between items-center gap-3 ${
                sobrante >= 0
                  ? 'bg-[var(--color-emerald-soft)] border-[var(--color-emerald)]/30'
                  : 'bg-[var(--color-danger-soft)] border-[var(--color-danger)]/30'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-[var(--color-ink)] block">
                  Sobrante de la {isQ1 ? '1.ª' : '2.ª'} Quincena ({isQ1 ? 'Pago del 15' : 'Pago del 30'})
                </span>
                <span className="text-[11px] text-[var(--color-ink-2)] block">
                  Te sobran {formatUSD(sobrante)} de {formatUSD(available)} disponibles ({sobrantePct}% libre)
                </span>
                {expenseItems.length > 0 && (
                  <span className="text-[10.5px] font-mono text-[var(--color-ink-2)] block mt-0.5">
                    Pagados: {paidCount}/{expenseItems.length} ({formatUSD(paidAmount)}) · Pendiente:{' '}
                    {formatUSD(pendingAmount)}
                  </span>
                )}
              </div>
              <span
                className={`text-2xl font-bold font-mono shrink-0 ${
                  sobrante >= 0 ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'
                }`}
              >
                {formatUSD(sobrante)}
              </span>
            </div>
          </div>
        </PrimeCard>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Navegación de Meses */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full pb-1">
          <PrimeButton
            variant="outline"
            size="xs"
            onClick={() => setSelectedMonth((prev) => (prev > 1 ? prev - 1 : 12))}
          >
            <ChevronLeft size={14} />
          </PrimeButton>

          {MONTH_NAMES_ES.map((mName, idx) => {
            const mNum = idx + 1;
            const isSelected = selectedMonth === mNum;
            const hasSaved = monthLedgers.some(
              (l) => l.year === selectedYear && l.month === mNum && (l.q1.items.length > 0 || l.q2.items.length > 0)
            );
            return (
              <PrimeButton
                key={mName}
                size="xs"
                variant={isSelected ? 'secondary' : 'outline'}
                className="relative shrink-0"
                onClick={() => setSelectedMonth(mNum)}
              >
                <span>{mName.slice(0, 3)}</span>
                {hasSaved && !isSelected && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[var(--color-emerald)] inline-block" />
                )}
              </PrimeButton>
            );
          })}

          <PrimeButton
            variant="outline"
            size="xs"
            onClick={() => setSelectedMonth((prev) => (prev < 12 ? prev + 1 : 1))}
          >
            <ChevronRight size={14} />
          </PrimeButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {legalBonuses && (
            <PrimeButton
              variant="outline"
              size="xs"
              onClick={() => {
                setTargetBonusQuincena('q1');
                setShowBonusModal(true);
              }}
            >
              <Gift size={13} className="text-[var(--color-emerald)]" />
              <span>+ Bono de Ley</span>
            </PrimeButton>
          )}
          <PrimeTag severity="success" className="font-mono">
            <CheckCircle2 size={12} />
            <span>Sincronizado</span>
          </PrimeTag>
          <PrimeButton
            variant="outline"
            size="xs"
            onClick={handleCopyFromPreviousMonth}
            title="Copiar gastos marcados como fijos del mes anterior"
          >
            <Copy size={13} />
            <span>
              Copiar fijos de {selectedMonth === 1 ? 'Diciembre' : MONTH_NAMES_ES[selectedMonth - 2]}
            </span>
          </PrimeButton>
        </div>
      </div>

      {/* Sugerencias Contextuales */}
      {selectedMonth === 12 && !hasAguinaldoInMonth && legalBonuses && (
        <PrimeMessage severity="warning" icon={<Gift size={16} />}>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span>
              <strong>Diciembre:</strong> Mes de Aguinaldo de Ley (<strong>+{formatUSD(legalBonuses.aguinaldoNet)}</strong> estimado neto).
            </span>
            <div className="flex gap-1.5">
              <PrimeButton size="xs" variant="secondary" onClick={() => handleAddLegalBonus('aguinaldo', 'q1')}>
                + Pago del 15
              </PrimeButton>
              <PrimeButton size="xs" variant="outline" onClick={() => handleAddLegalBonus('aguinaldo', 'q2')}>
                + Pago del 30
              </PrimeButton>
            </div>
          </div>
        </PrimeMessage>
      )}

      {selectedMonth === 6 && !hasQ25InMonth && legalBonuses && (
        <PrimeMessage severity="info" icon={<Gift size={16} />}>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span>
              <strong>Junio:</strong> Mes de Quincena 25 (<strong>+{formatUSD(legalBonuses.q25Net)}</strong> estimado neto).
            </span>
            <div className="flex gap-1.5">
              <PrimeButton size="xs" variant="secondary" onClick={() => handleAddLegalBonus('q25', 'q1')}>
                + Pago del 15
              </PrimeButton>
              <PrimeButton size="xs" variant="outline" onClick={() => handleAddLegalBonus('q25', 'q2')}>
                + Pago del 30
              </PrimeButton>
            </div>
          </div>
        </PrimeMessage>
      )}

      {/* Resumen Mensual + Mini Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <PrimeCard padded className="lg:col-span-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[11px] text-[var(--color-muted)] font-sans block">
                Ingreso salarial ({MONTH_NAMES_ES[selectedMonth - 1]}):
              </span>
              <strong className="text-base text-[var(--color-ink)]">{formatUSD(totalStarting)}</strong>
            </div>
            <div>
              <span className="text-[11px] text-[var(--color-muted)] font-sans block">
                Ingresos extra:
              </span>
              <strong className="text-base text-[var(--color-emerald)]">
                +{formatUSD(totalExtraIncome)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-[var(--color-muted)] font-sans block">
                Total gastos mes:
              </span>
              <strong className="text-base text-[var(--color-danger)]">
                -{formatUSD(totalExpenses)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-[var(--color-muted)] font-sans block">
                Sobrante total:
              </span>
              <strong
                className={`text-base ${
                  netRemaining >= 0 ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'
                }`}
              >
                {formatUSD(netRemaining)}
              </strong>
              <span className="text-[10px] text-[var(--color-muted)] font-sans block">
                ({totalSobranteMonthPct}% libre)
              </span>
            </div>
          </div>
        </PrimeCard>

        <PrimeCard padded className="lg:col-span-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)] mb-1">
            <BarChart3 size={14} className="text-[var(--color-accent)]" />
            <span>Comparativa Quincenal</span>
          </div>
          <PrimeChart type="bar" data={ledgerBarChartData} height={115} />
        </PrimeCard>
      </div>

      {/* Móvil Switcher */}
      <div className="lg:hidden">
        <PrimeSelectButton
          fullWidth
          value={mobileQuincenaTab}
          onChange={setMobileQuincenaTab}
          options={[
            { value: 'both', label: 'Ambas quincenas' },
            { value: 'q1', label: 'Pago del 15' },
            { value: 'q2', label: 'Pago del 30' },
          ]}
        />
      </div>

      {/* Panel de Prestaciones de Ley Opcionales */}
      {legalBonuses && (
        <PrimeCard padded>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-[var(--color-emerald)] shrink-0" />
              <div>
                <h6 className="text-xs font-bold text-[var(--color-ink)] m-0">
                  Prestaciones e Ingresos Extraordinarios (Opcional) — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
                </h6>
                <span className="text-[11px] text-[var(--color-muted)]">
                  Agrega prestaciones de ley a la quincena que decidas sin alterar tu salario base ordinario.
                </span>
              </div>
            </div>
            <PrimeButton
              variant="outline"
              size="xs"
              onClick={() => {
                setTargetBonusQuincena('q1');
                setShowBonusModal(true);
              }}
            >
              <Plus size={13} />
              <span>Ver todas</span>
            </PrimeButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {[
              {
                key: 'vacation_bonus' as const,
                title: 'Recargo Vacación (30%)',
                amount: legalBonuses.vacationBonusNet,
                note: '30% prima neta · Sin interrumpir labores',
              },
              {
                key: 'vacation_worked' as const,
                title: 'Vacación Trabajada',
                amount: legalBonuses.vacationWorkedExtraNet ?? legalBonuses.vacationWorkedNet ?? 0,
                note: '15d laborados + 30% prima',
              },
              {
                key: 'aguinaldo' as const,
                title: 'Aguinaldo Legal',
                amount: legalBonuses.aguinaldoNet,
                note: 'Exento renta hasta $1,500',
              },
              {
                key: 'q25' as const,
                title: 'Quincena 25',
                amount: legalBonuses.q25Net,
                note: 'Decreto 499 · 100% exento',
              },
            ].map((b) => {
              const inQ1 = isBonusInQuincena(b.key, 'q1');
              const inQ2 = isBonusInQuincena(b.key, 'q2');
              return (
                <div
                  key={b.key}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 ${
                    inQ1 || inQ2
                      ? 'bg-[var(--color-emerald-soft)] border-[var(--color-emerald)]/40'
                      : 'bg-[var(--color-card)] border-[var(--color-rule)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-0.5">
                      <strong className="text-xs text-[var(--color-ink)]">{b.title}</strong>
                      <span className="font-mono font-bold text-xs text-[var(--color-emerald)]">
                        +{formatUSD(b.amount)}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[var(--color-muted)] block">{b.note}</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-rule)]">
                    {inQ1 ? (
                      <div className="flex items-center justify-between gap-1">
                        <PrimeTag severity="success">En Pago 15</PrimeTag>
                        <div className="flex gap-1">
                          <PrimeButton size="xs" variant="outline" onClick={() => handleMoveLegalBonus(b.key, 'q1', 'q2')}>
                            A 30
                          </PrimeButton>
                          <PrimeButton size="xs" variant="ghost" className="text-[var(--color-danger)]" onClick={() => handleRemoveLegalBonus(b.key, 'q1')}>
                            Quitar
                          </PrimeButton>
                        </div>
                      </div>
                    ) : inQ2 ? (
                      <div className="flex items-center justify-between gap-1">
                        <PrimeTag severity="success">En Pago 30</PrimeTag>
                        <div className="flex gap-1">
                          <PrimeButton size="xs" variant="outline" onClick={() => handleMoveLegalBonus(b.key, 'q2', 'q1')}>
                            A 15
                          </PrimeButton>
                          <PrimeButton size="xs" variant="ghost" className="text-[var(--color-danger)]" onClick={() => handleRemoveLegalBonus(b.key, 'q2')}>
                            Quitar
                          </PrimeButton>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <PrimeButton size="xs" variant="secondary" onClick={() => handleAddLegalBonus(b.key, 'q1')}>
                          + Pago 15
                        </PrimeButton>
                        <PrimeButton size="xs" variant="outline" onClick={() => handleAddLegalBonus(b.key, 'q2')}>
                          + Pago 30
                        </PrimeButton>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PrimeCard>
      )}

      {/* Doble Columna Quincenal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {renderQuincenaColumn('q1')}
        {renderQuincenaColumn('q2')}
      </div>

      {/* Suma Total de Gastos Agrupados del Mes */}
      <PrimeCard>
        <div className="px-4 py-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)] flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Layers size={16} className="text-[var(--color-accent)]" />
            <h6 className="text-sm font-bold text-[var(--color-ink)] m-0">
              Suma Total de Gastos Agrupados — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h6>
            <PrimeTag severity="neutral" className="font-mono">
              {groupedSummary.groups.length} conceptos · {groupedSummary.totalGroupedCount} partidas
            </PrimeTag>
          </div>
          <span className="font-mono font-bold text-sm text-[var(--color-danger)]">
            -{formatUSD(groupedSummary.totalGroupedAmount)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                <th className="py-2.5 px-4 font-sans">Concepto</th>
                <th className="py-2.5 px-4 text-right">Pago del 15</th>
                <th className="py-2.5 px-4 text-right">Pago del 30</th>
                <th className="py-2.5 px-4 text-center font-sans">Partidas</th>
                <th className="py-2.5 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-rule)]">
              {groupedSummary.groups.map((g) => (
                <tr key={g.key}>
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--color-ink)]">{g.desc}</td>
                  <td className="py-2.5 px-4 text-right text-[var(--color-muted)]">{formatUSD(g.q1Amount)}</td>
                  <td className="py-2.5 px-4 text-right text-[var(--color-muted)]">{formatUSD(g.q2Amount)}</td>
                  <td className="py-2.5 px-4 text-center text-[var(--color-muted)]">{g.count}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-[var(--color-ink)]">
                    {formatUSD(g.totalAmount)}
                  </td>
                </tr>
              ))}
              {groupedSummary.groups.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--color-muted)] font-sans">
                    Marca la primera casilla de cualquier gasto para sumarlo por concepto aquí.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PrimeCard>

      {/* Resumen Anual Agrupado */}
      <PrimeCard>
        <div className="px-4 py-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)] flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Layers size={16} className="text-[var(--color-emerald)]" />
            <h6 className="text-sm font-bold text-[var(--color-ink)] m-0">
              Consolidado Anual Agrupado ({selectedYear})
            </h6>
            <PrimeTag severity="neutral" className="font-mono">
              {allMonthsSummary.monthsRepresented.length} meses · {allMonthsSummary.totalGroupedCount} partidas
            </PrimeTag>
          </div>
          <span className="font-mono font-bold text-sm text-[var(--color-danger)]">
            -{formatUSD(allMonthsSummary.totalGroupedAmount)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                <th className="py-2.5 px-4 font-sans">Concepto</th>
                <th className="py-2.5 px-4 font-sans">Desglose por mes</th>
                <th className="py-2.5 px-4 text-center font-sans">Meses</th>
                <th className="py-2.5 px-4 text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-rule)]">
              {allMonthsSummary.groups.map((group) => {
                const pctOfTotal =
                  allMonthsSummary.totalGroupedAmount > 0
                    ? Math.round((group.totalAmount / allMonthsSummary.totalGroupedAmount) * 100)
                    : 0;
                return (
                  <tr key={group.key}>
                    <td className="py-2.5 px-4 font-sans font-semibold text-[var(--color-ink)]">
                      {group.desc}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {group.monthsList.map((m) => (
                          <PrimeTag key={m.month} severity="neutral" className="font-mono">
                            {m.name.slice(0, 3)}: {formatUSD(m.amount)}
                          </PrimeTag>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center text-[var(--color-muted)] font-sans">
                      {group.monthsCount} {group.monthsCount === 1 ? 'mes' : 'meses'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-bold text-[var(--color-ink)] block">
                        {formatUSD(group.totalAmount)}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)] font-sans">
                        {pctOfTotal}% del acumulado
                      </span>
                    </td>
                  </tr>
                );
              })}
              {allMonthsSummary.groups.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--color-muted)] font-sans">
                    No hay gastos marcados en {selectedYear}. Activa la primera casilla en cualquier mes para ver el acumulado anual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PrimeCard>

      {/* Modal PrimeDialog para Bonos de Ley */}
      <PrimeDialog
        open={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Gift size={16} className="text-[var(--color-emerald)]" />
            <span>
              Agregar Ingreso por Bonos de Ley — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </span>
          </span>
        }
        footer={
          <PrimeButton variant="outline" size="sm" onClick={() => setShowBonusModal(false)}>
            Cerrar
          </PrimeButton>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-muted)] m-0">
            Selecciona la quincena de destino y el bono de ley a incorporar. Los montos aplican las deducciones legales vigentes de El Salvador.
          </p>

          <div className="surface-well p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-ink)]">Asignar a:</span>
            <PrimeSelectButton
              value={targetBonusQuincena}
              onChange={setTargetBonusQuincena}
              options={[
                { value: 'q1', label: 'Pago del 15 (1.ª Quincena)' },
                { value: 'q2', label: 'Pago del 30 (2.ª Quincena)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'vacation_bonus' as const,
                badge: 'Vacación (Solo Recargo 30%)',
                severity: 'success' as const,
                amount: legalBonuses?.vacationBonusNet ?? 0,
                desc: 'Prima del 30% con deducciones de AFP, ISSS y renta marginal, sin interrumpir labores.',
              },
              {
                key: 'vacation_worked' as const,
                badge: 'Vacación Trabajada (15d + 30%)',
                severity: 'success' as const,
                amount: legalBonuses?.vacationWorkedExtraNet ?? legalBonuses?.vacationWorkedNet ?? 0,
                desc: 'Beneficio neto adicional al laborar el período vacacional (15d compensados + 30% prima).',
              },
              {
                key: 'vacation_full' as const,
                badge: 'Vacación Completa (Adelantada)',
                severity: 'info' as const,
                amount: legalBonuses?.vacationFullNet ?? 0,
                desc: 'Pago adelantado de 15 días de descanso más el 30% con deducciones aplicadas.',
              },
              {
                key: 'aguinaldo' as const,
                badge: 'Aguinaldo de Ley (Diciembre)',
                severity: 'warning' as const,
                amount: legalBonuses?.aguinaldoNet ?? 0,
                desc: 'Prestación anual obligatoria según antigüedad. Exenta de ISR hasta $1,500.',
              },
              {
                key: 'q25' as const,
                badge: 'Quincena 25 (Decreto 499)',
                severity: 'neutral' as const,
                amount: legalBonuses?.q25Net ?? 0,
                desc: 'Compensación quincenal libre de descuentos (hasta 2 salarios mínimos del sector comercio).',
              },
            ].map((card) => (
              <div
                key={card.key}
                className="p-3.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <PrimeTag severity={card.severity}>{card.badge}</PrimeTag>
                    <span className="text-base font-bold font-mono text-[var(--color-emerald)]">
                      +{formatUSD(card.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] m-0">{card.desc}</p>
                </div>

                <PrimeButton
                  variant="secondary"
                  size="xs"
                  fullWidth
                  onClick={() => handleAddLegalBonus(card.key, targetBonusQuincena)}
                >
                  <Plus size={13} />
                  <span>Insertar a {targetBonusQuincena === 'q1' ? 'Pago del 15' : 'Pago del 30'}</span>
                </PrimeButton>
              </div>
            ))}
          </div>
        </div>
      </PrimeDialog>
    </div>
  );
}
