import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RotateCcw, Wallet, Target, Check, Clock } from 'lucide-react';
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

export const CATEGORY_BADGES: Record<ExpenseCategory, string> = {
  Vivienda: 'bg-primary',
  Alimentación: 'bg-info text-dark',
  Transporte: 'bg-warning text-dark',
  Servicios: 'bg-secondary',
  Deudas: 'bg-danger',
  Salud: 'bg-success',
  Educación: 'bg-dark',
  Ahorro: 'bg-success-subtle text-success border border-success-subtle',
  Ocio: 'bg-light text-dark border',
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="container-fluid px-0"
    >
      {/* 4 Tarjetas de Balance Superior */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100 card-hover-shadow">
            <span className="text-muted small fw-bold">Disponible Mensual</span>
            <div
              className={`fs-3 fw-bold font-monospace mt-1 ${
                expenseSummary.remainingMonthly >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {formatUSD(expenseSummary.remainingMonthly)}
            </div>
            <span className="text-muted small font-monospace">
              Gastos: {formatUSD(expenseSummary.totalMonthlyExpenses)} de {formatUSD(monthlyNetPay)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100 card-hover-shadow">
            <span className="text-muted small fw-bold">Balance 1.ª Quincena (Día 15)</span>
            <div
              className={`fs-3 fw-bold font-monospace mt-1 ${
                expenseSummary.remainingQ1 >= 0 ? 'text-dark' : 'text-danger'
              }`}
            >
              {formatUSD(expenseSummary.remainingQ1)}
            </div>
            <span className="text-muted small font-monospace">
              Compromisos Q1: {formatUSD(expenseSummary.q1Total)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100 card-hover-shadow">
            <span className="text-muted small fw-bold">Balance 2.ª Quincena (Fin de Mes)</span>
            <div
              className={`fs-3 fw-bold font-monospace mt-1 ${
                expenseSummary.remainingQ2 >= 0 ? 'text-dark' : 'text-danger'
              }`}
            >
              {formatUSD(expenseSummary.remainingQ2)}
            </div>
            <span className="text-muted small font-monospace">
              Compromisos Q2: {formatUSD(expenseSummary.q2Total)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100 card-hover-shadow">
            <span className="text-muted small fw-bold">Costo en Horas de Trabajo</span>
            <div className="fs-3 fw-bold font-monospace mt-1 text-warning-emphasis">
              {formatHours(expenseSummary.totalHoursRequired)}
            </div>
            <span className="text-muted small font-monospace">
              De {totalHoursPerMonth}h mensuales ({formatUSD(netHourly)}/h líquido)
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Registro de Gastos vs Planificador de Bonos */}
      <div className="row g-4 mb-4">
        {/* Columna Izquierda: Registro de Gastos Personales */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <Wallet className="text-primary" size={20} />
                  <span>Control de Gastos Personales y Costo en Horas</span>
                </h5>
                <p className="card-subtitle text-muted small mb-0">
                  Calcula cuántas horas de trabajo neto requiere pagar cada compromiso
                </p>
              </div>
              <button
                type="button"
                onClick={onResetDefaultExpenses}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                title="Restaurar gastos de ejemplo"
              >
                <RotateCcw size={13} />
                <span>Restaurar</span>
              </button>
            </div>

            <div className="card-body">
              {/* Formulario Agregar Gasto */}
              <form onSubmit={onAddExpense} className="p-3 bg-light rounded border mb-3">
                <div className="row g-2">
                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-muted mb-1">Concepto:</label>
                    <input
                      type="text"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      placeholder="Ej. Supermercado, Alquiler..."
                      className="form-control form-control-sm"
                    />
                  </div>

                  <div className="col-6 col-sm-2">
                    <label className="form-label small fw-bold text-muted mb-1">Monto ($):</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      placeholder="0.00"
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>

                  <div className="col-6 col-sm-2">
                    <label className="form-label small fw-bold text-muted mb-1">Categoría:</label>
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value as ExpenseCategory)}
                      className="form-select form-select-sm"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6 col-sm-2">
                    <label className="form-label small fw-bold text-muted mb-1">Período:</label>
                    <select
                      value={newExpCycle}
                      onChange={(e) => setNewExpCycle(e.target.value as ExpenseCycle)}
                      className="form-select form-select-sm"
                    >
                      <option value="mensual">Mensual (50/50)</option>
                      <option value="quincena_1">1.ª Quincena</option>
                      <option value="quincena_2">2.ª Quincena</option>
                    </select>
                  </div>

                  <div className="col-6 col-sm-2 d-flex flex-column justify-content-end">
                    <div className="form-check form-switch mb-1">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="newExpFixedCheck"
                        checked={newExpFixed}
                        onChange={(e) => setNewExpFixed(e.target.checked)}
                      />
                      <label className="form-check-label small" htmlFor="newExpFixedCheck">
                        Fijo
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
                      <Plus size={14} />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Filtros de Ciclo */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="btn-group btn-group-sm">
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
                      className={`btn ${expenseFilterCycle === f.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="small text-muted font-monospace">
                  Fijos: {formatUSD(expenseSummary.fixedTotal)} · Var: {formatUSD(expenseSummary.variableTotal)}
                </span>
              </div>

              {/* Lista Animada de Gastos */}
              <div className="list-group list-group-flush border rounded">
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
                        className={`list-group-item d-flex justify-content-between align-items-center p-3 ${
                          item.paid ? 'bg-light text-muted' : ''
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onToggleExpensePaid(item.id)}
                            className={`btn btn-sm p-1 rounded-circle border d-flex align-items-center justify-center ${
                              item.paid ? 'btn-success' : 'btn-outline-secondary'
                            }`}
                            style={{ width: '24px', height: '24px' }}
                            title={item.paid ? 'Marcar pendiente' : 'Marcar pagado'}
                          >
                            {item.paid && <Check size={14} />}
                          </button>

                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className={`fw-semibold text-dark ${item.paid ? 'text-decoration-line-through text-muted' : ''}`}>
                                {item.name}
                              </span>
                              <span className={`badge ${CATEGORY_BADGES[item.category] || 'bg-secondary'}`} style={{ fontSize: '10px' }}>
                                {item.category}
                              </span>
                              <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '10px' }}>
                                {item.cycle === 'quincena_1' ? '1.ª Q' : item.cycle === 'quincena_2' ? '2.ª Q' : 'Mes'}
                              </span>
                            </div>

                            <div className="small font-monospace text-muted d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                              <Clock size={12} className="text-warning" />
                              <span className="text-warning-emphasis fw-bold">
                                Equivale a {formatHours(hoursCost)} de trabajo neto
                              </span>
                              <span>·</span>
                              <span>{pctOfNet}% de tu sueldo neto</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <span className="fs-6 fw-bold font-monospace text-dark">
                            {formatUSD(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(item.id)}
                            className="btn btn-outline-danger btn-sm p-1 border-0"
                            title="Eliminar gasto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredExpenses.length === 0 && (
                  <div className="p-4 text-center text-muted small">
                    No hay gastos en esta categoría o filtro.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Planificador de Bonos y Distribución de Gastos */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          {/* Planificador de Destino de Bonos de Ley */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                <Target className="text-success" size={20} />
                <span>Destino de Bonos de Ley (Vacación, Aguinaldo, Q25)</span>
              </h5>
              <p className="card-subtitle text-muted small mb-0">
                Planifica cómo distribuir tus ingresos extraordinarios del año
              </p>
            </div>

            <div className="card-body">
              <div className="p-3 bg-light rounded border mb-3 small font-monospace">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Quincena 25 (Enero):</span>
                  <strong>{formatUSD(annualBonusesSummary.q25Net)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Bono Vacacional 30%:</span>
                  <strong>{formatUSD(annualBonusesSummary.vacNet)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Aguinaldo (Diciembre):</span>
                  <strong>{formatUSD(annualBonusesSummary.agNet)}</strong>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top text-success fw-bold fs-6">
                  <span>Bolsa Anual Neta:</span>
                  <span>{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}</span>
                </div>
              </div>

              {/* Formulario Agregar Meta */}
              <form onSubmit={onAddBonusGoal} className="mb-3">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <input
                      type="text"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder="Meta (ej. Ahorro, Deuda...)"
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="col-3">
                    <select
                      value={newGoalSource}
                      onChange={(e) => setNewGoalSource(e.target.value as BonusGoalItem['source'])}
                      className="form-select form-select-sm"
                    >
                      <option value="quincena25">Q25</option>
                      <option value="vacacion">Vacación</option>
                      <option value="aguinaldo">Aguinaldo</option>
                    </select>
                  </div>
                  <div className="col-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newGoalAmount}
                      onChange={(e) => setNewGoalAmount(e.target.value)}
                      placeholder="$"
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-dark btn-sm w-100">
                  + Asignar meta de bono
                </button>
              </form>

              {/* Lista de Metas */}
              <div className="list-group list-group-flush border rounded mb-3">
                {bonusGoals.map((goal) => (
                  <div key={goal.id} className="list-group-item d-flex justify-content-between align-items-center p-2 small">
                    <div>
                      <strong className="d-block text-dark">{goal.title}</strong>
                      <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                        {goal.source === 'quincena25' ? 'Quincena 25' : goal.source === 'vacacion' ? 'Vacación' : 'Aguinaldo'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold font-monospace text-dark">{formatUSD(goal.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBonusGoal(goal.id)}
                        className="btn btn-outline-danger btn-sm p-1 border-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border small">
                <span className="text-muted">Bonos sin asignar aún:</span>
                <span className={`fw-bold font-monospace ${annualBonusesSummary.unallocated >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatUSD(annualBonusesSummary.unallocated)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Distribución de Gastos por Categoría */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="card-title mb-0 fw-bold text-dark">Distribución por Categoría</h6>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {EXPENSE_CATEGORIES.filter((cat) => expenseSummary.byCategory[cat] > 0).map((cat) => {
                  const amt = expenseSummary.byCategory[cat];
                  const pct =
                    expenseSummary.totalMonthlyExpenses > 0
                      ? Math.round((amt / expenseSummary.totalMonthlyExpenses) * 100)
                      : 0;

                  return (
                    <div key={cat} className="small">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-dark">{cat}</span>
                        <span className="font-monospace text-muted">
                          {formatUSD(amt)} ({pct}%)
                        </span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
