import React, { useState, useEffect, useMemo } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  Calendar,
  Clock,
  Wallet,
  Shield,
  UserCheck,
  LogIn,
  AlertTriangle,
} from 'lucide-react';
import {
  calcPayroll,
  calcVacation,
  calcAguinaldo,
  calcQuincena25,
  calcHourlyAndOvertime,
  MINIMUM_WAGES_2026,
  round2,
  type PayPeriod,
  type SeniorityBracket,
  type AguinaldoExemptionRule,
  type OvertimeTypeId,
} from './lib/svLaborLaw.ts';
import {
  canAccessPrivateRoute,
  canAccessAdminRoute,
  verifyResourceOwnership,
  filterOwnedResources,
} from './lib/security.ts';
import { useAuth } from './context/AuthContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { PayrollView } from './components/PayrollView.tsx';
import { BonusesView } from './components/BonusesView.tsx';
import { HourlyView } from './components/HourlyView.tsx';
import {
  ExpensesView,
  type ExpenseCategory,
  type ExpenseCycle,
  type ExpenseItem,
  type BonusGoalItem,
} from './components/ExpensesView.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import TerminosPage from './pages/TerminosPage.tsx';
import PrivacidadPage from './pages/PrivacidadPage.tsx';
import Error401 from './pages/errors/Error401.tsx';
import Error403 from './pages/errors/Error403.tsx';
import Error404 from './pages/errors/Error404.tsx';
import Error500 from './pages/errors/Error500.tsx';
import Error503 from './pages/errors/Error503.tsx';

type CalculatorTab = 'payroll' | 'bonuses' | 'hourly';

const DEFAULT_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    ownerId: 'usr-sv-01',
    name: 'Alquiler / Cuota de vivienda',
    amount: 320,
    category: 'Vivienda',
    cycle: 'quincena_1',
    isFixed: true,
    paid: true,
  },
  {
    id: 'exp-2',
    ownerId: 'usr-sv-01',
    name: 'Supermercado y mercado',
    amount: 210,
    category: 'Alimentación',
    cycle: 'mensual',
    isFixed: false,
    paid: false,
  },
  {
    id: 'exp-3',
    ownerId: 'usr-sv-01',
    name: 'Energía eléctrica, agua e internet',
    amount: 78,
    category: 'Servicios',
    cycle: 'quincena_2',
    isFixed: true,
    paid: false,
  },
  {
    id: 'exp-4',
    ownerId: 'usr-sv-01',
    name: 'Combustible / Transporte público',
    amount: 85,
    category: 'Transporte',
    cycle: 'mensual',
    isFixed: false,
    paid: false,
  },
  {
    id: 'exp-5',
    ownerId: 'usr-sv-01',
    name: 'Fondo de ahorro mensual',
    amount: 90,
    category: 'Ahorro',
    cycle: 'quincena_2',
    isFixed: true,
    paid: false,
  },
];

const DEFAULT_BONUS_GOALS: BonusGoalItem[] = [
  {
    id: 'bg-1',
    ownerId: 'usr-sv-01',
    title: 'Gastos de inicio de año y matrícula (Enero)',
    source: 'quincena25',
    amount: 300,
  },
  {
    id: 'bg-2',
    ownerId: 'usr-sv-01',
    title: 'Descanso familiar y mantenimiento hogar',
    source: 'vacacion',
    amount: 135,
  },
  {
    id: 'bg-3',
    ownerId: 'usr-sv-01',
    title: 'Fondo de emergencia y amortización de deuda (Diciembre)',
    source: 'aguinaldo',
    amount: 450,
  },
];

const STORAGE_KEY = 'salarioygastossv_state_v1';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins > 0 ? `${whole}h ${mins}m` : `${whole}h`;
}

function AppShell() {
  const { user, loginAs, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [monthlySalary, setMonthlySalary] = useState<number>(1000);
  const [salaryInput, setSalaryInput] = useState<string>('1000');
  const [extraMonthlyBonus, setExtraMonthlyBonus] = useState<number>(0);
  const [bonusInput, setBonusInput] = useState<string>('0');
  const [period, setPeriod] = useState<PayPeriod>('monthly');
  const [calcTab, setCalcTab] = useState<CalculatorTab>('payroll');

  // Vacation state
  const [vacationBonusPct, setVacationBonusPct] = useState<number>(30);
  const [vacationMode, setVacationMode] = useState<'bonus_only' | 'full_advance'>('bonus_only');
  const [vacationSector, setVacationSector] = useState<'privado' | 'publico'>('privado');
  const [splitDays, setSplitDays] = useState<[number, number, number]>([5, 5, 5]);

  // Aguinaldo state
  const [seniority, setSeniority] = useState<SeniorityBracket>('1-to-3');
  const [aguinaldoDaysUnder1, setAguinaldoDaysUnder1] = useState<number>(210);
  const [aguinaldoHireDate, setAguinaldoHireDate] = useState<string>('2026-05-15');
  const [aguinaldoExemptionRule, setAguinaldoExemptionRule] = useState<AguinaldoExemptionRule>('decreto_1500');

  // Quincena 25 state
  const [q25FullYear, setQ25FullYear] = useState<boolean>(true);
  const [q25DaysWorked, setQ25DaysWorked] = useState<number>(250);
  const [q25HireDate, setQ25HireDate] = useState<string>('2026-05-15');
  const [q25VoluntaryAboveCap, setQ25VoluntaryAboveCap] = useState<boolean>(false);

  // Hourly & overtime state
  const [daysPerMonth, setDaysPerMonth] = useState<number>(30);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [overtimeHoursMap, setOvertimeHoursMap] = useState<Record<OvertimeTypeId, number>>({
    ordinary: 0,
    extra_day: 4,
    extra_night: 2,
    rest_day: 0,
    rest_night: 0,
    holiday_day: 0,
    holiday_night: 0,
  });

  // Personal expenses state
  const [expenses, setExpenses] = useState<ExpenseItem[]>(DEFAULT_EXPENSES);
  const [expenseFilterCycle, setExpenseFilterCycle] = useState<'all' | ExpenseCycle>('all');
  const [newExpName, setNewExpName] = useState<string>('');
  const [newExpAmount, setNewExpAmount] = useState<string>('');
  const [newExpCategory, setNewExpCategory] = useState<ExpenseCategory>('Alimentación');
  const [newExpCycle, setNewExpCycle] = useState<ExpenseCycle>('mensual');
  const [newExpFixed, setNewExpFixed] = useState<boolean>(true);

  // Bonus allocation goals
  const [bonusGoals, setBonusGoals] = useState<BonusGoalItem[]>(DEFAULT_BONUS_GOALS);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalAmount, setNewGoalAmount] = useState<string>('');
  const [newGoalSource, setNewGoalSource] = useState<BonusGoalItem['source']>('quincena25');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.monthlySalary === 'number' && parsed.monthlySalary >= 0) {
        setMonthlySalary(parsed.monthlySalary);
        setSalaryInput(String(parsed.monthlySalary));
      }
      if (typeof parsed.extraMonthlyBonus === 'number' && parsed.extraMonthlyBonus >= 0) {
        setExtraMonthlyBonus(parsed.extraMonthlyBonus);
        setBonusInput(String(parsed.extraMonthlyBonus));
      }
      if (parsed.period === 'monthly' || parsed.period === 'biweekly') {
        setPeriod(parsed.period);
      }
      if (parsed.seniority) {
        setSeniority(parsed.seniority);
      }
      if (typeof parsed.daysPerMonth === 'number') setDaysPerMonth(parsed.daysPerMonth);
      if (typeof parsed.hoursPerDay === 'number') setHoursPerDay(parsed.hoursPerDay);
      if (Array.isArray(parsed.expenses)) {
        setExpenses(
          parsed.expenses.map((e: ExpenseItem) => ({
            ...e,
            ownerId: e.ownerId || 'usr-sv-01',
          }))
        );
      }
      if (Array.isArray(parsed.bonusGoals)) {
        setBonusGoals(
          parsed.bonusGoals.map((g: BonusGoalItem) => ({
            ...g,
            ownerId: g.ownerId || 'usr-sv-01',
          }))
        );
      }
    } catch {
      // Ignore malformed localStorage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          monthlySalary,
          extraMonthlyBonus,
          period,
          seniority,
          daysPerMonth,
          hoursPerDay,
          expenses,
          bonusGoals,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [monthlySalary, extraMonthlyBonus, period, seniority, daysPerMonth, hoursPerDay, expenses, bonusGoals]);

  // ID Matching: Only expose expenses and bonus goals owned by the logged-in user (or also allow admin to use their own or default user records)
  const effectiveOwnerUser = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') {
      return { ...user, id: 'usr-sv-01' };
    }
    return user;
  }, [user]);

  const userOwnedExpenses = useMemo(
    () => filterOwnedResources(expenses, effectiveOwnerUser),
    [expenses, effectiveOwnerUser]
  );

  const userOwnedGoals = useMemo(
    () => filterOwnedResources(bonusGoals, effectiveOwnerUser),
    [bonusGoals, effectiveOwnerUser]
  );

  const monthlyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'monthly', extraMonthlyBonus),
    [monthlySalary, extraMonthlyBonus]
  );
  const monthlyBaseOnlyPayroll = useMemo(() => calcPayroll(monthlySalary, 'monthly', 0), [monthlySalary]);
  const biweeklyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'biweekly', extraMonthlyBonus),
    [monthlySalary, extraMonthlyBonus]
  );
  const activePayroll = period === 'monthly' ? monthlyPayroll : biweeklyPayroll;

  const vacationResult = useMemo(
    () => calcVacation(monthlySalary, vacationBonusPct, splitDays),
    [monthlySalary, vacationBonusPct, splitDays]
  );

  const aguinaldoResult = useMemo(
    () =>
      calcAguinaldo({
        monthlySalary,
        seniorityBracket: seniority,
        daysWorkedUnderOneYear: aguinaldoDaysUnder1,
        exemptionRule: aguinaldoExemptionRule,
      }),
    [monthlySalary, seniority, aguinaldoDaysUnder1, aguinaldoExemptionRule]
  );

  const quincena25Result = useMemo(
    () =>
      calcQuincena25({
        monthlySalary,
        isFullYear: q25FullYear,
        daysWorkedToJan25: q25DaysWorked,
        simulateVoluntaryAboveCap: q25VoluntaryAboveCap,
      }),
    [monthlySalary, q25FullYear, q25DaysWorked, q25VoluntaryAboveCap]
  );

  const hourlyResult = useMemo(
    () => calcHourlyAndOvertime(monthlyPayroll.grossTotal, monthlyPayroll.netPay, daysPerMonth, hoursPerDay),
    [monthlyPayroll.grossTotal, monthlyPayroll.netPay, daysPerMonth, hoursPerDay]
  );

  const totalSimulatedOvertimeUsd = useMemo(() => {
    return round2(
      hourlyResult.overtimeRates.reduce((acc, rate) => {
        const count = overtimeHoursMap[rate.id] || 0;
        return acc + rate.hourlyRateUsd * count;
      }, 0)
    );
  }, [hourlyResult.overtimeRates, overtimeHoursMap]);

  const expenseSummary = useMemo(() => {
    let q1Total = 0;
    let q2Total = 0;
    let monthlySplitTotal = 0;
    let fixedTotal = 0;
    let variableTotal = 0;
    const byCategory: Record<ExpenseCategory, number> = {
      Vivienda: 0,
      Alimentación: 0,
      Transporte: 0,
      Servicios: 0,
      Deudas: 0,
      Salud: 0,
      Educación: 0,
      Ahorro: 0,
      Ocio: 0,
    };

    for (const item of userOwnedExpenses) {
      const amt = Math.max(0, item.amount);
      byCategory[item.category] = round2((byCategory[item.category] || 0) + amt);
      if (item.isFixed) fixedTotal += amt;
      else variableTotal += amt;

      if (item.cycle === 'quincena_1') {
        q1Total += amt;
      } else if (item.cycle === 'quincena_2') {
        q2Total += amt;
      } else {
        monthlySplitTotal += amt;
        q1Total += amt / 2;
        q2Total += amt / 2;
      }
    }

    const totalMonthlyExpenses = round2(
      userOwnedExpenses.reduce((sum, item) => sum + Math.max(0, item.amount), 0)
    );
    const netMonthly = monthlyPayroll.netPay;
    const netBiweekly = biweeklyPayroll.netPay;
    const remainingMonthly = round2(netMonthly - totalMonthlyExpenses);
    const remainingQ1 = round2(netBiweekly - q1Total);
    const remainingQ2 = round2(netBiweekly - q2Total);
    const totalHoursRequired =
      hourlyResult.netHourly > 0 ? round2(totalMonthlyExpenses / hourlyResult.netHourly) : 0;

    return {
      totalMonthlyExpenses,
      q1Total: round2(q1Total),
      q2Total: round2(q2Total),
      monthlySplitTotal: round2(monthlySplitTotal),
      fixedTotal: round2(fixedTotal),
      variableTotal: round2(variableTotal),
      remainingMonthly,
      remainingQ1,
      remainingQ2,
      totalHoursRequired,
      byCategory,
    };
  }, [userOwnedExpenses, monthlyPayroll.netPay, biweeklyPayroll.netPay, hourlyResult.netHourly]);

  const annualBonusesSummary = useMemo(() => {
    const vacNet =
      vacationSector === 'publico'
        ? 0
        : vacationMode === 'bonus_only'
          ? vacationResult.bonusOnlyMode.netBonusAfterDeductions
          : round2(vacationResult.fullAdvanceMode.netTotal - biweeklyPayroll.netPay);
    const vacGross = vacationSector === 'publico' ? 0 : vacationResult.bonus30Gross;
    const agNet = aguinaldoResult.netAguinaldo;
    const q25Net = quincena25Result.netQuincena25;

    const totalAnnualNetBonuses = round2(vacNet + agNet + q25Net);
    const totalAnnualGrossBonuses = round2(
      vacGross + aguinaldoResult.grossAguinaldo + quincena25Result.grossQuincena25
    );
    const allocatedTotal = round2(userOwnedGoals.reduce((acc, g) => acc + Math.max(0, g.amount), 0));
    const unallocated = round2(totalAnnualNetBonuses - allocatedTotal);

    return {
      vacNet,
      agNet,
      q25Net,
      totalAnnualNetBonuses,
      totalAnnualGrossBonuses,
      allocatedTotal,
      unallocated,
    };
  }, [
    vacationSector,
    vacationMode,
    vacationResult,
    biweeklyPayroll.netPay,
    aguinaldoResult,
    quincena25Result,
    userOwnedGoals,
  ]);

  const handleSalaryTextChange = (val: string) => {
    setSalaryInput(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setMonthlySalary(parsed);
    } else if (val.trim() === '') {
      setMonthlySalary(0);
    }
  };

  const handleBonusTextChange = (val: string) => {
    setBonusInput(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setExtraMonthlyBonus(parsed);
    } else if (val.trim() === '') {
      setExtraMonthlyBonus(0);
    }
  };

  const applyPresetSalary = (amount: number) => {
    setMonthlySalary(amount);
    setSalaryInput(amount.toFixed(2).replace(/\.00$/, ''));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOwnerUser) return;
    const amt = parseFloat(newExpAmount);
    if (!newExpName.trim() || Number.isNaN(amt) || amt <= 0) return;
    const item: ExpenseItem = {
      id: `exp-${Date.now()}`,
      ownerId: effectiveOwnerUser.id,
      name: newExpName.trim(),
      amount: round2(amt),
      category: newExpCategory,
      cycle: newExpCycle,
      isFixed: newExpFixed,
      paid: false,
    };
    setExpenses((prev) => [item, ...prev]);
    setNewExpName('');
    setNewExpAmount('');
  };

  const handleToggleExpensePaid = (id: string) => {
    setExpenses((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (!verifyResourceOwnership(item, effectiveOwnerUser)) return item;
        return { ...item, paid: !item.paid };
      })
    );
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) =>
      prev.filter((item) => {
        if (item.id !== id) return true;
        return !verifyResourceOwnership(item, effectiveOwnerUser);
      })
    );
  };

  const handleAddBonusGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOwnerUser) return;
    const amt = parseFloat(newGoalAmount);
    if (!newGoalTitle.trim() || Number.isNaN(amt) || amt <= 0) return;
    setBonusGoals((prev) => [
      ...prev,
      {
        id: `bg-${Date.now()}`,
        ownerId: effectiveOwnerUser.id,
        title: newGoalTitle.trim(),
        source: newGoalSource,
        amount: round2(amt),
      },
    ]);
    setNewGoalTitle('');
    setNewGoalAmount('');
  };

  const handleDeleteBonusGoal = (id: string) => {
    setBonusGoals((prev) =>
      prev.filter((g) => {
        if (g.id !== id) return true;
        return !verifyResourceOwnership(g, effectiveOwnerUser);
      })
    );
  };

  const isrMarkerPercent = useMemo(() => {
    const t = activePayroll.taxableIncome;
    const maxScale = period === 'monthly' ? 2600 : 1300;
    return Math.min(98, Math.max(2, (t / maxScale) * 100));
  }, [activePayroll.taxableIncome, period]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilterCycle === 'all') return userOwnedExpenses;
    return userOwnedExpenses.filter((e) => e.cycle === expenseFilterCycle);
  }, [userOwnedExpenses, expenseFilterCycle]);

  const isExpensesRoute = location.pathname === '/mis-gastos';
  const isCalculatorRoute = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#141413]">
      {/* Top Security & Role Switcher Strip */}
      <div className="bg-[#141413] text-[#EFECE6] text-[11px] border-b border-[#2C2B29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-tabular uppercase text-emerald-400 font-semibold">
              RBAC / Sesión:
            </span>
            {user?.loggedIn ? (
              <span className="font-mono-tabular">
                {user.name} ({user.role === 'admin' ? 'Administrador' : 'Usuario Registrado'} · ID:{' '}
                {user.id})
              </span>
            ) : (
              <span className="font-mono-tabular text-amber-300">
                Invitado (Anónimo · Solo calculadora pública)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#9E9A8E] hidden sm:inline">Cambiar vista de rol:</span>
            <button
              type="button"
              onClick={() => logout()}
              className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer ${
                !user ? 'bg-amber-500 text-[#141413] font-semibold' : 'bg-[#2C2B29] text-[#EFECE6]'
              }`}
            >
              Invitado
            </button>
            <button
              type="button"
              onClick={() => loginAs('user')}
              className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer ${
                user?.role === 'user'
                  ? 'bg-emerald-500 text-[#141413] font-semibold'
                  : 'bg-[#2C2B29] text-[#EFECE6]'
              }`}
            >
              Rol Usuario
            </button>
            <button
              type="button"
              onClick={() => loginAs('admin')}
              className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer ${
                user?.role === 'admin'
                  ? 'bg-emerald-500 text-[#141413] font-semibold'
                  : 'bg-[#2C2B29] text-[#EFECE6]'
              }`}
            >
              Rol Admin
            </button>
            <span className="text-[#4A4945]">|</span>
            <Link to="/admin" className="hover:underline text-emerald-300 font-mono-tabular">
              /admin
            </Link>
            <Link to="/terminos" className="hover:underline text-[#C7C3B8]">
              TyC
            </Link>
            <Link to="/privacidad" className="hover:underline text-[#C7C3B8]">
              Privacidad ARCO
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-[#E2DFD7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C3A] text-white flex items-center justify-center font-mono-tabular font-semibold text-sm shadow-xs">
              SV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-editorial text-xl font-semibold tracking-tight text-[#141413]">
                  Salario y Gastos SV
                </span>
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] font-medium">
                  Ley 2026 · Q25 2027
                </span>
              </div>
              <p className="text-xs text-[#65635E]">
                ISSS, AFP, Renta, Vacación 30%, Aguinaldo, Quincena 25, Costo por Hora y Presupuesto
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 bg-[#EFECE6] p-1 rounded-xl overflow-x-auto">
            {(
              [
                { id: 'payroll', label: 'Descuentos y Renta', icon: Scale },
                { id: 'bonuses', label: 'Bonos de Ley y Q25', icon: Calendar },
                { id: 'hourly', label: 'Costo Hora y Extras', icon: Clock },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = isCalculatorRoute && calcTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCalcTab(tab.id);
                    if (!isCalculatorRoute) navigate('/');
                  }}
                  className={`relative px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-[#141413]' : 'text-[#65635E] hover:text-[#141413]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMainTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-[#E2DFD7]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 text-[#0F4C3A]" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}

            {/* Protected Route Tab: /mis-gastos */}
            <button
              type="button"
              onClick={() => navigate('/mis-gastos')}
              className={`relative px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isExpensesRoute ? 'text-[#141413]' : 'text-[#65635E] hover:text-[#141413]'
              }`}
            >
              {isExpensesRoute && (
                <motion.div
                  layoutId="activeMainTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-xs border border-[#E2DFD7]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Wallet className="w-3.5 h-3.5 relative z-10 text-[#0F4C3A]" />
              <span className="relative z-10">Mis Gastos</span>
            </button>

            {user?.loggedIn ? (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-xs font-medium text-[#0F4C3A] flex items-center gap-1 whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{user.role === 'admin' ? 'Admin' : 'Mi Cuenta'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-xs font-medium bg-[#0F4C3A] text-white flex items-center gap-1 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Persistent Salary Input & Live KPI Strip on Calculator & Expenses routes */}
      {(isCalculatorRoute || isExpensesRoute) && (
        <section className="border-b border-[#E2DFD7] bg-[#FAF9F5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs focus-within:border-[#0F4C3A] transition-colors">
                    <label
                      htmlFor="salary-input"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]"
                    >
                      Salario Base Mensual (USD)
                    </label>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-mono-tabular text-[#65635E]">$</span>
                      <input
                        id="salary-input"
                        type="number"
                        min="0"
                        step="10"
                        value={salaryInput}
                        onChange={(e) => handleSalaryTextChange(e.target.value)}
                        className="w-full text-2xl font-mono-tabular font-semibold text-[#141413] bg-transparent focus:outline-none"
                        placeholder="1000.00"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 bg-white p-3 rounded-xl border border-[#DFDCD2] shadow-2xs focus-within:border-[#0F4C3A] transition-colors">
                    <label
                      htmlFor="bonus-input"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-[#65635E]"
                    >
                      Bono / Comisión Mes
                    </label>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-mono-tabular text-[#65635E]">$</span>
                      <input
                        id="bonus-input"
                        type="number"
                        min="0"
                        step="10"
                        value={bonusInput}
                        onChange={(e) => handleBonusTextChange(e.target.value)}
                        className="w-full text-xl font-mono-tabular font-medium text-[#141413] bg-transparent focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 bg-white p-2 rounded-xl border border-[#DFDCD2] flex flex-col justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#65635E] px-1">
                      Frecuencia de Pago
                    </span>
                    <div className="grid grid-cols-2 gap-1 bg-[#EFECE6] p-1 rounded-lg mt-1">
                      {(['monthly', 'biweekly'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPeriod(p)}
                          className={`relative py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                            period === p ? 'text-[#141413]' : 'text-[#65635E]'
                          }`}
                        >
                          {period === p && (
                            <motion.div
                              layoutId="periodPill"
                              className="absolute inset-0 bg-white rounded-md shadow-2xs"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{p === 'monthly' ? 'Mensual' : 'Quincenal'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#65635E] mr-1">Referencias:</span>
                  {[
                    { label: 'Mín. Comercio $408.80', value: MINIMUM_WAGES_2026.comercio.monthly },
                    { label: 'Mín. Maquila $402.32', value: MINIMUM_WAGES_2026.maquila.monthly },
                    { label: 'Exento ISR $550', value: 606.06 },
                    { label: '$800', value: 800 },
                    { label: 'Tope ISSS $1,000', value: 1000 },
                    { label: 'Tope Q25 $1,500', value: 1500 },
                    { label: '$2,200', value: 2200 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetSalary(preset.value)}
                      className={`text-[11px] font-mono-tabular px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        Math.abs(monthlySalary - preset.value) < 0.05
                          ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                          : 'bg-white text-[#4A4945] border-[#DFDCD2] hover:border-[#0F4C3A]/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                  <span className="text-[11px] text-[#65635E] block">
                    Líquido {period === 'monthly' ? 'Mensual' : 'Quincenal'}
                  </span>
                  <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                    {formatUSD(activePayroll.netPay)}
                  </div>
                  <span className="text-[11px] font-mono-tabular text-[#65635E]">
                    {period === 'monthly'
                      ? `${formatUSD(biweeklyPayroll.netPay)} / quincena`
                      : `${formatUSD(monthlyPayroll.netPay)} / mes`}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                  <span className="text-[11px] text-[#65635E] block">Descuentos de Ley</span>
                  <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#B91C1C]">
                    -{formatUSD(activePayroll.totalEmployeeDeductions)}
                  </div>
                  <span className="text-[11px] font-mono-tabular text-[#65635E]">
                    {activePayroll.effectiveDeductionPct}% · {activePayroll.isrDetail.bracketLabel}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                  <span className="text-[11px] text-[#65635E] block">Valor Hora Neta</span>
                  <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#141413]">
                    {formatUSD(hourlyResult.netHourly)}
                    <span className="text-xs font-normal text-[#65635E]">/h</span>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-[#65635E]">
                    Bruta: {formatUSD(hourlyResult.grossHourly)}/h
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#DFDCD2]">
                  <span className="text-[11px] text-[#65635E] block">Bonos Anuales (Neto)</span>
                  <div className="mt-1 text-lg sm:text-xl font-mono-tabular font-semibold text-[#0F4C3A]">
                    +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                  </div>
                  <span className="text-[11px] font-mono-tabular text-[#65635E]">
                    Vac. + Agui. + Q25
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Central Router with ProtectedRoute Guards */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* RUTA PÚBLICA PRINCIPAL: Calculadora de Salario, Bonos y Horas */}
          <Route
            path="/"
            element={
              <AnimatePresence mode="wait">
                {calcTab === 'payroll' && (
                  <PayrollView
                    period={period}
                    activePayroll={activePayroll}
                    monthlyPayroll={monthlyPayroll}
                    monthlyBaseOnlyPayroll={monthlyBaseOnlyPayroll}
                    extraMonthlyBonus={extraMonthlyBonus}
                    isrMarkerPercent={isrMarkerPercent}
                    formatUSD={formatUSD}
                  />
                )}
                {calcTab === 'bonuses' && (
                  <BonusesView
                    monthlySalary={monthlySalary}
                    monthlyNetPay={monthlyPayroll.netPay}
                    biweeklyNetPay={biweeklyPayroll.netPay}
                    totalAnnualNetBonuses={annualBonusesSummary.totalAnnualNetBonuses}
                    quincena25Result={quincena25Result}
                    vacationResult={vacationResult}
                    aguinaldoResult={aguinaldoResult}
                    q25FullYear={q25FullYear}
                    setQ25FullYear={setQ25FullYear}
                    q25DaysWorked={q25DaysWorked}
                    setQ25DaysWorked={setQ25DaysWorked}
                    q25HireDate={q25HireDate}
                    setQ25HireDate={setQ25HireDate}
                    q25VoluntaryAboveCap={q25VoluntaryAboveCap}
                    setQ25VoluntaryAboveCap={setQ25VoluntaryAboveCap}
                    seniority={seniority}
                    setSeniority={setSeniority}
                    aguinaldoDaysUnder1={aguinaldoDaysUnder1}
                    setAguinaldoDaysUnder1={setAguinaldoDaysUnder1}
                    aguinaldoHireDate={aguinaldoHireDate}
                    setAguinaldoHireDate={setAguinaldoHireDate}
                    aguinaldoExemptionRule={aguinaldoExemptionRule}
                    setAguinaldoExemptionRule={setAguinaldoExemptionRule}
                    vacationSector={vacationSector}
                    setVacationSector={setVacationSector}
                    vacationBonusPct={vacationBonusPct}
                    setVacationBonusPct={setVacationBonusPct}
                    vacationMode={vacationMode}
                    setVacationMode={setVacationMode}
                    splitDays={splitDays}
                    setSplitDays={setSplitDays}
                    formatUSD={formatUSD}
                  />
                )}
                {calcTab === 'hourly' && (
                  <HourlyView
                    daysPerMonth={daysPerMonth}
                    setDaysPerMonth={setDaysPerMonth}
                    hoursPerDay={hoursPerDay}
                    setHoursPerDay={setHoursPerDay}
                    hourlyResult={hourlyResult}
                    overtimeHoursMap={overtimeHoursMap}
                    setOvertimeHoursMap={setOvertimeHoursMap}
                    totalSimulatedOvertimeUsd={totalSimulatedOvertimeUsd}
                    onSimulateOvertimeInPayroll={(amt) => {
                      setExtraMonthlyBonus(amt);
                      setBonusInput(String(amt));
                      setCalcTab('payroll');
                    }}
                    formatUSD={formatUSD}
                  />
                )}
              </AnimatePresence>
            }
          />

          {/* RUTAS PÚBLICAS DE AUTENTICACIÓN Y CUMPLIMIENTO LEGAL SV */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />

          {/* CATÁLOGO DE PÁGINAS DE ERROR HTTP */}
          <Route path="/401" element={<Error401 />} />
          <Route path="/403" element={<Error403 />} />
          <Route path="/500" element={<Error500 />} />
          <Route path="/503" element={<Error503 />} />

          {/* RUTA PROTEGIDA: Solo usuarios autenticados (RBAC + ID Matching) */}
          <Route
            element={
              <ProtectedRoute isAllowed={canAccessPrivateRoute(user)} redirectTo="/401" />
            }
          >
            <Route
              path="/mis-gastos"
              element={
                <ExpensesView
                  monthlyNetPay={monthlyPayroll.netPay}
                  netHourly={hourlyResult.netHourly}
                  totalHoursPerMonth={hourlyResult.totalHoursPerMonth}
                  expenseSummary={expenseSummary}
                  annualBonusesSummary={annualBonusesSummary}
                  filteredExpenses={filteredExpenses}
                  expenseFilterCycle={expenseFilterCycle}
                  setExpenseFilterCycle={setExpenseFilterCycle}
                  newExpName={newExpName}
                  setNewExpName={setNewExpName}
                  newExpAmount={newExpAmount}
                  setNewExpAmount={setNewExpAmount}
                  newExpCategory={newExpCategory}
                  setNewExpCategory={setNewExpCategory}
                  newExpCycle={newExpCycle}
                  setNewExpCycle={setNewExpCycle}
                  newExpFixed={newExpFixed}
                  setNewExpFixed={setNewExpFixed}
                  onAddExpense={handleAddExpense}
                  onToggleExpensePaid={handleToggleExpensePaid}
                  onDeleteExpense={handleDeleteExpense}
                  onResetDefaultExpenses={() => setExpenses(DEFAULT_EXPENSES)}
                  bonusGoals={userOwnedGoals}
                  newGoalTitle={newGoalTitle}
                  setNewGoalTitle={setNewGoalTitle}
                  newGoalAmount={newGoalAmount}
                  setNewGoalAmount={setNewGoalAmount}
                  newGoalSource={newGoalSource}
                  setNewGoalSource={setNewGoalSource}
                  onAddBonusGoal={handleAddBonusGoal}
                  onDeleteBonusGoal={handleDeleteBonusGoal}
                  formatUSD={formatUSD}
                  formatHours={formatHours}
                />
              }
            />
          </Route>

          {/* RUTA DE ADMINISTRACIÓN: Solo rol admin (redirige a /403 si es usuario común) */}
          <Route
            element={
              <ProtectedRoute isAllowed={canAccessAdminRoute(user)} redirectTo="/403" />
            }
          >
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* ERROR 404: Captura cualquier URL que no exista */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </main>

      {/* Footer with Legal Disclaimer, Provider Identification (Ley de Comercio Electrónico SV) & Links */}
      <footer className="border-t border-[#E2DFD7] bg-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-xs text-[#65635E]">
          {/* Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#141413]">Aviso Legal y Exoneración de Responsabilidad:</strong> Los
              cálculos de ISSS, AFP, Renta (ISR), Vacación 30%, Aguinaldo y Quincena 25 son estrictamente{' '}
              <strong>informativos, ilustrativos y referenciales</strong>. No sustituyen la asesoría legal,
              contable, financiera ni las liquidaciones oficiales del Ministerio de Trabajo (MTPS), Ministerio
              de Hacienda, ISSS o AFP. Sujeto a las leyes de la República de El Salvador y jurisdicción de San
              Salvador.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <strong className="text-[#141413]">Salario y Gastos SV</strong> · Proveedor: Axel Reyes (San
              Salvador, El Salvador · <span className="font-mono-tabular">axel.f.reyes.a@gmail.com</span>)
            </div>
            <div className="flex flex-wrap items-center gap-4 font-medium">
              <Link to="/terminos" className="text-[#0F4C3A] hover:underline flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Términos y Condiciones</span>
              </Link>
              <Link to="/privacidad" className="text-[#0F4C3A] hover:underline flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Política de Privacidad y Derechos ARCO</span>
              </Link>
              <Link to="/admin" className="text-[#65635E] hover:text-[#141413]">
                Panel Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
