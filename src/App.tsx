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
  LogIn,
  LogOut,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Gift,
  TrendingUp,
  Trash2,
  Pencil,
  Activity,
} from 'lucide-react';
import {
  calcPayroll,
  calcVacation,
  calcAguinaldo,
  calcQuincena25,
  calcHourlyAndOvertime,
  calcSeniorityFromHireDate,
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
import { useTheme } from './context/ThemeContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { PayrollView } from './components/PayrollView.tsx';
import { BonusesView } from './components/BonusesView.tsx';
import { HourlyView } from './components/HourlyView.tsx';
import { IncapacityView } from './components/IncapacityView.tsx';
import {
  ExpensesView,
  type ExpenseCategory,
  type ExpenseCycle,
  type ExpenseItem,
  type BonusGoalItem,
} from './components/ExpensesView.tsx';
import { type MonthLedger } from './lib/monthlyLedger.ts';
import {
  fetchMonthLedgersFromSupabase,
  upsertMonthLedgerToSupabase,
  fetchSalaryHistoryFromSupabase,
  addSalaryRecordToSupabase,
  fetchUserProfileFromSupabase,
  updateProfileHireDateInSupabase,
  updateSalaryRecordInSupabase,
  deleteSalaryRecordFromSupabase,
  isSupabaseConfigured,
  type DbSalaryHistory,
} from './lib/supabase.ts';
import { formatUSD, parseUSDCurrency, formatHours } from './lib/formatters.ts';
import LoginPage from './pages/LoginPage.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import TerminosPage from './pages/TerminosPage.tsx';
import PrivacidadPage from './pages/PrivacidadPage.tsx';
import Error401 from './pages/errors/Error401.tsx';
import Error403 from './pages/errors/Error403.tsx';
import Error404 from './pages/errors/Error404.tsx';
import Error500 from './pages/errors/Error500.tsx';
import Error503 from './pages/errors/Error503.tsx';

type CalculatorTab = 'payroll' | 'bonuses' | 'hourly' | 'incapacity';

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
    name: 'Supermercado y despensa',
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
    name: 'Combustible / Transporte',
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
    title: 'Gastos de inicio de año y matrícula',
    source: 'quincena25',
    amount: 300,
  },
  {
    id: 'bg-2',
    ownerId: 'usr-sv-01',
    title: 'Descanso vacacional y mantenimiento',
    source: 'vacacion',
    amount: 135,
  },
  {
    id: 'bg-3',
    ownerId: 'usr-sv-01',
    title: 'Fondo de emergencia (Diciembre)',
    source: 'aguinaldo',
    amount: 450,
  },
];

const DEFAULT_MONTH_LEDGERS: MonthLedger[] = [
  {
    id: 'ledger-sv-2026-1',
    ownerId: 'usr-sv-01',
    year: 2026,
    month: 1,
    q1: {
      items: [
        { id: 'item-q1-1', day: 15, desc: 'Ofrenda', amount: 25.0, type: 'expense', isRecurring: true },
        { id: 'item-q1-2', day: 15, desc: 'Gasolina', amount: 30.0, type: 'expense', isRecurring: true },
        { id: 'item-q1-3', day: 15, desc: 'Ahorro', amount: 40.0, type: 'expense', isRecurring: true },
        { id: 'item-q1-4', day: 15, desc: 'Comida', amount: 35.0, type: 'expense', isRecurring: true },
        { id: 'item-q1-5', day: 15, desc: 'Salida con amigos', amount: 13.88, type: 'expense', isRecurring: false },
      ],
    },
    q2: {
      items: [
        { id: 'item-q2-1', day: 30, desc: 'Ofrenda', amount: 25.0, type: 'expense', isRecurring: true },
        { id: 'item-q2-2', day: 30, desc: 'Gasolina', amount: 30.0, type: 'expense', isRecurring: true },
        { id: 'item-q2-3', day: 30, desc: 'Ahorro', amount: 40.0, type: 'expense', isRecurring: true },
        { id: 'item-q2-4', day: 30, desc: 'Internet', amount: 28.0, type: 'expense', isRecurring: true },
        { id: 'item-q2-5', day: 30, desc: 'Salida familiar', amount: 20.0, type: 'expense', isRecurring: false },
      ],
    },
  },
];

const STORAGE_KEY = 'salarioygastossv_state_v1';
const LEDGERS_STORAGE_KEY = 'salarioygastossv_ledgers_v1';



function AppShell() {
  const { user, logout, isAuthReady } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [monthlySalary, setMonthlySalary] = useState<number>(MINIMUM_WAGES_2026.comercio.monthly);
  const [salaryInput, setSalaryInput] = useState<string>(MINIMUM_WAGES_2026.comercio.monthly.toFixed(2));
  const [extraMonthlyBonus, setExtraMonthlyBonus] = useState<number>(0);
  const [bonusInput, setBonusInput] = useState<string>('0');
  const [period, setPeriod] = useState<PayPeriod>('monthly');
  const [calcTab, setCalcTab] = useState<CalculatorTab>('payroll');

  // Fecha de inicio de labores global
  const [hireDate, setHireDate] = useState<string>('2023-01-16');

  // UI state for dropdown and modal
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLawParamsModal, setShowLawParamsModal] = useState<boolean>(false);
  const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState<boolean>(false);
  const [salaryHistoryList, setSalaryHistoryList] = useState<DbSalaryHistory[]>([]);
  const [newSalaryAmount, setNewSalaryAmount] = useState<string>('');
  const [newSalaryEffectiveDate, setNewSalaryEffectiveDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [newSalaryReason, setNewSalaryReason] = useState<string>('Aumento salarial');
  const [isNewJob, setIsNewJob] = useState<boolean>(false);
  const [newJobCompany, setNewJobCompany] = useState<string>('');
  const [newJobHireDate, setNewJobHireDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [salarySaveFeedback, setSalarySaveFeedback] = useState<string>('');
  const [isSavingSalary, setIsSavingSalary] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Escuchar scroll para mostrar botón volver arriba en pantallas móviles
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!showLawParamsModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLawParamsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLawParamsModal]);

  // Vacation state
  const [vacationBonusPct, setVacationBonusPct] = useState<number>(30);
  const [vacationMode, setVacationMode] = useState<'bonus_only' | 'full_advance'>('bonus_only');
  const [vacationSector, setVacationSector] = useState<'privado' | 'publico'>('privado');
  const [splitDays, setSplitDays] = useState<[number, number, number]>([5, 5, 5]);

  // Aguinaldo state
  const [seniority, setSeniority] = useState<SeniorityBracket>('1-to-3');
  const [aguinaldoDaysUnder1, setAguinaldoDaysUnder1] = useState<number>(210);
  const [aguinaldoHireDate, setAguinaldoHireDate] = useState<string>('2023-01-16');
  const [aguinaldoExemptionRule, setAguinaldoExemptionRule] = useState<AguinaldoExemptionRule>('decreto_1500');

  // Quincena 25 state
  const [q25FullYear, setQ25FullYear] = useState<boolean>(true);
  const [q25DaysWorked, setQ25DaysWorked] = useState<number>(250);
  const [q25HireDate, setQ25HireDate] = useState<string>('2023-01-16');
  const [q25VoluntaryAboveCap, setQ25VoluntaryAboveCap] = useState<boolean>(false);

  // Cálculo de antigüedad exacta y sincronización con prestaciones
  const seniorityDetails = useMemo(() => {
    return calcSeniorityFromHireDate(hireDate);
  }, [hireDate]);

  const handleHireDateChange = (newDate: string) => {
    setHireDate(newDate);
    const details = calcSeniorityFromHireDate(newDate);
    setSeniority(details.aguinaldoSeniorityBracket);
    setAguinaldoDaysUnder1(details.aguinaldoDaysWorked);
    setAguinaldoHireDate(newDate);
    setQ25FullYear(details.q25IsFullYear);
    setQ25DaysWorked(details.q25DaysWorked);
    setQ25HireDate(newDate);

    if (isSupabaseConfigured && user?.id) {
      updateProfileHireDateInSupabase(user.id, newDate);
    }
  };

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

  // Monthly ledgers state (Libreta Quincenal por Meses)
  const [monthLedgers, setMonthLedgers] = useState<MonthLedger[]>(() => {
    try {
      const raw = localStorage.getItem(LEDGERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_MONTH_LEDGERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LEDGERS_STORAGE_KEY, JSON.stringify(monthLedgers));
    } catch {
      // Ignore quota errors
    }
  }, [monthLedgers]);

  // Sincronización atómica de perfil, salario y libreta desde Supabase para usuario autenticado
  useEffect(() => {
    if (!isAuthReady) return;

    if (!isSupabaseConfigured || !user?.id) {
      setSalaryHistoryList([]);
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    let isMounted = true;

    Promise.all([
      fetchUserProfileFromSupabase(user.id),
      fetchSalaryHistoryFromSupabase(user.id),
      fetchMonthLedgersFromSupabase(user.id),
    ])
      .then(([profile, history, remoteMap]) => {
        if (!isMounted) return;

        if (profile?.current_hire_date) {
          handleHireDateChange(profile.current_hire_date);
        }

        if (history) {
          setSalaryHistoryList(history);
          if (history.length > 0) {
            const latest = history[0];
            if (latest && typeof latest.gross_salary === 'number' && latest.gross_salary > 0) {
              setMonthlySalary(latest.gross_salary);
              setSalaryInput(latest.gross_salary.toFixed(2));
            }
          }
        }

        if (remoteMap && Object.keys(remoteMap).length > 0) {
          setMonthLedgers((prev) => {
            const map = new Map<string, MonthLedger>();
            for (const item of prev) {
              map.set(`${item.year}-${item.month}`, item);
            }
            for (const key of Object.keys(remoteMap)) {
              map.set(key, remoteMap[key]);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.error('Error sincronizando datos con Supabase:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthReady]);

  const handleSaveMonthLedger = (updated: MonthLedger) => {
    setMonthLedgers((prev) => {
      const existingIndex = prev.findIndex(
        (m) => m.year === updated.year && m.month === updated.month
      );
      const ledgerToSave = {
        ...updated,
        ownerId: user?.id || updated.ownerId || 'usr-sv-01',
      };
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = ledgerToSave;
        return next;
      }
      return [...prev, ledgerToSave];
    });

    if (isSupabaseConfigured && user?.id) {
      upsertMonthLedgerToSupabase(user.id, updated, monthlySalary);
    }
  };

  const handleStartEditSalaryRecord = (rec: DbSalaryHistory) => {
    setEditingRecordId(rec.id || null);
    setNewSalaryAmount(String(rec.gross_salary));
    setNewSalaryEffectiveDate(rec.effective_date);
    setNewSalaryReason(rec.reason || 'Aumento salarial');
    setIsNewJob(Boolean(rec.hire_date || rec.company_name));
    setNewJobCompany(rec.company_name || '');
    setNewJobHireDate(rec.hire_date || rec.effective_date);
    setSalarySaveFeedback('');
  };

  const handleCancelEditSalaryRecord = () => {
    setEditingRecordId(null);
    setNewSalaryAmount(String(monthlySalary));
    setNewSalaryEffectiveDate(new Date().toISOString().slice(0, 10));
    setNewSalaryReason('Aumento salarial');
    setIsNewJob(false);
    setNewJobCompany('');
    setSalarySaveFeedback('');
  };

  const handleDeleteSalaryRecord = async (recId?: string) => {
    if (!user?.id || !recId) return;

    const success = await deleteSalaryRecordFromSupabase(user.id, recId);
    if (success) {
      setSalarySaveFeedback('Registro eliminado.');
      setTimeout(() => setSalarySaveFeedback(''), 3000);
      const updated = await fetchSalaryHistoryFromSupabase(user.id);
      setSalaryHistoryList(updated);
      if (editingRecordId === recId) {
        handleCancelEditSalaryRecord();
      }
    } else {
      setSalarySaveFeedback('Error al eliminar el registro.');
    }
  };

  const handleSaveSalaryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const amt = parseFloat(newSalaryAmount) || monthlySalary;
    if (amt <= 0) return;

    setIsSavingSalary(true);
    setSalarySaveFeedback('');
    try {
      const reasonText = isNewJob
        ? (newSalaryReason.trim() ? newSalaryReason.trim() : 'Contratación')
        : (newSalaryReason.trim() || 'Aumento salarial');

      const payload = {
        gross_salary: amt,
        effective_date: newSalaryEffectiveDate,
        reason: reasonText,
        company_name: isNewJob && newJobCompany.trim() ? newJobCompany.trim() : null,
        hire_date: isNewJob ? newJobHireDate : null,
      };

      let success: boolean;
      if (editingRecordId) {
        success = await updateSalaryRecordInSupabase(user.id, editingRecordId, payload);
      } else {
        success = await addSalaryRecordToSupabase(user.id, payload);
      }

      if (success) {
        setMonthlySalary(amt);
        setSalaryInput(amt.toFixed(2));
        if (isNewJob && newJobHireDate) {
          handleHireDateChange(newJobHireDate);
        }
        setSalarySaveFeedback(
          editingRecordId ? 'Registro actualizado con éxito.' : 'Guardado correctamente en Supabase.'
        );
        setTimeout(() => setSalarySaveFeedback(''), 3500);
        const updated = await fetchSalaryHistoryFromSupabase(user.id);
        setSalaryHistoryList(updated);
        handleCancelEditSalaryRecord();
      } else {
        setSalarySaveFeedback('Error al guardar en Supabase.');
      }
    } finally {
      setIsSavingSalary(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.monthlySalary === 'number' && parsed.monthlySalary >= 0) {
        setMonthlySalary(parsed.monthlySalary);
        setSalaryInput(String(parsed.monthlySalary));
      } else {
        setMonthlySalary(MINIMUM_WAGES_2026.comercio.monthly);
        setSalaryInput(MINIMUM_WAGES_2026.comercio.monthly.toFixed(2));
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
      if (typeof parsed.hireDate === 'string' && parsed.hireDate) {
        setHireDate(parsed.hireDate);
        const details = calcSeniorityFromHireDate(parsed.hireDate);
        setSeniority(details.aguinaldoSeniorityBracket);
        setAguinaldoDaysUnder1(details.aguinaldoDaysWorked);
        setAguinaldoHireDate(parsed.hireDate);
        setQ25FullYear(details.q25IsFullYear);
        setQ25DaysWorked(details.q25DaysWorked);
        setQ25HireDate(parsed.hireDate);
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
          hireDate,
          expenses,
          bonusGoals,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [monthlySalary, extraMonthlyBonus, period, seniority, daysPerMonth, hoursPerDay, hireDate, expenses, bonusGoals]);

  const effectiveOwnerUser = user;

  const userOwnedExpenses = useMemo(() => {
    if (!user) return [];
    const direct = filterOwnedResources(expenses, user);
    if (direct.length > 0) return direct;
    return expenses.filter((e) => e.ownerId === 'usr-sv-01' || e.ownerId === user.id);
  }, [expenses, user]);

  const userOwnedGoals = useMemo(() => {
    if (!user) return [];
    const direct = filterOwnedResources(bonusGoals, user);
    if (direct.length > 0) return direct;
    return bonusGoals.filter((g) => g.ownerId === 'usr-sv-01' || g.ownerId === user.id);
  }, [bonusGoals, user]);

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

  const legalBonuses = useMemo(() => ({
    vacationBonusNet: vacationResult.bonusOnlyMode.netBonusAfterDeductions,
    vacationFullNet: vacationResult.fullAdvanceMode.netTotal,
    vacationBonusGross: vacationResult.bonus30Gross,
    aguinaldoNet: aguinaldoResult.netAguinaldo,
    q25Net: quincena25Result.netQuincena25,
  }), [vacationResult, aguinaldoResult, quincena25Result]);

  const handleSalaryTextChange = (val: string) => {
    setSalaryInput(val);
    if (val.trim() === '') {
      setMonthlySalary(0);
      return;
    }
    const parsed = parseUSDCurrency(val);
    if (parsed >= 0) {
      setMonthlySalary(parsed);
    }
  };

  const handleBonusTextChange = (val: string) => {
    setBonusInput(val);
    if (val.trim() === '') {
      setExtraMonthlyBonus(0);
      return;
    }
    const parsed = parseUSDCurrency(val);
    if (parsed >= 0) {
      setExtraMonthlyBonus(parsed);
    }
  };

  const applyPresetSalary = (amount: number) => {
    setMonthlySalary(amount);
    setSalaryInput(amount.toFixed(2));
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

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses((prev) =>
      prev.map((item) => {
        if (item.id !== updated.id) return item;
        if (!verifyResourceOwnership(item, effectiveOwnerUser)) return item;
        return updated;
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
    <div className="min-h-screen d-flex flex-column app-root-layout">
      {/* Header Institucional Minimalista Sticky */}
      <header className="sticky-top header-sticky" style={{ zIndex: 1030 }}>
        <nav className="navbar navbar-expand navbar-dark navbar-institutional py-2 px-3">
          <div className="container-constrained d-flex justify-content-between align-items-center">
            {/* Logo sobrio institucional */}
            <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none me-2">
              <div
                className="d-flex align-items-center justify-content-center rounded font-monospace fw-bold text-white shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                SV
              </div>
              <span className="fs-6 fw-semibold text-white tracking-tight">MiNominaSV</span>
            </Link>

            {/* Enlaces de Navegación Secundarios Centrales (Desktop) */}
            <div className="d-none d-lg-flex align-items-center gap-1 mx-auto">
              <button
                type="button"
                onClick={() => {
                  setCalcTab('payroll');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm border-0 nav-link-subtle d-inline-flex align-items-center gap-2 ${
                  isCalculatorRoute && calcTab === 'payroll' ? 'active' : ''
                }`}
              >
                <Scale size={14} />
                <span>Calculadora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcTab('bonuses');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm border-0 nav-link-subtle d-inline-flex align-items-center gap-2 ${
                  isCalculatorRoute && calcTab === 'bonuses' ? 'active' : ''
                }`}
              >
                <Calendar size={14} />
                <span>Bonos de Ley</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcTab('hourly');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm border-0 nav-link-subtle d-inline-flex align-items-center gap-2 ${
                  isCalculatorRoute && calcTab === 'hourly' ? 'active' : ''
                }`}
              >
                <Clock size={14} />
                <span>Costo Hora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcTab('incapacity');
                  if (!isCalculatorRoute) navigate('/');
                }}
                className={`btn btn-sm border-0 nav-link-subtle d-inline-flex align-items-center gap-2 ${
                  isCalculatorRoute && calcTab === 'incapacity' ? 'active' : ''
                }`}
              >
                <Activity size={14} />
                <span>Incapacidades</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/mis-gastos')}
                className={`btn btn-sm border-0 nav-link-subtle d-inline-flex align-items-center gap-2 ${
                  isExpensesRoute ? 'active' : ''
                }`}
              >
                <Wallet size={14} />
                <span>Mis Gastos</span>
              </button>
            </div>

            {/* Selector de Tema Visual y Acceso de Usuario */}
            <div className="d-flex align-items-center gap-2">
              <div className="theme-toggle-control" role="group" aria-label="Selector de tema visual">
                <button
                  type="button"
                  title="Tema del sistema (detecta configuración del OS)"
                  className={`theme-toggle-btn ${themeMode === 'system' ? 'active' : ''}`}
                  onClick={() => setThemeMode('system')}
                >
                  <Monitor size={13} />
                </button>
                <button
                  type="button"
                  title="Modo claro"
                  className={`theme-toggle-btn ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => setThemeMode('light')}
                >
                  <Sun size={13} />
                </button>
                <button
                  type="button"
                  title="Modo oscuro"
                  className={`theme-toggle-btn ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                >
                  <Moon size={13} />
                </button>
              </div>

              {/* Área de Autenticación Sobria a la Derecha */}
              <div className="d-flex align-items-center ms-1">
                {user?.loggedIn ? (
                  <div className="position-relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowProfileMenu((prev) => !prev)}
                      className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2 py-1 px-2.5"
                      style={{ fontSize: '12px' }}
                    >
                      <User size={13} />
                      <span className="d-none d-sm-inline">{user.name}</span>
                      <ChevronDown size={11} className="opacity-75" />
                    </button>

                    {showProfileMenu && (
                      <div
                        className="dropdown-menu dropdown-menu-end show shadow-sm p-2 mt-1 border"
                        style={{ minWidth: '220px', maxWidth: 'calc(100vw - 2rem)', right: 0, left: 'auto', zIndex: 1050, fontSize: '13px' }}
                      >
                        <div className="px-2 py-1 mb-1 border-bottom">
                          <span className="small text-muted d-block" style={{ fontSize: '11px' }}>
                            Sesión activa
                          </span>
                          <strong className="text-dark d-block">{user.name}</strong>
                          <span className="text-muted d-block font-monospace" style={{ fontSize: '11px' }}>
                            {user.email}
                          </span>
                        </div>

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="dropdown-item py-1.5 d-flex align-items-center gap-2 text-dark"
                          >
                            <Shield size={13} />
                            <span>Panel de Administración</span>
                          </Link>
                        )}

                        <Link
                          to="/terminos"
                          onClick={() => setShowProfileMenu(false)}
                          className="dropdown-item py-1.5 text-muted d-flex align-items-center gap-2"
                        >
                          <Scale size={13} />
                          <span>Términos de Uso</span>
                        </Link>
                        <Link
                          to="/privacidad"
                          onClick={() => setShowProfileMenu(false)}
                          className="dropdown-item py-1.5 text-muted d-flex align-items-center gap-2"
                        >
                          <Shield size={13} />
                          <span>Privacidad y Datos ARCO</span>
                        </Link>

                        <div className="dropdown-divider my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            if (effectiveOwnerUser) {
                              setExpenses((prev) => prev.filter((e) => e.ownerId !== effectiveOwnerUser.id));
                              setBonusGoals((prev) => prev.filter((g) => g.ownerId !== effectiveOwnerUser.id));
                            }
                            setMonthlySalary(MINIMUM_WAGES_2026.comercio.monthly);
                            setSalaryInput(MINIMUM_WAGES_2026.comercio.monthly.toFixed(2));
                            setExtraMonthlyBonus(0);
                            setBonusInput('0.00');
                            setShowProfileMenu(false);
                          }}
                          className="dropdown-item py-1.5 text-secondary d-flex align-items-center gap-2"
                        >
                          <RotateCcw size={13} />
                          <span>Reiniciar datos a cero</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setShowProfileMenu(false);
                            await logout();
                            navigate('/');
                          }}
                          className="dropdown-item py-1.5 text-danger d-flex align-items-center gap-2"
                        >
                          <LogOut size={13} />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1.5 py-1 px-2.5 px-sm-3"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    <LogIn size={13} />
                    <span className="d-none d-sm-inline">Iniciar Sesión</span>
                    <span className="d-inline d-sm-none">Entrar</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Barra de navegación horizontal swipeable para móviles */}
        <div className="mobile-nav-strip d-lg-none">
          <div className="mobile-nav-scroll">
            <button
              type="button"
              onClick={() => {
                setCalcTab('payroll');
                if (!isCalculatorRoute) navigate('/');
              }}
              className={`mobile-nav-pill ${
                isCalculatorRoute && calcTab === 'payroll' ? 'active' : ''
              }`}
            >
              <Scale size={13} />
              <span>Calculadora</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCalcTab('bonuses');
                if (!isCalculatorRoute) navigate('/');
              }}
              className={`mobile-nav-pill ${
                isCalculatorRoute && calcTab === 'bonuses' ? 'active' : ''
              }`}
            >
              <Calendar size={13} />
              <span>Bonos de Ley</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCalcTab('hourly');
                if (!isCalculatorRoute) navigate('/');
              }}
              className={`mobile-nav-pill ${
                isCalculatorRoute && calcTab === 'hourly' ? 'active' : ''
              }`}
            >
              <Clock size={13} />
              <span>Costo Hora</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCalcTab('incapacity');
                if (!isCalculatorRoute) navigate('/');
              }}
              className={`mobile-nav-pill ${
                isCalculatorRoute && calcTab === 'incapacity' ? 'active' : ''
              }`}
            >
              <Activity size={13} />
              <span>Incapacidades</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/mis-gastos')}
              className={`mobile-nav-pill ${isExpensesRoute ? 'active' : ''}`}
            >
              <Wallet size={13} />
              <span>Mis Gastos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Estado de Carga Inicial para evitar mostrar datos provisionales */}
      {(isCalculatorRoute || isExpensesRoute) && isInitialLoading ? (
        <section className="py-5 flex-grow-1 d-flex align-items-center">
          <div className="container-constrained w-100">
            <div
              className="card-soft p-5 text-center my-4 d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: '340px' }}
            >
              <div
                className="spinner-border text-primary mb-3"
                role="status"
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              <h5 className="fw-semibold text-slate-dark mb-1">Cargando tu información...</h5>
              <p className="text-muted small mb-0 font-sans" style={{ maxWidth: '420px' }}>
                Sincronizando salario, aumentos y libreta de gastos con Supabase.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Sección Hero / Calculadora Principal con Jerarquía Limpia */}
          {(isCalculatorRoute || isExpensesRoute) && (
            <section className="py-4">
          <div className="container-constrained">
            {/* Tarjeta Flotante Principal de Entrada y Resultado Líquido */}
            <div className="card-soft p-4 mb-4">
              <div className="row g-4 align-items-stretch">
                {/* Panel Izquierdo: Inputs Limpios y Segmented Control */}
                <div className="col-12 col-lg-7 d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="fw-semibold text-slate-dark mb-1">
                      Calculadora Laboral de El Salvador
                    </h5>
                    <p className="text-slate-muted small mb-3">
                      Cálculo de deducciones de ley (ISSS, AFP, Renta) para salarios quincenales y mensuales
                    </p>

                    <div className="row g-3">
                      {/* Salario Base Input */}
                      <div className="col-12 col-sm-5">
                        <label
                          htmlFor="salary-input"
                          className="form-label text-slate-muted small fw-semibold text-uppercase mb-1 d-flex justify-content-between align-items-center"
                          style={{ fontSize: '11px' }}
                        >
                          <span>Salario Base Mensual</span>
                          {period === 'biweekly' && (
                            <span className="text-secondary fw-normal font-monospace">
                              {formatUSD(activePayroll.grossTotal)} / qna
                            </span>
                          )}
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 text-muted font-monospace fw-semibold">
                            $
                          </span>
                          <input
                            id="salary-input"
                            type="number"
                            min="0"
                            step="10"
                            value={salaryInput}
                            onChange={(e) => handleSalaryTextChange(e.target.value)}
                            className="form-control border-start-0 font-monospace fw-bold fs-4 text-slate-dark"
                            placeholder="408.80"
                          />
                        </div>

                        {user?.loggedIn ? (
                          <div className="mt-1.5 d-flex align-items-center justify-content-between">
                            <button
                              type="button"
                              onClick={() => {
                                setNewSalaryAmount(String(monthlySalary));
                                setShowSalaryHistoryModal(true);
                              }}
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2 d-inline-flex align-items-center gap-1.5"
                              style={{ fontSize: '11px' }}
                              title="Historial de aumentos y salario guardado"
                            >
                              <TrendingUp size={12} className="text-emerald" />
                              <span>Historial / Aumentos</span>
                            </button>
                            <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                              {salaryHistoryList.length > 0
                                ? `${salaryHistoryList.length} registro(s)`
                                : 'Sin guardar'}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-muted" style={{ fontSize: '11px' }}>
                            <Link to="/login" className="text-decoration-none text-muted">
                              Inicia sesión para guardar tu historial salarial
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Bono / Comisión Opcional */}
                      <div className="col-6 col-sm-3">
                        <label
                          htmlFor="bonus-input"
                          className="form-label text-slate-muted small fw-semibold text-uppercase mb-1"
                          style={{ fontSize: '11px' }}
                        >
                          Bono / Comisión
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 text-muted font-monospace">
                            $
                          </span>
                          <input
                            id="bonus-input"
                            type="number"
                            min="0"
                            step="10"
                            value={bonusInput}
                            onChange={(e) => handleBonusTextChange(e.target.value)}
                            className="form-control border-start-0 font-monospace fw-semibold fs-5 text-slate-dark"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Selector de Frecuencia Tipo Segmented Control */}
                      <div className="col-6 col-sm-4">
                        <label
                          className="form-label text-slate-muted small fw-semibold text-uppercase mb-1"
                          style={{ fontSize: '11px' }}
                        >
                          Frecuencia
                        </label>
                        <div className="segmented-control w-100" style={{ height: '42px' }}>
                          <button
                            type="button"
                            onClick={() => setPeriod('monthly')}
                            className={period === 'monthly' ? 'active' : ''}
                          >
                            Mes
                          </button>
                          <button
                            type="button"
                            onClick={() => setPeriod('biweekly')}
                            className={period === 'biweekly' ? 'active' : ''}
                          >
                            Quincena
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Fila de Fecha de Inicio de Labores & Antigüedad y Aguinaldo */}
                    <div className="row g-2.5 mt-0.5">
                      <div className="col-12 col-sm-6">
                        <label
                          htmlFor="hire-date-input"
                          className="form-label text-slate-muted small fw-semibold text-uppercase mb-1 d-block"
                          style={{ fontSize: '11px' }}
                        >
                          Fecha de Inicio de Labores
                        </label>
                        <div className="input-group" style={{ height: '42px' }}>
                          <span className="input-group-text border-end-0 text-muted px-2.5">
                            <Calendar size={15} />
                          </span>
                          <input
                            id="hire-date-input"
                            type="date"
                            value={hireDate}
                            onChange={(e) => handleHireDateChange(e.target.value)}
                            className="form-control border-start-0 font-monospace text-slate-dark fw-semibold"
                            style={{ height: '42px' }}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-sm-6">
                        <label
                          className="form-label text-slate-muted small fw-semibold text-uppercase mb-1 d-flex justify-content-between align-items-center"
                          style={{ fontSize: '11px' }}
                        >
                          <span>Antigüedad y Aguinaldo</span>
                          <span className="text-secondary font-monospace" style={{ fontSize: '10.5px' }}>
                            Arts. 196–202 CT
                          </span>
                        </label>
                        <div
                          className="px-3 rounded border bg-slate-50 d-flex align-items-center justify-content-between overflow-hidden"
                          style={{ height: '42px', maxWidth: '100%' }}
                        >
                          <div
                            className="d-flex align-items-center gap-1.5 small font-monospace text-truncate me-2"
                            style={{ minWidth: 0 }}
                            title={`Antigüedad exacta: ${seniorityDetails.formattedSeniority}`}
                          >
                            <Clock size={13} className="text-secondary shrink-0" />
                            <span className="text-slate-dark fw-semibold text-truncate" style={{ fontSize: '11.5px' }}>
                              {seniorityDetails.formattedSeniority}
                            </span>
                          </div>
                          <div
                            className="d-flex align-items-center gap-1 text-emerald small font-monospace fw-bold shrink-0"
                            style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}
                            title={`Aguinaldo legal: ${seniorityDetails.aguinaldoLabel}`}
                          >
                            <Gift size={13} className="shrink-0" />
                            <span>{seniorityDetails.aguinaldoShortBadge}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enlace sutil para parámetros de ley */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowLawParamsModal(true)}
                      className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-inline-flex align-items-center gap-2"
                      style={{ fontSize: '12px' }}
                    >
                      <SlidersHorizontal size={13} className="text-secondary" />
                      <span>Ver parámetros de ley y salarios mínimos de referencia</span>
                    </button>
                  </div>
                </div>

                {/* Panel Derecho: Tarjeta de Salario Líquido (Rey de la Pantalla) */}
                <div className="col-12 col-lg-5">
                  <div className="card-net-hero p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span className="small fw-semibold text-emerald text-uppercase d-block" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                        Salario Líquido a Recibir ({period === 'monthly' ? 'Mensual' : 'Quincenal'})
                      </span>
                      <div className="fs-1 fw-bold font-monospace text-emerald lh-1 my-2">
                        {formatUSD(activePayroll.netPay)}
                      </div>
                      <div className="small text-slate-muted font-monospace" style={{ fontSize: '12px' }}>
                        <strong>{round2(100 - activePayroll.effectiveDeductionPct)}%</strong> del ingreso bruto
                        <span> · {period === 'monthly' ? `${formatUSD(biweeklyPayroll.netPay)} por quincena` : `${formatUSD(monthlyPayroll.netPay)} por mes`}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-top border-emerald-200 mt-3 d-flex justify-content-between align-items-center small font-monospace">
                      <span className="text-muted" style={{ fontSize: '12px' }}>Total Deducciones:</span>
                      <span className="fw-semibold text-terracotta" style={{ fontSize: '13px' }}>
                        -{formatUSD(activePayroll.totalEmployeeDeductions)} ({activePayroll.effectiveDeductionPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila Inferior de Métricas Secundarias en Tarjetas de Alto Rendimiento */}
              <hr className="my-3 text-slate-200" />
              <div className="row g-2.5 text-start">
                {/* 1. Desglose de Descuentos de Ley */}
                <div className="col-12 col-md-4">
                  <div className="metric-tile">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="metric-tile-title">
                        Lo que te quitan de ley ({period === 'monthly' ? 'Mes' : 'Qna'})
                      </span>
                      <span className="fw-bold text-terracotta font-monospace" style={{ fontSize: '12px' }}>
                        -{formatUSD(activePayroll.totalEmployeeDeductions)}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pt-1.5 border-top gap-1 font-monospace">
                      <div className="text-center flex-fill" title="Pensión obligatoria (7.25% sin tope)">
                        <span className="text-muted d-block font-sans" style={{ fontSize: '10px' }}>Pensión AFP</span>
                        <span className="text-slate-dark fw-semibold" style={{ fontSize: '11px' }}>
                          -{formatUSD(activePayroll.afpEmployee)}
                        </span>
                      </div>
                      <div className="text-center flex-fill border-start border-end px-1" title="Seguro de salud (3% topado a $30/mes)">
                        <span className="text-muted d-block font-sans" style={{ fontSize: '10px' }}>Seguro ISSS</span>
                        <span className="text-slate-dark fw-semibold" style={{ fontSize: '11px' }}>
                          -{formatUSD(activePayroll.isssEmployee)}
                        </span>
                      </div>
                      <div className="text-center flex-fill" title="Impuesto al Estado (según tabla de tramos)">
                        <span className="text-muted d-block font-sans" style={{ fontSize: '10px' }}>Impuesto Renta</span>
                        <span className="text-slate-dark fw-semibold" style={{ fontSize: '11px' }}>
                          {activePayroll.isr > 0 ? `-${formatUSD(activePayroll.isr)}` : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Valor Hora Neta y Bruta */}
                <div className="col-12 col-md-4">
                  <div className="metric-tile">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="metric-tile-title">
                        Cuánto ganas por cada hora
                      </span>
                      <span className="badge-subtle font-sans" style={{ fontSize: '10px' }}>
                        44h semanales
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline justify-content-between pt-1.5 border-top">
                      <div>
                        <span className="fs-6 fw-bold font-monospace text-slate-dark">
                          {formatUSD(hourlyResult.netHourly)}
                        </span>
                        <span className="text-muted font-sans small"> /hora en mano</span>
                      </div>
                      <span className="badge-subtle font-monospace" style={{ fontSize: '10.5px' }}>
                        Bruto: {formatUSD(hourlyResult.grossHourly)}/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Prestaciones Anuales Estimadas */}
                <div className="col-12 col-md-4">
                  <div className="metric-tile">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="metric-tile-title">
                        Bonos extra que te entran al año
                      </span>
                      <span className="badge-subtle font-sans" style={{ fontSize: '10px' }}>
                        Vacación + Aguinaldo + Q25
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline justify-content-between pt-1.5 border-top">
                      <div>
                        <span className="fs-6 fw-bold font-monospace text-emerald">
                          +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                        </span>
                        <span className="text-muted font-sans small"> limpios / año</span>
                      </div>
                      <span className="small text-muted font-monospace" style={{ fontSize: '10.5px' }}>
                        {formatUSD(activePayroll.grossTotal)} total
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal Sobrio de Parámetros de Ley */}
      {showLawParamsModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLawParamsModal(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowLawParamsModal(false);
              }
            }}
          >
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h6 className="modal-title fw-semibold text-slate-dark d-flex align-items-center gap-2 mb-0">
                  <SlidersHorizontal size={16} className="text-secondary" />
                  <span>Parámetros Legales y Salarios Mínimos de Referencia (El Salvador)</span>
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLawParamsModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <span className="fw-semibold text-slate-muted small text-uppercase d-block mb-2" style={{ fontSize: '11px' }}>
                  1. Salarios Mínimos Oficiales Vigentes
                </span>
                <div className="table-responsive mb-4">
                  <table className="table table-minimal table-sm border rounded align-middle small font-monospace">
                    <thead>
                      <tr>
                        <th>Sector Económico</th>
                        <th>Mensual</th>
                        <th>Quincenal</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-sans">Comercio, Servicios e Industria</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.comercio.monthly)}</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.comercio.monthly / 2)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(MINIMUM_WAGES_2026.comercio.monthly)}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-sans">Maquila Textil y Confección</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.maquila.monthly)}</td>
                        <td>{formatUSD(MINIMUM_WAGES_2026.maquila.monthly / 2)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(MINIMUM_WAGES_2026.maquila.monthly)}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
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
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <span className="fw-semibold text-slate-muted small text-uppercase d-block mb-2" style={{ fontSize: '11px' }}>
                  2. Topes Legales y Umbrales de Exención
                </span>
                <div className="table-responsive">
                  <table className="table table-minimal table-sm border rounded align-middle small font-monospace">
                    <thead>
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
                        <td className="font-sans text-muted">Deducción máxima empleado: $30.00/mes ($15.00/qna)</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => applyPresetSalary(1000)}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            Cargar $1,000.00
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
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            Cargar $1,500.00
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
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            Cargar $606.06
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-top py-2.5 px-4">
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

      {/* Modal de Historial de Salarios y Registro de Aumentos */}
      {showSalaryHistoryModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', zIndex: 1055 }}
          tabIndex={-1}
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSalaryHistoryModal(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSalaryHistoryModal(false);
              }
            }}
          >
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h6 className="modal-title fw-semibold text-slate-dark d-flex align-items-center gap-2 mb-0">
                  <TrendingUp size={16} className="text-emerald" />
                  <span>Historial Salarial y Registro de Aumentos</span>
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSalaryHistoryModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="small text-muted mb-4">
                  Registra cada aumento o ajuste salarial con su fecha de vigencia y motivo. La aplicación asociará cada mes a su salario correspondiente para que conserves el historial fiel de tus gastos.
                </p>

                {/* Formulario para registrar aumento */}
                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-semibold text-slate-dark mb-0" style={{ fontSize: '13px' }}>
                      {editingRecordId ? 'Editando Registro Salarial' : 'Registrar Nuevo Aumento o Ajuste'}
                    </h6>
                    {editingRecordId && (
                      <span className="badge bg-warning-subtle text-warning-emphasis fw-medium" style={{ fontSize: '11px' }}>
                        Modo Edición
                      </span>
                    )}
                  </div>
                  <form onSubmit={handleSaveSalaryRecord} className="row g-2 align-items-end small">
                    <div className="col-12 col-sm-4">
                      <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                        Nuevo Salario Bruto ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={newSalaryAmount}
                        onChange={(e) => setNewSalaryAmount(e.target.value)}
                        placeholder="Ej. 850.00"
                        className="form-control form-control-sm font-monospace fw-semibold"
                      />
                    </div>

                    <div className="col-12 col-sm-4">
                      <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                        Fecha de Vigencia
                      </label>
                      <input
                        type="date"
                        required
                        value={newSalaryEffectiveDate}
                        onChange={(e) => setNewSalaryEffectiveDate(e.target.value)}
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-sm-4">
                      <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                        Motivo / Concepto
                      </label>
                      <input
                        type="text"
                        required
                        value={newSalaryReason}
                        onChange={(e) => setNewSalaryReason(e.target.value)}
                        placeholder="Ej. Promoción, Ajuste anual"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 mt-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="isNewJobCheck"
                          checked={isNewJob}
                          onChange={(e) => setIsNewJob(e.target.checked)}
                          className="form-check-input"
                        />
                        <label htmlFor="isNewJobCheck" className="form-check-label fw-semibold text-slate-dark" style={{ fontSize: '12px' }}>
                          ¿Es cambio de empresa / nuevo empleo? (Reinicia fecha de inicio de labores)
                        </label>
                      </div>
                    </div>

                    {isNewJob && (
                      <>
                        <div className="col-12 col-sm-6 mt-1">
                          <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                            Empresa / Empleador
                          </label>
                          <input
                            type="text"
                            value={newJobCompany}
                            onChange={(e) => setNewJobCompany(e.target.value)}
                            placeholder="Ej. Empresa ABC, S.A."
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-12 col-sm-6 mt-1">
                          <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                            Fecha de Inicio en este Trabajo
                          </label>
                          <input
                            type="date"
                            required={isNewJob}
                            value={newJobHireDate}
                            onChange={(e) => setNewJobHireDate(e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-12 mt-3 d-flex justify-content-between align-items-center">
                      <div>
                        {salarySaveFeedback && (
                          <span className="small text-emerald fw-semibold">
                            {salarySaveFeedback}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {editingRecordId && (
                          <button
                            type="button"
                            onClick={handleCancelEditSalaryRecord}
                            className="btn btn-sm btn-outline-secondary px-3 py-1.5 fw-semibold"
                          >
                            Cancelar Edición
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSavingSalary}
                          className="btn btn-sm btn-dark px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
                        >
                          <TrendingUp size={13} />
                          <span>
                            {isSavingSalary
                              ? 'Guardando...'
                              : editingRecordId
                              ? 'Guardar Cambios'
                              : 'Guardar Aumento en Supabase'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Lista de Aumentos Históricos */}
                <h6 className="fw-semibold text-slate-dark mb-2" style={{ fontSize: '13px' }}>
                  Línea de Tiempo Salarial ({salaryHistoryList.length})
                </h6>

                {salaryHistoryList.length === 0 ? (
                  <div className="p-3 text-center text-muted border rounded small bg-white">
                    Aún no tienes registros de aumentos guardados en tu cuenta. Usa el formulario superior para registrar tu primer sueldo.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-minimal table-sm border rounded align-middle small">
                      <thead>
                        <tr>
                          <th>Fecha de Vigencia</th>
                          <th>Salario Bruto</th>
                          <th>Líquido Estimado</th>
                          <th>Motivo / Empresa</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryHistoryList.map((rec) => {
                          const estPayroll = calcPayroll(rec.gross_salary, 'monthly', 0);
                          return (
                            <tr key={rec.id || `${rec.effective_date}-${rec.gross_salary}`}>
                              <td className="font-monospace text-slate-dark fw-semibold">
                                {rec.effective_date}
                              </td>
                              <td className="font-monospace text-slate-dark fw-bold">
                                {formatUSD(rec.gross_salary)}
                              </td>
                              <td className="font-monospace text-emerald">
                                {formatUSD(estPayroll.netPay)}
                              </td>
                              <td>
                                <span className="text-slate-dark d-block">{rec.reason || 'Aumento salarial'}</span>
                                {rec.company_name && (
                                  <span className="badge-subtle font-monospace text-slate-dark mt-0.5 d-inline-block" style={{ fontSize: '10px' }}>
                                    {rec.company_name}
                                  </span>
                                )}
                                {rec.hire_date && (
                                  <span className="text-muted d-block font-monospace" style={{ fontSize: '10px' }}>
                                    Inicio: {rec.hire_date}
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMonthlySalary(rec.gross_salary);
                                      setSalaryInput(rec.gross_salary.toFixed(2));
                                      if (rec.hire_date) {
                                        handleHireDateChange(rec.hire_date);
                                      }
                                      setShowSalaryHistoryModal(false);
                                    }}
                                    className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                                    style={{ fontSize: '11px' }}
                                    title="Cargar salario a la calculadora"
                                  >
                                    Cargar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSalaryRecord(rec)}
                                    className="btn btn-xs btn-outline-primary py-0.5 px-1.5 d-inline-flex align-items-center"
                                    style={{ fontSize: '11px' }}
                                    title="Editar este registro"
                                  >
                                    <Pencil size={12} className="me-1" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('¿Seguro que deseas eliminar este registro del historial salarial?')) {
                                        handleDeleteSalaryRecord(rec.id);
                                      }
                                    }}
                                    className="btn btn-xs btn-outline-danger py-0.5 px-1.5 d-inline-flex align-items-center"
                                    style={{ fontSize: '11px' }}
                                    title="Eliminar este registro"
                                  >
                                    <Trash2 size={12} className="me-1" />
                                    <span>Borrar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-2.5 px-4">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowSalaryHistoryModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal con Router */}
      <main className="container-constrained flex-grow-1">
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
                    hireDate={hireDate}
                    onHireDateChange={handleHireDateChange}
                    seniorityDetails={seniorityDetails}
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
                {calcTab === 'incapacity' && (
                  <IncapacityView
                    monthlySalary={monthlySalary}
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
              <ProtectedRoute isAllowed={canAccessPrivateRoute(user)} redirectTo="/login" />
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
                  onUpdateExpense={handleUpdateExpense}
                  onResetDefaultExpenses={() => {
                    if (!effectiveOwnerUser) return;
                    const samples = DEFAULT_EXPENSES.map((e) => ({
                      ...e,
                      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      ownerId: effectiveOwnerUser.id,
                    }));
                    setExpenses((prev) => [
                      ...prev.filter((e) => e.ownerId !== effectiveOwnerUser.id),
                      ...samples,
                    ]);
                  }}
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
                  currentOwnerId={user?.id || 'usr-sv-01'}
                  defaultQ1NetPay={biweeklyPayroll.quincenaDetails?.q1.netPay || biweeklyPayroll.netPay}
                  defaultQ2NetPay={biweeklyPayroll.quincenaDetails?.q2.netPay || biweeklyPayroll.netPay}
                  monthLedgers={monthLedgers}
                  onSaveMonthLedger={handleSaveMonthLedger}
                  legalBonuses={legalBonuses}
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
    </>
  )}

      {/* Footer Minimalista y Confiable */}
      <footer className="bg-white border-top py-4 mt-auto">
        <div className="container-constrained">
          <div className="p-3 rounded bg-light border border-slate-200 small mb-3 d-flex align-items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-secondary" />
            <div className="text-muted" style={{ fontSize: '12px' }}>
              <strong className="text-slate-dark">Aviso Legal y Exoneración de Responsabilidad:</strong> Los
              cálculos de ISSS, AFP, Renta (ISR), Vacación 30%, Aguinaldo y Quincena 25 son estrictamente
              informativos, ilustrativos y referenciales. No sustituyen la asesoría legal, contable ni las
              liquidaciones oficiales emitidas por el Ministerio de Trabajo y Previsión Social (MTPS), Ministerio de
              Hacienda, ISSS o instituciones administradoras de pensiones. Sujeto a las leyes de la República de El Salvador.
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 small text-muted">
            <div>
              <strong className="text-slate-dark">© 2026 MiNominaSV</strong> · Plataforma independiente de cálculo laboral y presupuestario para El Salvador.
            </div>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/terminos" className="text-decoration-none text-muted">
                Términos y Condiciones
              </Link>
              <Link to="/privacidad" className="text-decoration-none text-muted">
                Privacidad y Derechos ARCO
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón flotante para volver arriba en pantallas móviles */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn btn-dark btn-scroll-top d-lg-none"
          aria-label="Volver arriba"
        >
          <ChevronUp size={14} />
          <span>Arriba</span>
        </button>
      )}
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
