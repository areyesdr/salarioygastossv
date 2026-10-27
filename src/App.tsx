import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
  Scale,
  Calendar,
  Clock,
  Wallet,
  UserCheck,
  LogIn,
  LogOut,
  AlertTriangle,
  SlidersHorizontal,
  Gift,
  ChevronDown,
  User,
  Shield,
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

  // UI state for dropdown and modal
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLawParamsModal, setShowLawParamsModal] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setShowLawParamsModal(false);
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
    <div className="min-h-screen d-flex flex-column bg-light">
      {/* Navbar Principal Simplificado y Limpio */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm py-2">
        <div className="container-fluid">
          {/* Brand limpio sin subtitulos redundantes */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold me-4">
            <span className="badge bg-white text-primary fs-6 font-monospace py-1 px-2 shadow-xs">
              SV
            </span>
            <span className="fs-5">Salario y Gastos SV</span>
          </Link>

          {/* Menú de navegación y sesión */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            {/* Tabs de Navegación Principal */}
            <div className="btn-group shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setCalcTab('payroll');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${
                  isCalculatorRoute && calcTab === 'payroll' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'
                }`}
              >
                <Scale size={15} />
                <span className="d-none d-md-inline">Descuentos &amp; Renta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcTab('bonuses');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${
                  isCalculatorRoute && calcTab === 'bonuses' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'
                }`}
              >
                <Calendar size={15} />
                <span className="d-none d-md-inline">Bonos de Ley</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcTab('hourly');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${
                  isCalculatorRoute && calcTab === 'hourly' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'
                }`}
              >
                <Clock size={15} />
                <span className="d-none d-md-inline">Costo Hora</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/mis-gastos')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 ${
                  isExpensesRoute ? 'btn-light fw-bold text-primary' : 'btn-outline-light'
                }`}
              >
                <Wallet size={15} />
                <span className="d-none d-md-inline">Mis Gastos</span>
              </button>
            </div>

            {/* Menú Desplegable de Perfil / Sesión y Roles (Simplificado) */}
            <div className="position-relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5"
                aria-expanded={showProfileMenu}
              >
                {user?.loggedIn ? (
                  <>
                    <UserCheck size={15} />
                    <span className="d-none d-sm-inline fw-semibold">{user.name}</span>
                    <span className="badge bg-white text-primary text-uppercase" style={{ fontSize: '10px' }}>
                      {user.role}
                    </span>
                  </>
                ) : (
                  <>
                    <User size={15} />
                    <span className="d-none d-sm-inline">Invitado</span>
                  </>
                )}
                <ChevronDown size={13} className="text-white-50" />
              </button>

              {/* Contenido del Dropdown */}
              {showProfileMenu && (
                <div
                  className="dropdown-menu dropdown-menu-end show shadow-sm p-2 mt-1 border"
                  style={{ minWidth: '240px', zIndex: 1050 }}
                >
                  <div className="px-2 py-1 mb-2 border-bottom">
                    <span className="small text-muted d-block">Sesión actual</span>
                    <strong className="text-dark d-block">
                      {user?.loggedIn ? user.name : 'Modo Invitado (Público)'}
                    </strong>
                    {user?.loggedIn && (
                      <span className="text-muted small font-monospace d-block" style={{ fontSize: '11px' }}>
                        {user.email}
                      </span>
                    )}
                  </div>

                  <div className="px-2 mb-2">
                    <span className="small text-muted d-block mb-1">Cambiar vista / rol:</span>
                    <div className="btn-group btn-group-sm w-100">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className={`btn btn-xs ${!user ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        Invitado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loginAs('user');
                          setShowProfileMenu(false);
                        }}
                        className={`btn btn-xs ${user?.role === 'user' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        Usuario
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loginAs('admin');
                          setShowProfileMenu(false);
                        }}
                        className={`btn btn-xs ${user?.role === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="dropdown-divider my-1" />

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="dropdown-item small py-1.5 d-flex align-items-center gap-2"
                    >
                      <Shield size={14} className="text-primary" />
                      <span>Panel de Administración</span>
                    </Link>
                  )}

                  <Link
                    to="/terminos"
                    onClick={() => setShowProfileMenu(false)}
                    className="dropdown-item small py-1.5"
                  >
                    Términos y Condiciones
                  </Link>
                  <Link
                    to="/privacidad"
                    onClick={() => setShowProfileMenu(false)}
                    className="dropdown-item small py-1.5"
                  >
                    Privacidad y Derechos ARCO
                  </Link>

                  <div className="dropdown-divider my-1" />

                  {user?.loggedIn ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="dropdown-item small py-1.5 text-danger d-flex align-items-center gap-1.5"
                    >
                      <LogOut size={14} />
                      <span>Cerrar Sesión</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setShowProfileMenu(false)}
                      className="dropdown-item small py-1.5 text-primary fw-semibold d-flex align-items-center gap-1.5"
                    >
                      <LogIn size={14} />
                      <span>Iniciar Sesión</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Salarial con Jerarquía Clara: Input Salario + Salario Líquido Destacado */}
      {(isCalculatorRoute || isExpensesRoute) && (
        <section className="bg-white border-bottom py-3 shadow-xs">
          <div className="container-fluid">
            <div className="row g-3 align-items-center">
              {/* Controles de Salario, Bonos y Frecuencia */}
              <div className="col-12 col-lg-7">
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="salary-input" className="form-label small fw-bold text-muted text-uppercase mb-1">
                      Salario Base ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                    </label>
                    <div className="input-group input-group-lg shadow-xs">
                      <span className="input-group-text bg-light font-monospace fw-bold text-muted">$</span>
                      <input
                        id="salary-input"
                        type="number"
                        min="0"
                        step="10"
                        value={salaryInput}
                        onChange={(e) => handleSalaryTextChange(e.target.value)}
                        className="form-control font-monospace fw-bold fs-3 text-dark"
                        placeholder="1000.00"
                      />
                    </div>
                  </div>

                  <div className="col-6 col-sm-3">
                    <label htmlFor="bonus-input" className="form-label small fw-bold text-muted text-uppercase mb-1">
                      Bono / Comisión
                    </label>
                    <div className="input-group input-group-lg shadow-xs">
                      <span className="input-group-text bg-light font-monospace text-muted">$</span>
                      <input
                        id="bonus-input"
                        type="number"
                        min="0"
                        step="10"
                        value={bonusInput}
                        onChange={(e) => handleBonusTextChange(e.target.value)}
                        className="form-control font-monospace fw-semibold fs-5 text-dark"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="col-6 col-sm-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-1">Frecuencia</label>
                    <div className="btn-group w-100 shadow-xs" role="group" style={{ height: '48px' }}>
                      <button
                        type="button"
                        onClick={() => setPeriod('monthly')}
                        className={`btn ${period === 'monthly' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                      >
                        Mes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriod('biweekly')}
                        className={`btn ${period === 'biweekly' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                      >
                        Quincena
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enlace sutil para abrir parámetros y tablas de ley sin saturar */}
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowLawParamsModal(true)}
                    className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1.5"
                  >
                    <SlidersHorizontal size={14} className="text-primary" />
                    <span className="small">Ver parámetros de ley y salarios mínimos de referencia</span>
                  </button>
                </div>
              </div>

              {/* Hero Block: Salario Líquido Prominente */}
              <div className="col-12 col-lg-5">
                <div className="p-3 bg-success-subtle rounded border border-success-subtle d-flex flex-column justify-content-center">
                  <span className="text-success-emphasis text-uppercase fw-bold small">
                    Salario Líquido a Recibir ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                  </span>
                  <div className="fs-2 fw-bold font-monospace text-success lh-1 my-1">
                    {formatUSD(activePayroll.netPay)}
                  </div>
                  <span className="text-muted small font-monospace">
                    {period === 'monthly'
                      ? `${formatUSD(biweeklyPayroll.netPay)} por quincena`
                      : `${formatUSD(monthlyPayroll.netPay)} por mes`}
                  </span>
                </div>
              </div>
            </div>

            {/* Fila Compacta de Métricas Secundarias */}
            <hr className="my-2.5 text-muted opacity-25" />
            <div className="row g-2 text-start small font-monospace">
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center gap-2 p-1.5 border rounded bg-light">
                  <div className="p-1 bg-white rounded text-danger border">
                    <Scale size={16} />
                  </div>
                  <div>
                    <span className="text-muted d-block" style={{ fontSize: '11px' }}>Descuentos de Ley:</span>
                    <strong className="text-danger">
                      -{formatUSD(activePayroll.totalEmployeeDeductions)} ({activePayroll.effectiveDeductionPct}%)
                    </strong>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center gap-2 p-1.5 border rounded bg-light">
                  <div className="p-1 bg-white rounded text-primary border">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-muted d-block" style={{ fontSize: '11px' }}>Valor Hora Neta:</span>
                    <strong className="text-primary">
                      {formatUSD(hourlyResult.netHourly)}/h
                    </strong>
                    <span className="text-muted ms-1" style={{ fontSize: '11px' }}>
                      (Bruta: {formatUSD(hourlyResult.grossHourly)}/h)
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center gap-2 p-1.5 border rounded bg-light">
                  <div className="p-1 bg-white rounded text-success border">
                    <Gift size={16} />
                  </div>
                  <div>
                    <span className="text-muted d-block" style={{ fontSize: '11px' }}>Bonos Anuales Estimados:</span>
                    <strong className="text-success">
                      +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                    </strong>
                    <span className="text-muted ms-1" style={{ fontSize: '11px' }}>
                      (Vac + Agui + Q25)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal de Parámetros de Ley y Salarios Mínimos */}
      {showLawParamsModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  <span>Parámetros Oficiales y Salarios de Ley (El Salvador)</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLawParamsModal(false)}
                />
              </div>

              <div className="modal-body">
                <h6 className="fw-bold text-muted text-uppercase small mb-2">
                  1. Salarios Mínimos Vigentes
                </h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered align-middle mb-0 font-monospace small">
                    <thead className="table-light">
                      <tr>
                        <th>Sector Económico</th>
                        <th>Mensual</th>
                        <th>Quincenal</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-sans">Comercio y Servicios</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.comercio.monthly)}</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.comercio.monthly / 2)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(MINIMUM_WAGES_2026.comercio.monthly)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-sans">Industria / Maquila</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.maquila.monthly)}</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.maquila.monthly / 2)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(MINIMUM_WAGES_2026.maquila.monthly)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-sans">Agropecuario (Café / Caña)</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.agropecuario.monthly)}</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.agropecuario.monthly / 2)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(MINIMUM_WAGES_2026.agropecuario.monthly)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h6 className="fw-bold text-muted text-uppercase small mb-2">
                  2. Topes Legales y Límites de Deducción
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0 font-monospace small">
                    <thead className="table-light">
                      <tr>
                        <th>Concepto Legal</th>
                        <th>Límite / Techo</th>
                        <th>Efecto de Ley</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-sans">Techo Cotizable ISSS</td>
                        <td>$1,000.00 / mes</td>
                        <td className="font-sans text-muted">Deducción máxima empleado: $30.00</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(1000)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar $1,000
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-sans">Techo Quincena 25 (Decreto 499)</td>
                        <td>$1,500.00 nominal</td>
                        <td className="font-sans text-muted">100% exento de ISSS, AFP y Renta</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(1500)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar $1,500
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-sans">Límite Tramo I ISR (Exento)</td>
                        <td>$550.00 imponible</td>
                        <td className="font-sans text-muted">Equivale a aprox. $606.06 nominal</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(606.06)}
                            className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          >
                            Cargar $606.06
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowLawParamsModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal con Router */}
      <main className="container-fluid py-4 flex-grow-1">
        <Routes>
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

          <Route path="/login" element={<LoginPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />

          <Route path="/401" element={<Error401 />} />
          <Route path="/403" element={<Error403 />} />
          <Route path="/500" element={<Error500 />} />
          <Route path="/503" element={<Error503 />} />

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

          <Route
            element={
              <ProtectedRoute isAllowed={canAccessAdminRoute(user)} redirectTo="/403" />
            }
          >
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Error404 />} />
        </Routes>
      </main>

      {/* Footer Bootstrap 5 con Disclaimer y Enlaces */}
      <footer className="bg-white border-top py-4 mt-auto">
        <div className="container-fluid space-y-3">
          <div className="alert alert-warning py-2 px-3 small mb-3 d-flex align-items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warning-emphasis" />
            <div style={{ fontSize: '12px' }}>
              <strong>Aviso Legal y Exoneración de Responsabilidad:</strong> Los cálculos de ISSS, AFP, Renta
              (ISR), Vacación 30%, Aguinaldo y Quincena 25 son estrictamente informativos, ilustrativos y
              referenciales. No sustituyen la asesoría legal, contable ni las liquidaciones oficiales del
              Ministerio de Trabajo (MTPS), Ministerio de Hacienda, ISSS o AFP. Sujeto a las leyes de la
              República de El Salvador y tribunales de San Salvador.
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 small text-muted">
            <div>
              <strong className="text-dark">Salario y Gastos SV</strong> · Titular: Axel Reyes (San Salvador,
              El Salvador · <span className="font-monospace">axel.f.reyes.a@gmail.com</span>)
            </div>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/terminos" className="text-decoration-none text-muted">
                Términos y Condiciones
              </Link>
              <Link to="/privacidad" className="text-decoration-none text-muted">
                Privacidad y Derechos ARCO
              </Link>
              <Link to="/admin" className="text-decoration-none text-muted">
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
