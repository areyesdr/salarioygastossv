import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RotateCcw, Sparkles, Check } from 'lucide-react';
import { round2 } from '../lib/svLaborLaw.ts';

export type ExpenseCategory =
  | 'Vivienda'
  | 'Alimentación'
  | 'Transporte'
  | 'Servicios'
  | 'Deudas'
  | 'Salud'
  | 'Educación'
  | 'Ahorro'
  | 'Ocio';

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

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Servicios',
  'Deudas',
  'Salud',
  'Educación',
  'Ahorro',
  'Ocio',
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Vivienda: '#0F4C3A',
  Alimentación: '#1D4ED8',
  Transporte: '#B45309',
  Servicios: '#6D28D9',
  Deudas: '#B91C1C',
  Salud: '#047857',
  Educación: '#0369A1',
  Ahorro: '#15803D',
  Ocio: '#7C2D12',
};

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
  setNewExpFixed: React.Dispatch<React.SetStateAction<boolean>>;
  onAddExpense: (e: React.FormEvent) => void;
  onToggleExpensePaid: (id: string) => void;
  onDeleteExpense: (id: string) => void;
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
  formatHours: (hours: number) => string;
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
}: ExpensesViewProps) {
  return (
    <motion.div
      key="tab-expenses"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Balance Cards: Monthly, Quincena 1, Quincena 2, Hours of Life */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#DFDCD2] p-4 shadow-2xs">
          <span className="text-xs text-[#65635E] block">Disponible Mensual (Líquido - Gastos)</span>
          <div
            className={`text-2xl font-mono-tabular font-bold mt-1 ${
              expenseSummary.remainingMonthly >= 0 ? 'text-[#0F4C3A]' : 'text-[#B91C1C]'
            }`}
          >
            {formatUSD(expenseSummary.remainingMonthly)}
          </div>
          <span className="text-[11px] font-mono-tabular text-[#65635E]">
            Gastos: {formatUSD(expenseSummary.totalMonthlyExpenses)} de {formatUSD(monthlyNetPay)}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFDCD2] p-4 shadow-2xs">
          <span className="text-xs text-[#65635E] block">Balance 1.ª Quincena (Día 15)</span>
          <div
            className={`text-2xl font-mono-tabular font-bold mt-1 ${
              expenseSummary.remainingQ1 >= 0 ? 'text-[#141413]' : 'text-[#B91C1C]'
            }`}
          >
            {formatUSD(expenseSummary.remainingQ1)}
          </div>
          <span className="text-[11px] font-mono-tabular text-[#65635E]">
            Compromisos Q1: {formatUSD(expenseSummary.q1Total)}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFDCD2] p-4 shadow-2xs">
          <span className="text-xs text-[#65635E] block">Balance 2.ª Quincena (Fin de mes)</span>
          <div
            className={`text-2xl font-mono-tabular font-bold mt-1 ${
              expenseSummary.remainingQ2 >= 0 ? 'text-[#141413]' : 'text-[#B91C1C]'
            }`}
          >
            {formatUSD(expenseSummary.remainingQ2)}
          </div>
          <span className="text-[11px] font-mono-tabular text-[#65635E]">
            Compromisos Q2: {formatUSD(expenseSummary.q2Total)}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFDCD2] p-4 shadow-2xs">
          <span className="text-xs text-[#65635E] block">Costo en Tiempo de Trabajo Neto</span>
          <div className="text-2xl font-mono-tabular font-bold mt-1 text-[#B45309]">
            {formatHours(expenseSummary.totalHoursRequired)}
          </div>
          <span className="text-[11px] font-mono-tabular text-[#65635E]">
            De {totalHoursPerMonth}h mensuales ({formatUSD(netHourly)}/h)
          </span>
        </div>
      </div>

      {/* Main Expense Tracker & Bonus Planner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Personal Expense Ledger */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFECE6]">
            <div>
              <h3 className="font-serif-editorial text-lg font-semibold">
                Control de Gastos Personales y Costo en Horas
              </h3>
              <p className="text-xs text-[#65635E]">
                Cada gasto muestra cuántas horas de tu salario líquido requiere cubrirlo
              </p>
            </div>
            <button
              type="button"
              onClick={onResetDefaultExpenses}
              className="text-xs text-[#65635E] hover:text-[#141413] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              title="Restaurar gastos de ejemplo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar ejemplo</span>
            </button>
          </div>

          {/* Add Expense Form */}
          <form
            onSubmit={onAddExpense}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2DFD7]"
          >
            <div className="sm:col-span-3">
              <label className="text-[10px] font-semibold uppercase text-[#65635E] block mb-1">
                Concepto del gasto
              </label>
              <input
                type="text"
                value={newExpName}
                onChange={(e) => setNewExpName(e.target.value)}
                placeholder="Ej. Supermercado, Alquiler..."
                className="w-full text-xs bg-white border border-[#DFDCD2] rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#0F4C3A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase text-[#65635E] block mb-1">
                Monto ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newExpAmount}
                onChange={(e) => setNewExpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs font-mono-tabular bg-white border border-[#DFDCD2] rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#0F4C3A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase text-[#65635E] block mb-1">
                Categoría
              </label>
              <select
                value={newExpCategory}
                onChange={(e) => setNewExpCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs bg-white border border-[#DFDCD2] rounded-lg px-2 py-2 focus:outline-none focus:border-[#0F4C3A]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase text-[#65635E] block mb-1">
                Quincena
              </label>
              <select
                value={newExpCycle}
                onChange={(e) => setNewExpCycle(e.target.value as ExpenseCycle)}
                className="w-full text-xs bg-white border border-[#DFDCD2] rounded-lg px-2 py-2 focus:outline-none focus:border-[#0F4C3A]"
              >
                <option value="mensual">Mensual (50/50)</option>
                <option value="quincena_1">1.ª Quincena</option>
                <option value="quincena_2">2.ª Quincena</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase text-[#65635E] block mb-1">
                Tipo
              </label>
              <button
                type="button"
                onClick={() => setNewExpFixed((v) => !v)}
                className="w-full text-xs bg-white border border-[#DFDCD2] rounded-lg px-2 py-2 font-medium text-[#141413] cursor-pointer"
              >
                {newExpFixed ? 'Fijo' : 'Var.'}
              </button>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-[#0F4C3A] hover:bg-[#0F4C3A]/90 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </form>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-1 bg-[#EFECE6] p-1 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'quincena_1', label: '1.ª Quincena' },
                  { id: 'quincena_2', label: '2.ª Quincena' },
                  { id: 'mensual', label: 'Mensuales' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setExpenseFilterCycle(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    expenseFilterCycle === f.id ? 'bg-white text-[#141413] shadow-2xs' : 'text-[#65635E]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-[#65635E] font-mono-tabular">
              Fijos: {formatUSD(expenseSummary.fixedTotal)} · Variables:{' '}
              {formatUSD(expenseSummary.variableTotal)}
            </div>
          </div>

          {/* Animated Expense List */}
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredExpenses.map((item) => {
                const hoursCost = netHourly > 0 ? item.amount / netHourly : 0;
                const pctOfNet =
                  monthlyNetPay > 0 ? round2((item.amount / monthlyNetPay) * 100) : 0;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      item.paid
                        ? 'bg-[#FAF9F5] border-[#E2DFD7] opacity-75'
                        : 'bg-white border-[#DFDCD2]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleExpensePaid(item.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                          item.paid
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#C7C3B8] bg-white'
                        }`}
                        title={item.paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                      >
                        {item.paid && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium truncate ${
                              item.paid ? 'line-through text-[#65635E]' : 'text-[#141413]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                          >
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-md bg-[#EFECE6] text-[#4A4945]">
                            {item.cycle === 'quincena_1'
                              ? '1.ª Quincena'
                              : item.cycle === 'quincena_2'
                                ? '2.ª Quincena'
                                : 'Mensual'}
                          </span>
                        </div>
                        <div className="text-xs text-[#65635E] font-mono-tabular mt-0.5 flex items-center gap-2">
                          <span className="text-[#B45309] font-medium">
                            ⏱ Equivale a {formatHours(hoursCost)} de trabajo neto
                          </span>
                          <span>·</span>
                          <span>{pctOfNet}% de tu líquido</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-tabular font-semibold text-sm text-[#141413]">
                        {formatUSD(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(item.id)}
                        className="text-[#9E9A8E] hover:text-[#B91C1C] p-1 cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-xs text-[#65635E]">
                No hay gastos registrados en este filtro.
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Annual Bonuses Destination Planner & Category Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#EFECE6]">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono-tabular uppercase text-[#0F4C3A] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Planificador de Bonos de Ley</span>
                </div>
                <h3 className="font-serif-editorial text-lg font-semibold mt-0.5">
                  Destino de Vacación, Aguinaldo y Quincena 25
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#65635E]">Quincena 25 (Enero):</span>
                <span className="font-mono-tabular font-semibold">
                  {formatUSD(annualBonusesSummary.q25Net)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#65635E]">Bono Vacacional 30% (Neto):</span>
                <span className="font-mono-tabular font-semibold">
                  {formatUSD(annualBonusesSummary.vacNet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#65635E]">Aguinaldo (Diciembre):</span>
                <span className="font-mono-tabular font-semibold">
                  {formatUSD(annualBonusesSummary.agNet)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DFDCD2] flex justify-between text-sm font-semibold text-[#0F4C3A]">
                <span>Bolsa Anual de Bonos Netos:</span>
                <span className="font-mono-tabular">
                  {formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                </span>
              </div>
            </div>

            <form onSubmit={onAddBonusGoal} className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Meta (ej. Pago tarjeta, Ahorro...)"
                  className="col-span-6 text-xs bg-[#FAF9F5] border border-[#DFDCD2] rounded-lg px-2.5 py-2"
                />
                <select
                  value={newGoalSource}
                  onChange={(e) => setNewGoalSource(e.target.value as BonusGoalItem['source'])}
                  className="col-span-3 text-xs bg-[#FAF9F5] border border-[#DFDCD2] rounded-lg px-2 py-2"
                >
                  <option value="quincena25">Q25 (Ene)</option>
                  <option value="vacacion">Vacación</option>
                  <option value="aguinaldo">Aguinaldo</option>
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  placeholder="$"
                  className="col-span-3 text-xs font-mono-tabular bg-[#FAF9F5] border border-[#DFDCD2] rounded-lg px-2 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#141413] text-white text-xs font-medium hover:bg-[#141413]/90 cursor-pointer"
              >
                + Asignar meta a mis bonos anuales
              </button>
            </form>

            <div className="space-y-2">
              {bonusGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-2.5 rounded-xl border border-[#E2DFD7] bg-[#FAF9F5] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-[#141413]">{goal.title}</div>
                    <span className="text-[10px] font-mono-tabular uppercase text-[#0F4C3A]">
                      Fuente:{' '}
                      {goal.source === 'quincena25'
                        ? 'Quincena 25 (Enero)'
                        : goal.source === 'vacacion'
                          ? 'Bono Vacacional'
                          : 'Aguinaldo (Diciembre)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular font-semibold">{formatUSD(goal.amount)}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteBonusGoal(goal.id)}
                      className="text-[#9E9A8E] hover:text-[#B91C1C] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#EFECE6] flex justify-between items-center text-xs">
              <span className="text-[#65635E]">Bonos sin asignar aún:</span>
              <span
                className={`font-mono-tabular font-bold text-sm ${
                  annualBonusesSummary.unallocated >= 0 ? 'text-[#0F4C3A]' : 'text-[#B91C1C]'
                }`}
              >
                {formatUSD(annualBonusesSummary.unallocated)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFDCD2] p-5 shadow-2xs space-y-3">
            <h4 className="font-serif-editorial text-base font-semibold">Distribución por Categoría</h4>
            <div className="space-y-2">
              {EXPENSE_CATEGORIES.filter((cat) => expenseSummary.byCategory[cat] > 0).map((cat) => {
                const amt = expenseSummary.byCategory[cat];
                const pct =
                  expenseSummary.totalMonthlyExpenses > 0
                    ? Math.round((amt / expenseSummary.totalMonthlyExpenses) * 100)
                    : 0;
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-[#141413]">{cat}</span>
                      <span className="font-mono-tabular text-[#65635E]">
                        {formatUSD(amt)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#EFECE6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[cat],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
