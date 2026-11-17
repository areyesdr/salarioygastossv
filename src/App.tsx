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
  ChevronUp,
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
  type PayrollAdditionsConfig,
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
import { LiquidacionView } from './components/LiquidacionView.tsx';
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
import {
  PrimeButton,
  PrimeInput,
  PrimeCheckbox,
  PrimeSelectButton,
  PrimeCard,
  PrimeTag,
  PrimeMessage,
  PrimeDialog,
  PrimeDivider,
} from './components/ui/PrimeUI.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import TerminosPage from './pages/TerminosPage.tsx';
import PrivacidadPage from './pages/PrivacidadPage.tsx';
import Error401 from './pages/errors/Error401.tsx';
import Error403 from './pages/errors/Error403.tsx';
import Error404 from './pages/errors/Error404.tsx';
import Error500 from './pages/errors/Error500.tsx';
import Error503 from './pages/errors/Error503.tsx';

type CalculatorTab = 'payroll' | 'bonuses' | 'hourly' | 'incapacity' | 'liquidacion';

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
  const { themeMode, setThemeMode, resolvedTheme, toggleTheme } = useTheme();
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
  const [vacationMode, setVacationMode] = useState<'bonus_only' | 'full_advance' | 'worked_vacation'>('bonus_only');
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

  // Prestaciones extraordinarias en la calculadora de salario
  const [includeVacationBonus, setIncludeVacationBonus] = useState<boolean>(false);
  const [includeWorkedVacation, setIncludeWorkedVacation] = useState<boolean>(false);
  const [includeAguinaldo, setIncludeAguinaldo] = useState<boolean>(false);
  const [includeQ25, setIncludeQ25] = useState<boolean>(false);

  const handleToggleVacationBonus = () => {
    setIncludeVacationBonus((prev) => {
      const next = !prev;
      if (next) setIncludeWorkedVacation(false);
      return next;
    });
  };

  const handleToggleWorkedVacation = () => {
    setIncludeWorkedVacation((prev) => {
      const next = !prev;
      if (next) setIncludeVacationBonus(false);
      return next;
    });
  };

  const handleToggleAguinaldo = () => {
    setIncludeAguinaldo((prev) => !prev);
  };

  const handleToggleQ25 = () => {
    setIncludeQ25((prev) => !prev);
  };

  const handleClearAdditions = () => {
    setIncludeVacationBonus(false);
    setIncludeWorkedVacation(false);
    setIncludeAguinaldo(false);
    setIncludeQ25(false);
  };

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
    ordinary_night: 0,
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

  const payrollAdditionsConfig = useMemo<PayrollAdditionsConfig>(() => ({
    includeVacationBonus,
    includeWorkedVacation,
    includeAguinaldo,
    includeQ25,
    customVacation15DaysGross: vacationResult.base15DaysGross,
    customVacationBonus30Gross: vacationResult.bonus30Gross,
    customVacationGross: includeWorkedVacation
      ? vacationResult.completeVacationGross
      : includeVacationBonus
        ? vacationResult.bonus30Gross
        : 0,
    customAguinaldoGross: aguinaldoResult.grossAguinaldo,
    customAguinaldoTaxableExcess: aguinaldoResult.taxableExcess,
    customQ25Gross: quincena25Result.grossQuincena25,
  }), [
    includeVacationBonus,
    includeWorkedVacation,
    includeAguinaldo,
    includeQ25,
    vacationResult,
    aguinaldoResult,
    quincena25Result,
  ]);

  const monthlyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'monthly', extraMonthlyBonus, payrollAdditionsConfig),
    [monthlySalary, extraMonthlyBonus, payrollAdditionsConfig]
  );
  const monthlyBaseOnlyPayroll = useMemo(() => calcPayroll(monthlySalary, 'monthly', 0), [monthlySalary]);
  const biweeklyPayroll = useMemo(
    () => calcPayroll(monthlySalary, 'biweekly', extraMonthlyBonus, payrollAdditionsConfig),
    [monthlySalary, extraMonthlyBonus, payrollAdditionsConfig]
  );
  const activePayroll = period === 'monthly' ? monthlyPayroll : biweeklyPayroll;

  const hourlyResult = useMemo(
    () => calcHourlyAndOvertime(monthlyBaseOnlyPayroll.grossTotal, monthlyBaseOnlyPayroll.netPay, daysPerMonth, hoursPerDay),
    [monthlyBaseOnlyPayroll.grossTotal, monthlyBaseOnlyPayroll.netPay, daysPerMonth, hoursPerDay]
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
    const baseQ1Net =
      monthlyBaseOnlyPayroll.quincenaDetails?.q1.netPay ?? round2(monthlyBaseOnlyPayroll.netPay / 2);
    const baseQ2Net =
      monthlyBaseOnlyPayroll.quincenaDetails?.q2.netPay ?? round2(monthlyBaseOnlyPayroll.netPay - baseQ1Net);
    const remainingMonthly = round2(monthlyBaseOnlyPayroll.netPay - totalMonthlyExpenses);
    const remainingQ1 = round2(baseQ1Net - q1Total);
    const remainingQ2 = round2(baseQ2Net - q2Total);
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
  }, [userOwnedExpenses, monthlyBaseOnlyPayroll, hourlyResult.netHourly]);

  const annualBonusesSummary = useMemo(() => {
    const vacNet =
      vacationSector === 'publico'
        ? 0
        : vacationMode === 'bonus_only'
          ? vacationResult.bonusOnlyMode.netBonusAfterDeductions
          : vacationMode === 'full_advance'
            ? round2(vacationResult.fullAdvanceMode.netTotal - biweeklyPayroll.netPay)
            : vacationResult.workedVacationMode.extraNetOverNormalQuincena;
    const vacGross =
      vacationSector === 'publico'
        ? 0
        : vacationMode === 'worked_vacation'
          ? vacationResult.completeVacationGross
          : vacationResult.bonus30Gross;
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
    vacationWorkedNet: vacationResult.workedVacationMode.netTotal,
    vacationWorkedExtraNet: vacationResult.workedVacationMode.extraNetOverNormalQuincena,
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

  const viewHeaderInfo = useMemo(() => {
    if (isExpensesRoute) {
      return {
        title: 'Mis Gastos & Presupuesto Personal',
        subtitle: 'Control de quincenas, gastos fijos, metas anuales y libreta financiera',
        badge: 'Finanzas Personales',
      };
    }
    switch (calcTab) {
      case 'bonuses':
        return {
          title: 'Bonos y Prestaciones Laborales',
          subtitle: 'Vacación 30%, Aguinaldo de fin de año y Quincena 25 conforme al Código de Trabajo',
          badge: 'Prestaciones de Ley',
        };
      case 'hourly':
        return {
          title: 'Costo por Hora y Horas Extras',
          subtitle: 'Simulación de recargos diurnos, nocturnos, días de asueto y descanso',
          badge: 'Jornada Laboral',
        };
      case 'incapacity':
        return {
          title: 'Subsidio por Incapacidad ISSS',
          subtitle: 'Cobertura legal del 75% del salario según Ley del Seguro Social de El Salvador',
          badge: 'Seguridad Social',
        };
      case 'liquidacion':
        return {
          title: 'Cálculo de Liquidación & Despido',
          subtitle: 'Indemnización por despido injustificado (Art. 58 CT) y renuncia voluntaria',
          badge: 'Terminación Laboral',
        };
      case 'payroll':
      default:
        return {
          title: 'Calculadora Laboral de El Salvador',
          subtitle: 'Deducciones obligatorias de ISSS, AFP y Renta (ISR) para salarios quincenales y mensuales',
          badge: 'Nómina & Retenciones',
        };
    }
  }, [isExpensesRoute, calcTab]);

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* 1. Command Rail Izquierdo para Desktop (72px) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-[72px] shrink-0 sticky top-0 h-screen border-r border-[var(--color-rule)] bg-[var(--color-card)] z-30 py-4 select-none">
        {/* Top: Brand Logo */}
        <div className="flex flex-col items-center gap-5 w-full">
          <Link
            to="/"
            className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm hover:scale-105 transition-transform no-underline"
            title="MiNominaSV - Inicio"
          >
            SV
          </Link>

          {/* Iconos de Navegación Vertical */}
          <nav className="flex flex-col items-center gap-2 w-full px-2" aria-label="Navegación principal">
            {[
              { id: 'payroll' as const, label: 'Calculadora', icon: <Scale size={19} /> },
              { id: 'bonuses' as const, label: 'Bonos de Ley', icon: <Gift size={19} /> },
              { id: 'hourly' as const, label: 'Costo Hora', icon: <Clock size={19} /> },
              { id: 'incapacity' as const, label: 'Incapacidades', icon: <Activity size={19} /> },
              { id: 'liquidacion' as const, label: 'Liquidación', icon: <SlidersHorizontal size={19} /> },
            ].map((item) => {
              const isActive = isCalculatorRoute && calcTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCalcTab(item.id);
                    if (!isCalculatorRoute) navigate('/');
                  }}
                  title={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md ring-2 ring-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}

            <div className="w-7 h-[1px] bg-[var(--color-rule)] my-1" />

            <button
              type="button"
              onClick={() => navigate('/mis-gastos')}
              title="Mis Gastos y Presupuesto"
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isExpensesRoute
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md ring-2 ring-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Wallet size={19} />
            </button>
          </nav>
        </div>

        {/* Bottom: Tema y Perfil de Usuario */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Theme switcher rápido (claro / oscuro) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={18} className="text-amber-400 hover:scale-110 transition-transform" />
            ) : (
              <Moon size={18} className="text-indigo-600 hover:scale-110 transition-transform" />
            )}
          </button>

          {/* User profile / Login */}
          {user?.loggedIn ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title={user.name}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[var(--color-rule)] flex items-center justify-center text-slate-800 dark:text-slate-100 font-mono text-xs font-bold hover:ring-2 hover:ring-emerald-500/40 transition-all cursor-pointer"
              >
                {user.name.slice(0, 2).toUpperCase()}
              </button>

              {showProfileMenu && (
                <div className="absolute left-14 bottom-0 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Sesión activa
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100 block truncate">
                      {user.name}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 block font-mono text-[11px] truncate">
                      {user.email}
                    </span>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
                    >
                      <Shield size={13} />
                      <span>Panel de Administración</span>
                    </Link>
                  )}

                  <Link
                    to="/terminos"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
                  >
                    <Scale size={13} />
                    <span>Términos de Uso</span>
                  </Link>
                  <Link
                    to="/privacidad"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
                  >
                    <Shield size={13} />
                    <span>Privacidad y Datos ARCO</span>
                  </Link>

                  <PrimeDivider className="my-1.5" />

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
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
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
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left cursor-pointer"
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
              title="Iniciar Sesión"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogIn size={18} />
            </Link>
          )}
        </div>
      </aside>

      {/* 2. Área Principal de Trabajo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Móvil (sm/md:hidden) */}
        <header className="md:hidden sticky top-0 z-40 surface-nav">
          <nav className="py-2.5 px-3 sm:px-4">
            <div className="container-app flex items-center justify-between gap-2">
              <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-mono text-xs font-bold">
                  SV
                </div>
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  MiNominaSV
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  role="group"
                  aria-label="Selector de tema visual móvil"
                >
                  <button
                    type="button"
                    title="Tema del sistema"
                    onClick={() => setThemeMode('system')}
                    className={`p-1.5 rounded-md transition-colors ${
                      themeMode === 'system'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    type="button"
                    title="Modo claro"
                    onClick={() => setThemeMode('light')}
                    className={`p-1.5 rounded-md transition-colors ${
                      themeMode === 'light'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun size={13} />
                  </button>
                  <button
                    type="button"
                    title="Modo oscuro"
                    onClick={() => setThemeMode('dark')}
                    className={`p-1.5 rounded-md transition-colors ${
                      themeMode === 'dark'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Moon size={13} />
                  </button>
                </div>

                {user?.loggedIn ? (
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium no-underline"
                  >
                    <LogIn size={13} />
                    <span>Entrar</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>

          {/* Tabs móviles deslizables */}
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'payroll' as const, label: 'Calculadora', icon: <Scale size={13} /> },
                { id: 'bonuses' as const, label: 'Bonos de Ley', icon: <Gift size={13} /> },
                { id: 'hourly' as const, label: 'Costo Hora', icon: <Clock size={13} /> },
                { id: 'incapacity' as const, label: 'Incapacidades', icon: <Activity size={13} /> },
                { id: 'liquidacion' as const, label: 'Liquidación', icon: <SlidersHorizontal size={13} /> },
              ].map((item) => {
                const isActive = isCalculatorRoute && calcTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCalcTab(item.id);
                      if (!isCalculatorRoute) navigate('/');
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => navigate('/mis-gastos')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isExpensesRoute
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Wallet size={13} />
                <span>Mis Gastos</span>
              </button>
            </div>
          </div>
        </header>

        {/* Command Top Header para Pantallas Medianas y Grandes */}
        <header className="hidden md:block surface-nav sticky top-0 z-20 border-b border-[var(--color-rule)] py-3 px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea · El Salvador 2026</span>
                </span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {viewHeaderInfo.badge}
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight m-0">
                {viewHeaderInfo.title}
              </h1>
            </div>

            {/* Quick Controls en el header */}
            <div className="flex items-center gap-3">
              <div className="w-48">
                <PrimeSelectButton<PayPeriod>
                  value={period}
                  onChange={setPeriod}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'biweekly', label: 'Quincenal' },
                  ]}
                />
              </div>

              {/* Selector de Tema Visual Desktop */}
              <div
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                role="group"
                aria-label="Selector de tema visual"
              >
                <button
                  type="button"
                  title="Tema del sistema (detecta preferencia del OS)"
                  onClick={() => setThemeMode('system')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  title="Modo claro"
                  onClick={() => setThemeMode('light')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun size={14} />
                </button>
                <button
                  type="button"
                  title="Modo oscuro"
                  onClick={() => setThemeMode('dark')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon size={14} />
                </button>
              </div>

              <PrimeButton
                variant="outline"
                size="sm"
                onClick={() => setShowLawParamsModal(true)}
                className="text-xs font-medium"
                title="Ver parámetros legales y salarios mínimos"
              >
                <SlidersHorizontal size={13} />
                <span className="hidden xl:inline">Parámetros de Ley</span>
              </PrimeButton>

              {user?.loggedIn && (
                <PrimeButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewSalaryAmount(String(monthlySalary));
                    setShowSalaryHistoryModal(true);
                  }}
                  className="text-xs font-medium"
                  title="Historial de aumentos salariales"
                >
                  <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Historial</span>
                </PrimeButton>
              )}
            </div>
          </div>
        </header>

      {/* Estado de Carga Inicial para evitar mostrar datos provisionales */}
      {(isCalculatorRoute || isExpensesRoute) && isInitialLoading ? (
        <section className="py-12 flex-1 flex items-center">
          <div className="container-app w-full">
            <PrimeCard className="p-8 text-center my-4 flex flex-col items-center justify-center min-h-[340px]">
              <div
                className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-600 animate-spin mb-4"
                role="status"
                aria-label="Cargando"
              />
              <h5 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Cargando tu información...
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md m-0">
                Sincronizando salario, aumentos y libreta de gastos con Supabase.
              </p>
            </PrimeCard>
          </div>
        </section>
      ) : (
        <>
          {/* Fila de 4 Tarjetas Métricas KPI estilo Command Dashboard */}
          {(isCalculatorRoute || isExpensesRoute) && (
            <section className="pt-5 pb-2">
              <div className="container-app">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                  {/* KPI 1: Salario Base Bruto */}
                  <div className="p-4 rounded-2xl surface-card hover-panel flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Salario Bruto Total
                      </span>
                      <PrimeTag severity="info" className="text-[10px]">
                        {period === 'monthly' ? 'Mensual' : 'Quincenal'}
                      </PrimeTag>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 my-1">
                      {formatUSD(activePayroll.grossTotal)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Base: {formatUSD(monthlySalary)}</span>
                      {extraMonthlyBonus > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{formatUSD(extraMonthlyBonus)} bono
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPI 2: Retenciones ISSS + AFP */}
                  <div className="p-4 rounded-2xl surface-card hover-panel flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Retenciones ISSS + AFP
                      </span>
                      <PrimeTag severity="warning" className="text-[10px]">
                        Seguridad Social
                      </PrimeTag>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 my-1">
                      -{formatUSD(activePayroll.isssEmployee + activePayroll.afpEmployee)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span title="ISSS 3% con tope legal de $30/mes">ISSS: -{formatUSD(activePayroll.isssEmployee)}</span>
                      <span title="AFP 7.25% sin tope">AFP: -{formatUSD(activePayroll.afpEmployee)}</span>
                    </div>
                  </div>

                  {/* KPI 3: Retención Renta ISR */}
                  <div className="p-4 rounded-2xl surface-card hover-panel flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Retención Renta (ISR)
                      </span>
                      <PrimeTag severity={activePayroll.isr > 0 ? 'danger' : 'success'} className="text-[10px]">
                        {activePayroll.isr > 0 ? 'Retenido' : 'Exento'}
                      </PrimeTag>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 my-1">
                      {activePayroll.isr > 0 ? `-${formatUSD(activePayroll.isr)}` : '$0.00'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Gravable: {formatUSD(activePayroll.taxableIncome)}</span>
                      <span className="text-[10.5px] text-slate-400">Hacienda SV</span>
                    </div>
                  </div>

                  {/* KPI 4: Monto Líquido en Bolsillo */}
                  <div className="p-4 rounded-2xl hover-panel flex flex-col justify-between bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Monto Líquido en Bolsillo
                      </span>
                      <PrimeTag severity="success" className="font-mono text-[10px]">
                        {round2(100 - activePayroll.effectiveDeductionPct)}% neto
                      </PrimeTag>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 my-1">
                      {formatUSD(activePayroll.netPay)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-900/80 dark:text-emerald-300/80 font-mono pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50">
                      <span>{period === 'monthly' ? `${formatUSD(biweeklyPayroll.netPay)} / qna` : `${formatUSD(monthlyPayroll.netPay)} / mes`}</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        -{activePayroll.effectiveDeductionPct}% ded.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel de Inputs y Parámetros cuando se encuentra en la Calculadora de Nómina */}
                {isCalculatorRoute && calcTab === 'payroll' && (
                  <PrimeCard className="p-5 sm:p-6 mb-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Lado Izquierdo: Configuración Salarial (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0 mb-1">
                            Configuración de Ingresos y Antigüedad
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                            Ajusta tu salario base mensual y verifica el cálculo legal correspondiente al año 2026.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                          {/* Salario Base Input */}
                          <div className="sm:col-span-7">
                            <label
                              htmlFor="salary-input"
                              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex justify-between items-center"
                            >
                              <span>Salario base mensual ($)</span>
                              {period === 'biweekly' && (
                                <span className="text-slate-500 dark:text-slate-400 font-normal font-mono tabular-nums">
                                  {formatUSD(activePayroll.grossTotal)} / qna
                                </span>
                              )}
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-slate-400 font-mono text-sm font-semibold pointer-events-none">
                                $
                              </span>
                              <PrimeInput
                                id="salary-input"
                                type="number"
                                min="0"
                                step="10"
                                mono
                                value={salaryInput}
                                onChange={(e) => handleSalaryTextChange(e.target.value)}
                                className="pl-7 text-xl font-bold h-11"
                                placeholder="408.80"
                              />
                            </div>

                            {/* Atajos Rápidos de Salario Mínimo Oficial */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-slate-400 mr-0.5">Atajos:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setMonthlySalary(MINIMUM_WAGES_2026.comercio.monthly);
                                  setSalaryInput(MINIMUM_WAGES_2026.comercio.monthly.toFixed(2));
                                }}
                                className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Comercio, Servicios e Industria ($408.80)"
                              >
                                Comercio/Industria ($408.80)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMonthlySalary(MINIMUM_WAGES_2026.maquila.monthly);
                                  setSalaryInput(MINIMUM_WAGES_2026.maquila.monthly.toFixed(2));
                                }}
                                className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Maquila Textil ($402.32)"
                              >
                                Maquila ($402.32)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMonthlySalary(MINIMUM_WAGES_2026.beneficios_cafe.monthly);
                                  setSalaryInput(MINIMUM_WAGES_2026.beneficios_cafe.monthly.toFixed(2));
                                }}
                                className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Beneficios de Café y Caña ($305.23)"
                              >
                                Café/Caña ($305.23)
                              </button>
                            </div>
                          </div>

                          {/* Bono / Comisión Opcional */}
                          <div className="sm:col-span-5">
                            <label
                              htmlFor="bonus-input"
                              className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
                            >
                              Bono mensual ($)
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-slate-400 font-mono text-sm pointer-events-none">
                                $
                              </span>
                              <PrimeInput
                                id="bonus-input"
                                type="number"
                                min="0"
                                step="10"
                                mono
                                value={bonusInput}
                                onChange={(e) => handleBonusTextChange(e.target.value)}
                                className="pl-7 text-base font-semibold h-11"
                                placeholder="0.00"
                              />
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Comisiones, horas extra o incentivos gravables
                            </span>
                          </div>
                        </div>

                        {/* Fila de Fecha de Inicio de Labores & Antigüedad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label
                              htmlFor="hire-date-input"
                              className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
                            >
                              Fecha de inicio de labores
                            </label>
                            <div className="relative flex items-center">
                              <Calendar size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                              <PrimeInput
                                id="hire-date-input"
                                type="date"
                                mono
                                value={hireDate}
                                onChange={(e) => handleHireDateChange(e.target.value)}
                                className="pl-9 font-semibold h-10"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex justify-between items-center">
                              <span>Antigüedad y aguinaldo</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10.5px]">
                                Arts. 196–202 CT
                              </span>
                            </div>
                            <div className="px-3 rounded-lg border border-slate-200 dark:border-slate-700 surface-well h-10 flex items-center justify-between overflow-hidden">
                              <div
                                className="flex items-center gap-1.5 text-xs font-mono truncate mr-2 min-w-0"
                                title={`Antigüedad exacta: ${seniorityDetails.formattedSeniority}`}
                              >
                                <Clock size={13} className="text-slate-400 shrink-0" />
                                <span className="text-slate-800 dark:text-slate-200 font-semibold truncate text-[11.5px]">
                                  {seniorityDetails.formattedSeniority}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11.5px] font-mono font-bold shrink-0 whitespace-nowrap"
                                title={`Aguinaldo legal: ${seniorityDetails.aguinaldoLabel}`}
                              >
                                <Gift size={13} className="shrink-0" />
                                <span>{seniorityDetails.aguinaldoShortBadge}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lado Derecho: Prestaciones Extraordinarias a Sumar (5 cols) */}
                      <div className="lg:col-span-5 p-4 rounded-xl surface-well border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <Gift size={14} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                Agregar prestaciones extraordinarias a este pago
                              </span>
                            </div>
                            {(includeVacationBonus || includeWorkedVacation || includeAguinaldo || includeQ25) && (
                              <button
                                type="button"
                                onClick={handleClearAdditions}
                                className="text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* 1. Recargo de Vacación (30%) */}
                            <div
                              onClick={handleToggleVacationBonus}
                              className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors bg-white dark:bg-slate-900 ${
                                includeVacationBonus
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div onClick={(e) => e.stopPropagation()} className="mt-0.5 shrink-0">
                                <PrimeCheckbox
                                  checked={includeVacationBonus}
                                  onChange={handleToggleVacationBonus}
                                  ariaLabel="Recargo Vacación 30%"
                                />
                              </div>
                              <div className="w-full min-w-0">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    Prima Vacacional 30%
                                  </span>
                                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10.5px]">
                                    +{formatUSD(vacationResult.bonus30Gross)}
                                  </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">
                                  Cotiza AFP, ISSS y Renta
                                </span>
                              </div>
                            </div>

                            {/* 2. Vacación Trabajada */}
                            <div
                              onClick={handleToggleWorkedVacation}
                              className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors bg-white dark:bg-slate-900 ${
                                includeWorkedVacation
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div onClick={(e) => e.stopPropagation()} className="mt-0.5 shrink-0">
                                <PrimeCheckbox
                                  checked={includeWorkedVacation}
                                  onChange={handleToggleWorkedVacation}
                                  ariaLabel="Vacación Trabajada"
                                />
                              </div>
                              <div className="w-full min-w-0">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    Vacación Trabajada
                                  </span>
                                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10.5px]">
                                    +{formatUSD(vacationResult.completeVacationGross)}
                                  </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">
                                  15d base + 30% prima
                                </span>
                              </div>
                            </div>

                            {/* 3. Aguinaldo de Fin de Año */}
                            <div
                              onClick={handleToggleAguinaldo}
                              className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors bg-white dark:bg-slate-900 ${
                                includeAguinaldo
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div onClick={(e) => e.stopPropagation()} className="mt-0.5 shrink-0">
                                <PrimeCheckbox
                                  checked={includeAguinaldo}
                                  onChange={handleToggleAguinaldo}
                                  ariaLabel="Pago de Aguinaldo"
                                />
                              </div>
                              <div className="w-full min-w-0">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    Pago de Aguinaldo
                                  </span>
                                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10.5px]">
                                    +{formatUSD(aguinaldoResult.grossAguinaldo)}
                                  </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">
                                  Exento ISSS/AFP (≤ $1,500)
                                </span>
                              </div>
                            </div>

                            {/* 4. Quincena 25 */}
                            <div
                              onClick={handleToggleQ25}
                              className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors bg-white dark:bg-slate-900 ${
                                includeQ25
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div onClick={(e) => e.stopPropagation()} className="mt-0.5 shrink-0">
                                <PrimeCheckbox
                                  checked={includeQ25}
                                  onChange={handleToggleQ25}
                                  ariaLabel="Pago Quincena 25"
                                />
                              </div>
                              <div className="w-full min-w-0">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    Quincena 25 (Q25)
                                  </span>
                                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10.5px]">
                                    +{formatUSD(quincena25Result.grossQuincena25)}
                                  </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">
                                  100% Exento de retenciones
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setShowLawParamsModal(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <SlidersHorizontal size={12} />
                            <span>Ver parámetros de ley y salarios mínimos</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <PrimeDivider className="my-4" />

                    {/* Fila Inferior de Métricas Secundarias */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                      {/* 1. Desglose de Descuentos de Ley */}
                      <div className="p-3 rounded-xl surface-well border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Descuentos de ley ({period === 'monthly' ? 'Mes' : 'Qna'})
                          </span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                            -{formatUSD(activePayroll.totalEmployeeDeductions)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 pt-2 border-t border-slate-200 dark:border-slate-700 gap-1 font-mono tabular-nums">
                          <div className="text-center" title="Pensión obligatoria (7.25% sin tope)">
                            <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10px]">Pensión AFP</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                              -{formatUSD(activePayroll.afpEmployee)}
                            </span>
                          </div>
                          <div className="text-center border-x border-slate-200 dark:border-slate-700 px-1" title="Seguro de salud (3% topado a $30/mes)">
                            <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10px]">Seguro ISSS</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                              -{formatUSD(activePayroll.isssEmployee)}
                            </span>
                          </div>
                          <div className="text-center" title="Impuesto al Estado (según tabla de tramos)">
                            <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10px]">Renta ISR</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                              {activePayroll.isr > 0 ? `-${formatUSD(activePayroll.isr)}` : '$0.00'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Valor Hora Neta y Bruta */}
                      <div className="p-3 rounded-xl surface-well border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Valor por hora
                          </span>
                          <PrimeTag severity="neutral" className="text-[10px]">
                            44h semanales
                          </PrimeTag>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                              {formatUSD(hourlyResult.netHourly)}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs"> /hora neta</span>
                          </div>
                          <PrimeTag severity="neutral" className="font-mono tabular-nums text-[10.5px]">
                            Bruto: {formatUSD(hourlyResult.grossHourly)}/h
                          </PrimeTag>
                        </div>
                      </div>

                      {/* 3. Prestaciones Anuales Estimadas */}
                      <div className="p-3 rounded-xl surface-well border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Bonos anuales estimados
                          </span>
                          <PrimeTag severity="neutral" className="text-[10px]">
                            Vacación + Aguinaldo + Q25
                          </PrimeTag>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                              +{formatUSD(annualBonusesSummary.totalAnnualNetBonuses)}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs"> limpios / año</span>
                          </div>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {formatUSD(activePayroll.grossTotal)} total
                          </span>
                        </div>
                      </div>
                    </div>
                  </PrimeCard>
                )}
              </div>
            </section>
          )}

      {/* Modal Sobrio de Parámetros de Ley */}
      <PrimeDialog
        open={showLawParamsModal}
        onClose={() => setShowLawParamsModal(false)}
        maxWidthClass="max-w-3xl"
        title={
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-500 dark:text-slate-400" />
            <span>Parámetros legales y salarios mínimos de referencia (El Salvador)</span>
          </span>
        }
        footer={
          <PrimeButton variant="secondary" size="sm" onClick={() => setShowLawParamsModal(false)}>
            Cerrar
          </PrimeButton>
        }
      >
        <div className="space-y-5">
          <div>
            <h6 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              1. Salarios mínimos oficiales vigentes
            </h6>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Sector económico</th>
                    <th className="py-2 px-3 font-semibold">Mensual</th>
                    <th className="py-2 px-3 font-semibold">Quincenal</th>
                    <th className="py-2 px-3 font-semibold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono tabular-nums">
                  {[
                    { label: 'Comercio, Servicios e Industria', monthly: MINIMUM_WAGES_2026.comercio.monthly },
                    { label: 'Maquila Textil y Confección', monthly: MINIMUM_WAGES_2026.maquila.monthly },
                    { label: 'Agropecuario (Café / Caña)', monthly: MINIMUM_WAGES_2026.agropecuario.monthly },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">{row.label}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100">{formatUSD(row.monthly)}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{formatUSD(row.monthly / 2)}</td>
                      <td className="py-2 px-3 text-center">
                        <PrimeButton
                          variant="outline"
                          size="xs"
                          onClick={() => applyPresetSalary(row.monthly)}
                        >
                          Cargar
                        </PrimeButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h6 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              2. Topes legales y umbrales de exención
            </h6>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Concepto legal</th>
                    <th className="py-2 px-3 font-semibold">Límite / Techo</th>
                    <th className="py-2 px-3 font-semibold">Efecto de ley</th>
                    <th className="py-2 px-3 font-semibold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono tabular-nums">
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">Techo Cotizable ISSS</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">$1,000.00 / mes</td>
                    <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                      Deducción máxima empleado: $30.00/mes ($15.00/qna)
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PrimeButton variant="outline" size="xs" onClick={() => applyPresetSalary(1000)}>
                        Cargar $1,000.00
                      </PrimeButton>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">
                      Techo Quincena 25 (Decreto 499)
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">$1,500.00 nominal</td>
                    <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                      100% exento de ISSS, AFP y Renta
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PrimeButton variant="outline" size="xs" onClick={() => applyPresetSalary(1500)}>
                        Cargar $1,500.00
                      </PrimeButton>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">
                      Límite Tramo I ISR (Exento)
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">$550.00 imponible</td>
                    <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                      Equivale a aprox. $606.06 nominal
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PrimeButton variant="outline" size="xs" onClick={() => applyPresetSalary(606.06)}>
                        Cargar $606.06
                      </PrimeButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PrimeDialog>

      {/* Modal de Historial de Salarios y Registro de Aumentos */}
      <PrimeDialog
        open={showSalaryHistoryModal}
        onClose={() => setShowSalaryHistoryModal(false)}
        maxWidthClass="max-w-3xl"
        title={
          <span className="inline-flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Historial salarial y registro de aumentos</span>
          </span>
        }
        footer={
          <PrimeButton variant="secondary" size="sm" onClick={() => setShowSalaryHistoryModal(false)}>
            Cerrar
          </PrimeButton>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Registra cada aumento o ajuste salarial con su fecha de vigencia y motivo. La aplicación asociará cada mes a su salario correspondiente para que conserves el historial fiel de tus gastos.
          </p>

          {/* Formulario para registrar aumento */}
          <div className="p-3.5 rounded-xl surface-well border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h6 className="font-semibold text-slate-800 dark:text-slate-100 text-xs m-0">
                {editingRecordId ? 'Editando registro salarial' : 'Registrar nuevo aumento o ajuste'}
              </h6>
              {editingRecordId && (
                <PrimeTag severity="warning">Modo edición</PrimeTag>
              )}
            </div>

            <form onSubmit={handleSaveSalaryRecord} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nuevo salario bruto ($)
                </label>
                <PrimeInput
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  mono
                  inputSize="sm"
                  value={newSalaryAmount}
                  onChange={(e) => setNewSalaryAmount(e.target.value)}
                  placeholder="Ej. 850.00"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha de vigencia
                </label>
                <PrimeInput
                  type="date"
                  required
                  inputSize="sm"
                  value={newSalaryEffectiveDate}
                  onChange={(e) => setNewSalaryEffectiveDate(e.target.value)}
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo / Concepto
                </label>
                <PrimeInput
                  type="text"
                  required
                  inputSize="sm"
                  value={newSalaryReason}
                  onChange={(e) => setNewSalaryReason(e.target.value)}
                  placeholder="Ej. Promoción, Ajuste anual"
                />
              </div>

              <div className="sm:col-span-12 pt-1">
                <div className="flex items-center gap-2">
                  <PrimeCheckbox
                    id="isNewJobCheck"
                    checked={isNewJob}
                    onChange={setIsNewJob}
                  />
                  <label htmlFor="isNewJobCheck" className="font-semibold text-slate-700 dark:text-slate-200 text-xs cursor-pointer">
                    ¿Es cambio de empresa / nuevo empleo? (Reinicia fecha de inicio de labores)
                  </label>
                </div>
              </div>

              {isNewJob && (
                <>
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Empresa / Empleador
                    </label>
                    <PrimeInput
                      type="text"
                      inputSize="sm"
                      value={newJobCompany}
                      onChange={(e) => setNewJobCompany(e.target.value)}
                      placeholder="Ej. Empresa ABC, S.A."
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Fecha de inicio en este trabajo
                    </label>
                    <PrimeInput
                      type="date"
                      required={isNewJob}
                      inputSize="sm"
                      value={newJobHireDate}
                      onChange={(e) => setNewJobHireDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-12 pt-2 flex flex-wrap justify-between items-center gap-2">
                <div>
                  {salarySaveFeedback && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      {salarySaveFeedback}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingRecordId && (
                    <PrimeButton
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditSalaryRecord}
                    >
                      Cancelar edición
                    </PrimeButton>
                  )}
                  <PrimeButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingSalary}
                  >
                    <TrendingUp size={13} />
                    <span>
                      {isSavingSalary
                        ? 'Guardando...'
                        : editingRecordId
                        ? 'Guardar cambios'
                        : 'Guardar aumento en Supabase'}
                    </span>
                  </PrimeButton>
                </div>
              </div>
            </form>
          </div>

          {/* Lista de Aumentos Históricos */}
          <div>
            <h6 className="font-semibold text-slate-800 dark:text-slate-100 text-xs mb-2">
              Línea de tiempo salarial ({salaryHistoryList.length})
            </h6>

            {salaryHistoryList.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900">
                Aún no tienes registros de aumentos guardados en tu cuenta. Usa el formulario superior para registrar tu primer sueldo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Vigencia</th>
                      <th className="py-2 px-3 font-semibold">Bruto</th>
                      <th className="py-2 px-3 font-semibold">Líquido est.</th>
                      <th className="py-2 px-3 font-semibold">Motivo / Empresa</th>
                      <th className="py-2 px-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {salaryHistoryList.map((rec) => {
                      const estPayroll = calcPayroll(rec.gross_salary, 'monthly', 0);
                      return (
                        <tr
                          key={rec.id || `${rec.effective_date}-${rec.gross_salary}`}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                            {rec.effective_date}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold">
                            {formatUSD(rec.gross_salary)}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                            {formatUSD(estPayroll.netPay)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-800 dark:text-slate-200 block">
                              {rec.reason || 'Aumento salarial'}
                            </span>
                            {rec.company_name && (
                              <PrimeTag severity="neutral" className="mt-0.5 text-[10px]">
                                {rec.company_name}
                              </PrimeTag>
                            )}
                            {rec.hire_date && (
                              <span className="text-slate-500 dark:text-slate-400 block font-mono text-[10px] mt-0.5">
                                Inicio: {rec.hire_date}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <PrimeButton
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setMonthlySalary(rec.gross_salary);
                                  setSalaryInput(rec.gross_salary.toFixed(2));
                                  if (rec.hire_date) {
                                    handleHireDateChange(rec.hire_date);
                                  }
                                  setShowSalaryHistoryModal(false);
                                }}
                                title="Cargar salario a la calculadora"
                              >
                                Cargar
                              </PrimeButton>
                              <PrimeButton
                                variant="ghost"
                                size="xs"
                                onClick={() => handleStartEditSalaryRecord(rec)}
                                title="Editar este registro"
                              >
                                <Pencil size={12} />
                                <span>Editar</span>
                              </PrimeButton>
                              <PrimeButton
                                variant="danger"
                                size="xs"
                                onClick={() => {
                                  if (window.confirm('¿Seguro que deseas eliminar este registro del historial salarial?')) {
                                    handleDeleteSalaryRecord(rec.id);
                                  }
                                }}
                                title="Eliminar este registro"
                              >
                                <Trash2 size={12} />
                                <span>Borrar</span>
                              </PrimeButton>
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
        </div>
      </PrimeDialog>

      {/* Contenido Principal con Router */}
      <main className="container-app flex-1 pb-8">
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
                {calcTab === 'liquidacion' && (
                  <LiquidacionView
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
                  monthlyNetPay={monthlyBaseOnlyPayroll.netPay}
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
                  defaultQ1NetPay={
                    monthlyBaseOnlyPayroll.quincenaDetails?.q1.netPay ??
                    round2(monthlyBaseOnlyPayroll.netPay / 2)
                  }
                  defaultQ2NetPay={
                    monthlyBaseOnlyPayroll.quincenaDetails?.q2.netPay ??
                    round2(
                      monthlyBaseOnlyPayroll.netPay -
                        (monthlyBaseOnlyPayroll.quincenaDetails?.q1.netPay ??
                          round2(monthlyBaseOnlyPayroll.netPay / 2))
                    )
                  }
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
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="container-app space-y-4">
          <PrimeMessage severity="info" icon={<AlertTriangle size={16} className="shrink-0 mt-0.5" />}>
            <span className="text-xs leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-100">Aviso Legal y Exoneración de Responsabilidad:</strong>{' '}
              Los cálculos de ISSS, AFP, Renta (ISR), Vacación 30%, Aguinaldo y Quincena 25 son estrictamente
              informativos, ilustrativos y referenciales. No sustituyen la asesoría legal, contable ni las
              liquidaciones oficiales emitidas por el Ministerio de Trabajo y Previsión Social (MTPS), Ministerio de
              Hacienda, ISSS o instituciones administradoras de pensiones. Sujeto a las leyes de la República de El Salvador.
            </span>
          </PrimeMessage>

          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <strong className="text-slate-800 dark:text-slate-200">© 2026 MiNominaSV</strong> · Plataforma independiente de cálculo laboral y presupuestario para El Salvador.
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/terminos" className="no-underline text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                Términos y Condiciones
              </Link>
              <Link to="/privacidad" className="no-underline text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                Privacidad y Derechos ARCO
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>

      {/* Botón flotante para volver arriba en pantallas móviles */}
      {showScrollTop && (
        <div className="fixed bottom-4 right-4 z-30 lg:hidden">
          <PrimeButton
            variant="primary"
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Volver arriba"
            className="shadow-lg rounded-full px-3"
          >
            <ChevronUp size={14} />
            <span>Arriba</span>
          </PrimeButton>
        </div>
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
