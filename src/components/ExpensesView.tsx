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
  Vivienda: 'bg-light text-slate-dark border',
  Alimentación: 'bg-light text-slate-dark border',
  Transporte: 'bg-light text-slate-dark border',
  Servicios: 'bg-light text-slate-dark border',
  Deudas: 'bg-light text-slate-dark border',
  Salud: 'bg-light text-slate-dark border',
  Educación: 'bg-light text-slate-dark border',
  Ahorro: 'bg-emerald-subtle text-emerald border',
  Ocio: 'bg-light text-slate-dark border',
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
  setNewExpFixed: (v: boolean) => void;
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
  formatHours: (val: number) => string;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="container-fluid px-0"
    >
      {/* 4 Tarjetas de Balance Superior */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-soft p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-slate-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '10px' }}>
                Disponible Mensual
              </span>
              <div
                className={`fs-3 fw-bold font-monospace my-1 ${
                  expenseSummary.remainingMonthly >= 0 ? 'text-emerald' : 'text-danger'
                }`}
              >
                {formatUSD(expenseSummary.remainingMonthly)}
              </div>
            </div>
            <span className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
              Gastos: {formatUSD(expenseSummary.totalMonthlyExpenses)} de {formatUSD(monthlyNetPay)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-soft p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-slate-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '10px' }}>
                Balance 1.ª Quincena (Día 15)
              </span>
              <div className="fs-3 fw-bold font-monospace text-slate-dark my-1">
                {formatUSD(expenseSummary.remainingQ1)}
              </div>
            </div>
            <span className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
              Compromisos Q1: {formatUSD(expenseSummary.q1Total)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-soft p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-slate-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '10px' }}>
                Balance 2.ª Quincena (Fin de Mes)
              </span>
              <div className="fs-3 fw-bold font-monospace text-slate-dark my-1">
                {formatUSD(expenseSummary.remainingQ2)}
              </div>
            </div>
            <span className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
              Compromisos Q2: {formatUSD(expenseSummary.q2Total)}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-soft p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-slate-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '10px' }}>
                Costo en Horas de Trabajo
              </span>
              <div className="fs-3 fw-bold font-monospace text-slate-dark my-1">
                {formatHours(expenseSummary.totalHoursRequired)}
              </div>
            </div>
            <span className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
              De {totalHoursPerMonth}h mensuales ({formatUSD(netHourly)}/h neto)
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Registro de Gastos vs Planificador de Bonos */}
      <div className="row g-4 mb-4">
        {/* Columna Izquierda: Registro de Gastos Personales */}
        <div className="col-12 col-lg-7">
          <div className="card-soft h-100">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                  <Wallet size={16} className="text-secondary" />
                  <span>Control de Gastos Personales y Costo en Horas</span>
                </h6>
                <span className="small text-muted" style={{ fontSize: '12px' }}>
                  Calcula cuántas horas de trabajo neto requiere cubrir cada gasto
                </span>
              </div>
              <button
                type="button"
                onClick={onResetDefaultExpenses}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2 py-1 px-2"
                style={{ fontSize: '11px' }}
                title="Restaurar gastos de ejemplo"
              >
                <RotateCcw size={12} />
                <span>Restaurar</span>
              </button>
            </div>

            <div className="p-3">
              {/* Formulario Agregar Gasto */}
              <form onSubmit={onAddExpense} className="p-3 bg-light rounded border mb-3">
                <div className="row g-2">
                  <div className="col-12 col-sm-4">
                    <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                      Concepto:
                    </label>
                    <input
                      type="text"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      placeholder="Ej. Vivienda, Alimentos..."
                      className="form-control form-control-sm"
                    />
                  </div>

                  <div className="col-6 col-sm-2">
                    <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                      Monto ($):
                    </label>
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
                    <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                      Categoría:
                    </label>
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
                    <label className="form-label text-slate-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                      Período:
                    </label>
                    <select
                      value={newExpCycle}
                      onChange={(e) => setNewExpCycle(e.target.value as ExpenseCycle)}
                      className="form-select form-select-sm"
                    >
                      <option value="mensual">Mes (50/50)</option>
                      <option value="quincena_1">1.ª Qna</option>
                      <option value="quincena_2">2.ª Qna</option>
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
                      <label className="form-check-label small text-muted" htmlFor="newExpFixedCheck" style={{ fontSize: '11px' }}>
                        Fijo
                      </label>
                    </div>
                    <button type="submit" className="btn btn-dark btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1" style={{ fontSize: '12px' }}>
                      <Plus size={13} />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Filtros de Ciclo */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="segmented-control">
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'quincena_1', label: '1.ª Qna' },
                      { id: 'quincena_2', label: '2.ª Qna' },
                      { id: 'mensual', label: 'Mes' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setExpenseFilterCycle(f.id)}
                      className={expenseFilterCycle === f.id ? 'active' : ''}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="small text-muted font-monospace" style={{ fontSize: '11px' }}>
                  Fijos: {formatUSD(expenseSummary.fixedTotal)} · Var: {formatUSD(expenseSummary.variableTotal)}
                </span>
              </div>

              {/* Lista de Gastos */}
              <div className="list-group list-group-flush border rounded">
                <AnimatePresence>
                  {filteredExpenses.map((item) => {
                    const hoursCost = netHourly > 0 ? round2(item.amount / netHourly) : 0;
                    const pctOfNet = monthlyNetPay > 0 ? Math.round((item.amount / monthlyNetPay) * 100) : 0;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`list-group-item d-flex justify-content-between align-items-center p-2.5 ${
                          item.paid ? 'bg-light text-muted' : ''
                        }`}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleExpensePaid(item.id)}
                            className={`btn btn-sm p-0 rounded-circle border d-flex align-items-center justify-content-center ${
                              item.paid ? 'btn-dark' : 'btn-outline-secondary'
                            }`}
                            style={{ width: '22px', height: '22px' }}
                            title={item.paid ? 'Marcar pendiente' : 'Marcar pagado'}
                          >
                            {item.paid && <Check size={12} />}
                          </button>

                          <div>
                            <div className="d-flex align-items-center gap-2 mb-0.5">
                              <span className={`fw-semibold text-slate-dark small ${item.paid ? 'text-decoration-line-through text-muted' : ''}`}>
                                {item.name}
                              </span>
                              <span className={`badge ${CATEGORY_BADGES[item.category] || 'bg-light text-secondary border'}`} style={{ fontSize: '10px' }}>
                                {item.category}
                              </span>
                              <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                                {item.cycle === 'quincena_1' ? '1.ª Q' : item.cycle === 'quincena_2' ? '2.ª Q' : 'Mes'}
                              </span>
                            </div>

                            <div className="small font-monospace text-muted d-flex align-items-center gap-2" style={{ fontSize: '11px' }}>
                              <Clock size={11} className="text-secondary" />
                              <span>Equivale a {formatHours(hoursCost)} de trabajo</span>
                              <span>·</span>
                              <span>{pctOfNet}% del neto</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold font-monospace text-slate-dark small">
                            {formatUSD(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(item.id)}
                            className="btn btn-outline-danger btn-sm p-1 border-0"
                            title="Eliminar gasto"
                          >
                            <Trash2 size={13} />
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
          <div className="card-soft">
            <div className="p-3 border-bottom">
              <h6 className="fw-semibold text-slate-dark mb-0 d-flex align-items-center gap-2">
                <Target size={16} className="text-secondary" />
                <span>Destino de Bonos de Ley (Vacación, Aguinaldo, Q25)</span>
              </h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Planifica cómo distribuir tus ingresos extraordinarios
              </span>
            </div>

            <div className="p-3">
              <div className="p-2.5 bg-slate-50 rounded border mb-3 small font-monospace">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Quincena 25 (Enero):</span>
                  <span className="text-slate-dark">{formatUSD(annualBonusesSummary.q25Net)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Bono Vacacional 30%:</span>
                  <span className="text-slate-dark">{formatUSD(annualBonusesSummary.vacNet)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Aguinaldo (Diciembre):</span>
                  <span className="text-slate-dark">{formatUSD(annualBonusesSummary.agNet)}</span>
                </div>
                <div className="d-flex justify-content-between pt-1.5 border-top fw-bold">
                  <span>Bolsa Anual Neta:</span>
                  <span className="text-emerald">+{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}</span>
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
                <button type="submit" className="btn btn-dark btn-sm w-100 py-1" style={{ fontSize: '12px' }}>
                  + Asignar meta de bono
                </button>
              </form>

              {/* Lista de Metas */}
              <div className="list-group list-group-flush border rounded mb-3">
                {bonusGoals.map((goal) => (
                  <div key={goal.id} className="list-group-item d-flex justify-content-between align-items-center p-2 small">
                    <div>
                      <strong className="d-block text-slate-dark" style={{ fontSize: '12px' }}>{goal.title}</strong>
                      <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
                        {goal.source === 'quincena25' ? 'Quincena 25' : goal.source === 'vacacion' ? 'Vacación' : 'Aguinaldo'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 font-monospace">
                      <span className="fw-semibold text-slate-dark">{formatUSD(goal.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBonusGoal(goal.id)}
                        className="btn btn-outline-danger btn-sm p-1 border-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 bg-slate-50 rounded border small font-monospace">
                <span className="text-muted">Bonos sin asignar:</span>
                <span className={`fw-semibold ${annualBonusesSummary.unallocated >= 0 ? 'text-emerald' : 'text-danger'}`}>
                  {formatUSD(annualBonusesSummary.unallocated)}
                </span>
              </div>
            </div>
          </div>

          {/* Distribución de Gastos por Categoría */}
          <div className="card-soft p-3">
            <h6 className="fw-semibold text-slate-dark mb-3" style={{ fontSize: '13px' }}>
              Distribución por Categoría
            </h6>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.filter((cat) => expenseSummary.byCategory[cat] > 0).map((cat) => {
                const amt = expenseSummary.byCategory[cat];
                const pct =
                  expenseSummary.totalMonthlyExpenses > 0
                    ? Math.round((amt / expenseSummary.totalMonthlyExpenses) * 100)
                    : 0;

                return (
                  <div key={cat} className="small mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-slate-dark">{cat}</span>
                      <span className="font-monospace text-muted">
                        {formatUSD(amt)} ({pct}%)
                      </span>
                    </div>
                    <div className="progress" style={{ height: '5px', backgroundColor: '#e2e8f0' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${pct}%`, backgroundColor: '#334155' }}
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
