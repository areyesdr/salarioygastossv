import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  RotateCcw,
  Wallet,
  Target,
  Check,
  Clock,
  BookOpen,
  ListFilter,
  Pencil,
  X,
  PieChart,
} from 'lucide-react';
import { round2 } from '../lib/svLaborLaw.ts';
import { MonthlyLedgerView, type LegalBonusesPayload } from './MonthlyLedgerView.tsx';
import type { MonthLedger } from '../lib/monthlyLedger.ts';
import {
  PrimeButton,
  PrimeCard,
  PrimeChart,
  PrimeInput,
  PrimeProgressBar,
  PrimeSelect,
  PrimeSelectButton,
  PrimeSwitch,
  PrimeTag,
} from './ui/PrimeUI.tsx';

import { type ExpenseCategory, EXPENSE_CATEGORIES } from '../lib/monthlyLedger.ts';
export { type ExpenseCategory, EXPENSE_CATEGORIES };

export type ExpenseCycle = 'quincena_1' | 'quincena_2' | 'mensual';

export interface ExpenseItem {
  id: string;
  ownerId: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  cycle: ExpenseCycle;
  isFixed: boolean;
  paid: boolean;
}

export interface BonusGoalItem {
  id: string;
  ownerId: string;
  title: string;
  source: 'quincena25' | 'vacacion' | 'aguinaldo' | 'pool';
  amount: number;
}

const CHART_PALETTE = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#4f46e5',
  '#10b981',
  '#64748b',
];

interface ExpensesViewProps {
  monthlyNetPay: number;
  netHourly: number;
  totalHoursPerMonth: number;
  expenseSummary: {
    totalMonthlyExpenses: number;
    q1Total: number;
    q2Total: number;
    monthlySplitTotal: number;
    fixedTotal: number;
    variableTotal: number;
    remainingMonthly: number;
    remainingQ1: number;
    remainingQ2: number;
    totalHoursRequired: number;
    byCategory: Record<ExpenseCategory, number>;
  };
  annualBonusesSummary: {
    vacNet: number;
    agNet: number;
    q25Net: number;
    totalAnnualNetBonuses: number;
    totalAnnualGrossBonuses: number;
    allocatedTotal: number;
    unallocated: number;
  };
  filteredExpenses: ExpenseItem[];
  expenseFilterCycle: 'all' | ExpenseCycle;
  setExpenseFilterCycle: (v: 'all' | ExpenseCycle) => void;
  newExpName: string;
  setNewExpName: (v: string) => void;
  newExpAmount: string;
  setNewExpAmount: (v: string) => void;
  newExpCategory: ExpenseCategory;
  setNewExpCategory: (v: ExpenseCategory) => void;
  newExpCycle: ExpenseCycle;
  setNewExpCycle: (v: ExpenseCycle) => void;
  newExpFixed: boolean;
  setNewExpFixed: (v: boolean) => void;
  onAddExpense: (e: React.FormEvent) => void;
  onToggleExpensePaid: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense?: (updated: ExpenseItem) => void;
  onResetDefaultExpenses: () => void;
  bonusGoals: BonusGoalItem[];
  newGoalTitle: string;
  setNewGoalTitle: (v: string) => void;
  newGoalAmount: string;
  setNewGoalAmount: (v: string) => void;
  newGoalSource: BonusGoalItem['source'];
  setNewGoalSource: (v: BonusGoalItem['source']) => void;
  onAddBonusGoal: (e: React.FormEvent) => void;
  onDeleteBonusGoal: (id: string) => void;
  formatUSD: (val: number) => string;
  formatHours: (val: number) => string;
  currentOwnerId?: string;
  defaultQ1NetPay?: number;
  defaultQ2NetPay?: number;
  monthLedgers?: MonthLedger[];
  onSaveMonthLedger?: (updated: MonthLedger) => void;
  legalBonuses?: LegalBonusesPayload;
}

export function ExpensesView({
  monthlyNetPay,
  netHourly,
  totalHoursPerMonth,
  expenseSummary,
  annualBonusesSummary,
  filteredExpenses,
  expenseFilterCycle,
  setExpenseFilterCycle,
  newExpName,
  setNewExpName,
  newExpAmount,
  setNewExpAmount,
  newExpCategory,
  setNewExpCategory,
  newExpCycle,
  setNewExpCycle,
  newExpFixed,
  setNewExpFixed,
  onAddExpense,
  onToggleExpensePaid,
  onDeleteExpense,
  onUpdateExpense,
  onResetDefaultExpenses,
  bonusGoals,
  newGoalTitle,
  setNewGoalTitle,
  newGoalAmount,
  setNewGoalAmount,
  newGoalSource,
  setNewGoalSource,
  onAddBonusGoal,
  onDeleteBonusGoal,
  formatUSD,
  formatHours,
  currentOwnerId = 'usr-sv-01',
  defaultQ1NetPay,
  defaultQ2NetPay,
  monthLedgers = [],
  onSaveMonthLedger = () => {},
  legalBonuses,
}: ExpensesViewProps) {
  const [activeSubView, setActiveSubView] = useState<'ledger' | 'catalog'>('ledger');

  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('Vivienda');
  const [editCycle, setEditCycle] = useState<ExpenseCycle>('mensual');
  const [editFixed, setEditFixed] = useState<boolean>(true);

  const handleStartEditExpense = (item: ExpenseItem) => {
    setEditingExpId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditCategory(item.category);
    setEditCycle(item.cycle);
    setEditFixed(item.isFixed);
  };

  const handleCancelEditExpense = () => setEditingExpId(null);

  const handleSaveEditExpense = (item: ExpenseItem) => {
    const amt = parseFloat(editAmount);
    if (!editName.trim() || Number.isNaN(amt) || amt <= 0) return;
    if (onUpdateExpense) {
      onUpdateExpense({
        ...item,
        name: editName.trim(),
        amount: round2(amt),
        category: editCategory,
        cycle: editCycle,
        isFixed: editFixed,
      });
    }
    setEditingExpId(null);
  };

  const resolvedQ1Pay = defaultQ1NetPay ?? round2(monthlyNetPay / 2);
  const resolvedQ2Pay = defaultQ2NetPay ?? round2(monthlyNetPay - resolvedQ1Pay);

  const activeCategories = EXPENSE_CATEGORIES.filter((cat) => expenseSummary.byCategory[cat] > 0);
  const categoryChartData = useMemo(
    () => ({
      labels: activeCategories,
      datasets: [
        {
          data: activeCategories.map((c) => expenseSummary.byCategory[c]),
          backgroundColor: activeCategories.map((_, idx) => CHART_PALETTE[idx % CHART_PALETTE.length]),
          borderWidth: 0,
        },
      ],
    }),
    [activeCategories, expenseSummary.byCategory]
  );

  return (
    <motion.div
      key="tab-expenses"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Switcher de Subvista */}
      <PrimeCard padded className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h5 className="text-base font-bold text-[var(--color-ink)] mb-0.5">
            Control de Gastos y Presupuesto Quincenal
          </h5>
          <p className="text-xs text-[var(--color-muted)] m-0">
            {activeSubView === 'ledger'
              ? 'Libreta mensual por quincenas (Pago del 15 y 30) con cálculo de saldo y sobrante en tiempo real.'
              : 'Catálogo de compromisos fijos/recurrentes, costo en horas laborales y metas de bonos.'}
          </p>
        </div>

        <PrimeSelectButton
          value={activeSubView}
          onChange={setActiveSubView}
          options={[
            {
              value: 'ledger',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  <span>Libreta Quincenal</span>
                </span>
              ),
            },
            {
              value: 'catalog',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <ListFilter size={14} />
                  <span>Gastos Fijos y Horas</span>
                </span>
              ),
            },
          ]}
        />
      </PrimeCard>

      {activeSubView === 'ledger' ? (
        <MonthlyLedgerView
          currentOwnerId={currentOwnerId}
          defaultQ1NetPay={resolvedQ1Pay}
          defaultQ2NetPay={resolvedQ2Pay}
          monthLedgers={monthLedgers}
          onSaveMonthLedger={onSaveMonthLedger}
          legalBonuses={legalBonuses}
          netHourly={netHourly}
          totalHoursPerMonth={totalHoursPerMonth}
          formatHours={formatHours}
          formatUSD={formatUSD}
          fixedTemplateExpenses={filteredExpenses}
        />
      ) : (
        <div className="space-y-5">
          {/* 4 Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <PrimeCard padded className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--color-muted)] font-medium block">
                  Disponible mensual
                </span>
                <div
                  className={`text-2xl font-bold font-mono my-1 ${
                    expenseSummary.remainingMonthly >= 0
                      ? 'text-[var(--color-emerald)]'
                      : 'text-[var(--color-danger)]'
                  }`}
                >
                  {formatUSD(expenseSummary.remainingMonthly)}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] font-mono">
                Gastos: {formatUSD(expenseSummary.totalMonthlyExpenses)} de {formatUSD(monthlyNetPay)}
              </span>
            </PrimeCard>

            <PrimeCard padded className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--color-muted)] font-medium block">
                  Balance 1.ª Quincena (Día 15)
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--color-ink)] my-1">
                  {formatUSD(expenseSummary.remainingQ1)}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] font-mono">
                Compromisos Q1: {formatUSD(expenseSummary.q1Total)}
              </span>
            </PrimeCard>

            <PrimeCard padded className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--color-muted)] font-medium block">
                  Balance 2.ª Quincena (Fin de mes)
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--color-ink)] my-1">
                  {formatUSD(expenseSummary.remainingQ2)}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] font-mono">
                Compromisos Q2: {formatUSD(expenseSummary.q2Total)}
              </span>
            </PrimeCard>

            <PrimeCard padded className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--color-muted)] font-medium block">
                  Costo en horas de trabajo
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--color-ink)] my-1">
                  {formatHours(expenseSummary.totalHoursRequired)}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] font-mono">
                De {totalHoursPerMonth}h mensuales ({formatUSD(netHourly)}/h neto)
              </span>
            </PrimeCard>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Registro de Gastos Personales */}
            <PrimeCard className="lg:col-span-7">
              <div className="px-4 py-3.5 border-b border-[var(--color-rule)] flex justify-between items-center gap-2">
                <div>
                  <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                    <Wallet size={16} className="text-[var(--color-muted)]" />
                    <span>Control de Gastos Personales y Costo en Horas</span>
                  </h6>
                  <span className="text-xs text-[var(--color-muted)]">
                    Calcula cuántas horas de trabajo neto requiere cubrir cada gasto
                  </span>
                </div>
                <PrimeButton
                  variant="outline"
                  size="xs"
                  onClick={onResetDefaultExpenses}
                  title="Restaurar gastos de ejemplo"
                >
                  <RotateCcw size={12} />
                  <span>Restaurar</span>
                </PrimeButton>
              </div>

              <div className="p-4 space-y-4">
                <form onSubmit={onAddExpense} className="surface-well p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-[var(--color-muted)] mb-1">
                        Concepto
                      </label>
                      <PrimeInput
                        type="text"
                        inputSize="sm"
                        value={newExpName}
                        onChange={(e) => setNewExpName(e.target.value)}
                        placeholder="Ej. Vivienda, Alimentos..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-[var(--color-muted)] mb-1">
                        Monto ($)
                      </label>
                      <PrimeInput
                        type="number"
                        inputSize="sm"
                        mono
                        min="0.01"
                        step="0.01"
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-[var(--color-muted)] mb-1">
                        Categoría
                      </label>
                      <PrimeSelect
                        selectSize="sm"
                        value={newExpCategory}
                        onChange={(e) => setNewExpCategory(e.target.value as ExpenseCategory)}
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </PrimeSelect>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-[var(--color-muted)] mb-1">
                        Período
                      </label>
                      <PrimeSelect
                        selectSize="sm"
                        value={newExpCycle}
                        onChange={(e) => setNewExpCycle(e.target.value as ExpenseCycle)}
                      >
                        <option value="mensual">Mes (50/50)</option>
                        <option value="quincena_1">1.ª Qna</option>
                        <option value="quincena_2">2.ª Qna</option>
                      </PrimeSelect>
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label htmlFor="newExpFixedCheck" className="flex items-center justify-between gap-1 text-[11px] text-[var(--color-muted)] cursor-pointer">
                        <span>Fijo</span>
                        <PrimeSwitch
                          id="newExpFixedCheck"
                          checked={newExpFixed}
                          onChange={setNewExpFixed}
                        />
                      </label>
                      <PrimeButton type="submit" variant="secondary" size="xs" fullWidth>
                        <Plus size={13} />
                        <span>Agregar</span>
                      </PrimeButton>
                    </div>
                  </div>
                </form>

                {/* Filtros */}
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <PrimeSelectButton
                    size="xs"
                    value={expenseFilterCycle}
                    onChange={setExpenseFilterCycle}
                    options={[
                      { value: 'all', label: 'Todos' },
                      { value: 'quincena_1', label: '1.ª Qna' },
                      { value: 'quincena_2', label: '2.ª Qna' },
                      { value: 'mensual', label: 'Mes' },
                    ]}
                  />
                  <span className="text-[11px] text-[var(--color-muted)] font-mono">
                    Fijos: {formatUSD(expenseSummary.fixedTotal)} · Var: {formatUSD(expenseSummary.variableTotal)}
                  </span>
                </div>

                {/* Lista de Gastos */}
                <div className="rounded-xl border border-[var(--color-rule)] divide-y divide-[var(--color-rule)] overflow-hidden">
                  <AnimatePresence>
                    {filteredExpenses.map((item) => {
                      const hoursCost = netHourly > 0 ? round2(item.amount / netHourly) : 0;
                      const pctOfNet =
                        monthlyNetPay > 0 ? Math.round((item.amount / monthlyNetPay) * 100) : 0;
                      const isEditing = editingExpId === item.id;

                      if (isEditing) {
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-2.5 bg-[var(--color-surface)]"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-4">
                                <PrimeInput
                                  type="text"
                                  inputSize="sm"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nombre del gasto"
                                  autoFocus
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <PrimeInput
                                  type="number"
                                  inputSize="sm"
                                  mono
                                  step="0.01"
                                  min="0.01"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <PrimeSelect
                                  selectSize="sm"
                                  value={editCycle}
                                  onChange={(e) => setEditCycle(e.target.value as ExpenseCycle)}
                                >
                                  <option value="quincena_1">1.ª Q</option>
                                  <option value="quincena_2">2.ª Q</option>
                                  <option value="mensual">Mensual</option>
                                </PrimeSelect>
                              </div>
                              <div className="sm:col-span-2">
                                <PrimeSelect
                                  selectSize="sm"
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                                >
                                  {EXPENSE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </PrimeSelect>
                              </div>
                              <div className="sm:col-span-1 flex justify-end gap-1">
                                <PrimeButton
                                  variant="ghost"
                                  size="xs"
                                  className="text-[var(--color-emerald)] p-1"
                                  onClick={() => handleSaveEditExpense(item)}
                                  title="Guardar cambios"
                                >
                                  <Check size={14} />
                                </PrimeButton>
                                <PrimeButton
                                  variant="ghost"
                                  size="xs"
                                  className="p-1"
                                  onClick={handleCancelEditExpense}
                                  title="Cancelar edición"
                                >
                                  <X size={14} />
                                </PrimeButton>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex justify-between items-center gap-3 p-3 ${
                            item.paid ? 'bg-[var(--color-surface)] opacity-75' : 'bg-[var(--color-card)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleExpensePaid(item.id)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                item.paid
                                  ? 'bg-[var(--color-emerald)] border-[var(--color-emerald)] text-white'
                                  : 'bg-transparent border-[var(--color-rule)] text-transparent hover:border-[var(--color-muted)]'
                              }`}
                              title={item.paid ? 'Marcar pendiente' : 'Marcar pagado'}
                            >
                              {item.paid && <Check size={11} strokeWidth={3} />}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span
                                  className={`font-semibold text-xs text-[var(--color-ink)] ${
                                    item.paid ? 'line-through text-[var(--color-muted)]' : ''
                                  }`}
                                >
                                  {item.name}
                                </span>
                                <PrimeTag severity={item.category === 'Ahorro' ? 'success' : 'neutral'}>
                                  {item.category}
                                </PrimeTag>
                                <PrimeTag severity="neutral" className="font-mono">
                                  {item.cycle === 'quincena_1' ? '1.ª Q' : item.cycle === 'quincena_2' ? '2.ª Q' : 'Mes'}
                                </PrimeTag>
                              </div>

                              <div className="text-[11px] font-mono text-[var(--color-muted)] flex items-center gap-1.5 flex-wrap">
                                <Clock size={11} />
                                <span>Equivale a {formatHours(hoursCost)} de trabajo</span>
                                <span>({pctOfNet}% del neto)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-semibold font-mono text-xs text-[var(--color-ink)] mr-1">
                              {formatUSD(item.amount)}
                            </span>
                            <PrimeButton
                              variant="ghost"
                              size="xs"
                              className="p-1"
                              onClick={() => handleStartEditExpense(item)}
                              title="Editar gasto"
                            >
                              <Pencil size={13} />
                            </PrimeButton>
                            <PrimeButton
                              variant="ghost"
                              size="xs"
                              className="p-1 text-[var(--color-danger)]"
                              onClick={() => onDeleteExpense(item.id)}
                              title="Eliminar gasto"
                            >
                              <Trash2 size={13} />
                            </PrimeButton>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredExpenses.length === 0 && (
                    <div className="p-6 text-center text-[var(--color-muted)] text-xs">
                      No hay gastos en esta categoría o filtro.
                    </div>
                  )}
                </div>
              </div>
            </PrimeCard>

            {/* Columna Derecha: Planificador de Bonos y Gráfico */}
            <div className="lg:col-span-5 space-y-4">
              <PrimeCard>
                <div className="px-4 py-3.5 border-b border-[var(--color-rule)]">
                  <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                    <Target size={16} className="text-[var(--color-muted)]" />
                    <span>Destino de Bonos de Ley</span>
                  </h6>
                  <span className="text-xs text-[var(--color-muted)]">
                    Planifica cómo distribuir tus ingresos extraordinarios
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="surface-well p-3 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Quincena 25 (Enero):</span>
                      <span className="text-[var(--color-ink)]">{formatUSD(annualBonusesSummary.q25Net)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Bono Vacacional 30%:</span>
                      <span className="text-[var(--color-ink)]">{formatUSD(annualBonusesSummary.vacNet)}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-[var(--color-rule)]">
                      <span className="text-[var(--color-muted)]">Aguinaldo (Diciembre):</span>
                      <span className="text-[var(--color-ink)]">{formatUSD(annualBonusesSummary.agNet)}</span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold">
                      <span className="text-[var(--color-ink)]">Bolsa Anual Neta:</span>
                      <span className="text-[var(--color-emerald)]">
                        +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={onAddBonusGoal} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <PrimeInput
                          type="text"
                          inputSize="sm"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="Meta (ej. Ahorro, Deuda...)"
                        />
                      </div>
                      <div className="col-span-3">
                        <PrimeSelect
                          selectSize="sm"
                          value={newGoalSource}
                          onChange={(e) => setNewGoalSource(e.target.value as BonusGoalItem['source'])}
                        >
                          <option value="quincena25">Q25</option>
                          <option value="vacacion">Vacación</option>
                          <option value="aguinaldo">Aguinaldo</option>
                        </PrimeSelect>
                      </div>
                      <div className="col-span-3">
                        <PrimeInput
                          type="number"
                          inputSize="sm"
                          mono
                          min="1"
                          step="1"
                          value={newGoalAmount}
                          onChange={(e) => setNewGoalAmount(e.target.value)}
                          placeholder="$"
                        />
                      </div>
                    </div>
                    <PrimeButton type="submit" variant="secondary" size="xs" fullWidth>
                      + Asignar meta de bono
                    </PrimeButton>
                  </form>

                  <div className="rounded-xl border border-[var(--color-rule)] divide-y divide-[var(--color-rule)] overflow-hidden">
                    {bonusGoals.map((goal) => (
                      <div key={goal.id} className="flex justify-between items-center p-2.5 text-xs">
                        <div>
                          <strong className="block text-[var(--color-ink)]">{goal.title}</strong>
                          <PrimeTag severity="neutral" className="font-mono mt-0.5">
                            {goal.source === 'quincena25'
                              ? 'Quincena 25'
                              : goal.source === 'vacacion'
                                ? 'Vacación'
                                : 'Aguinaldo'}
                          </PrimeTag>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-semibold text-[var(--color-ink)]">
                            {formatUSD(goal.amount)}
                          </span>
                          <PrimeButton
                            variant="ghost"
                            size="xs"
                            className="p-1 text-[var(--color-danger)]"
                            onClick={() => onDeleteBonusGoal(goal.id)}
                          >
                            <Trash2 size={12} />
                          </PrimeButton>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="surface-well p-2.5 flex justify-between items-center text-xs font-mono">
                    <span className="text-[var(--color-muted)]">Bonos sin asignar:</span>
                    <span
                      className={`font-semibold ${
                        annualBonusesSummary.unallocated >= 0
                          ? 'text-[var(--color-emerald)]'
                          : 'text-[var(--color-danger)]'
                      }`}
                    >
                      {formatUSD(annualBonusesSummary.unallocated)}
                    </span>
                  </div>
                </div>
              </PrimeCard>

              <PrimeCard padded className="space-y-3">
                <h6 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                  <PieChart size={16} className="text-[var(--color-accent)]" />
                  <span>Distribución por Categoría</span>
                </h6>
                {activeCategories.length > 0 ? (
                  <>
                    <PrimeChart type="doughnut" data={categoryChartData} height={200} />
                    <div className="space-y-2 pt-2 border-t border-[var(--color-rule)]">
                      {activeCategories.map((cat) => {
                        const amt = expenseSummary.byCategory[cat];
                        const pct =
                          expenseSummary.totalMonthlyExpenses > 0
                            ? Math.round((amt / expenseSummary.totalMonthlyExpenses) * 100)
                            : 0;
                        return (
                          <div key={cat} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="text-[var(--color-ink)]">{cat}</span>
                              <span className="font-mono text-[var(--color-muted)]">
                                {formatUSD(amt)} ({pct}%)
                              </span>
                            </div>
                            <PrimeProgressBar value={pct} heightClass="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[var(--color-muted)] m-0">
                    Agrega gastos para visualizar su distribución por categoría.
                  </p>
                )}
              </PrimeCard>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
