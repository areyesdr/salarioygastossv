import { round2 } from './svLaborLaw.ts';

export type LedgerEntryType = 'expense' | 'income';

export interface LedgerItem {
  id: string;
  desc: string;
  amount: number;
  type: LedgerEntryType;
  day: number;
  isRecurring?: boolean;
  checked?: boolean;
}

export interface QuincenaLedger {
  customStartingBalance?: number;
  items: LedgerItem[];
}

export interface MonthLedger {
  id: string; // e.g. "ledger-2026-01"
  ownerId: string;
  year: number;
  month: number; // 1 to 12
  q1: QuincenaLedger;
  q2: QuincenaLedger;
}

export interface ComputedLedgerItem extends LedgerItem {
  runningBalance: number;
}

export interface ComputedQuincenaLedger {
  startingBalance: number;
  isCustomBalance: boolean;
  computedItems: ComputedLedgerItem[];
  totalExpenses: number;
  totalIncome: number;
  endingBalance: number;
}

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/**
 * Calcula los saldos en cascada (running balance) fila por fila para una quincena.
 */
export function computeQuincenaBalance(
  defaultStartingBalance: number,
  quincena: QuincenaLedger
): ComputedQuincenaLedger {
  const isCustomBalance = typeof quincena.customStartingBalance === 'number';
  const startingBalance = isCustomBalance ? quincena.customStartingBalance! : defaultStartingBalance;

  let current = startingBalance;
  let totalExpenses = 0;
  let totalIncome = 0;

  const computedItems: ComputedLedgerItem[] = [];

  for (const item of quincena.items) {
    const amt = Math.max(0, round2(item.amount));
    if (item.type === 'income') {
      current = round2(current + amt);
      totalIncome = round2(totalIncome + amt);
    } else {
      current = round2(current - amt);
      totalExpenses = round2(totalExpenses + amt);
    }

    computedItems.push({
      ...item,
      amount: amt,
      runningBalance: current,
    });
  }

  return {
    startingBalance: round2(startingBalance),
    isCustomBalance,
    computedItems,
    totalExpenses: round2(totalExpenses),
    totalIncome: round2(totalIncome),
    endingBalance: round2(current),
  };
}

/**
 * Genera un mes vacío con valores por defecto.
 */
export function createEmptyMonthLedger(ownerId: string, year: number, month: number): MonthLedger {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  return {
    id: `ledger-${ownerId}-${monthKey}`,
    ownerId,
    year,
    month,
    q1: {
      items: [],
    },
    q2: {
      items: [],
    },
  };
}

/**
 * Copia los gastos fijos/recurrentes del mes anterior al mes destino.
 */
export function copyRecurringToMonth(
  sourceMonth: MonthLedger,
  targetMonth: MonthLedger
): MonthLedger {
  const q1Recurring = sourceMonth.q1.items.filter((item) => item.isRecurring);
  const q2Recurring = sourceMonth.q2.items.filter((item) => item.isRecurring);

  const existingQ1Descs = new Set(targetMonth.q1.items.map((i) => i.desc.trim().toLowerCase()));
  const existingQ2Descs = new Set(targetMonth.q2.items.map((i) => i.desc.trim().toLowerCase()));

  const newQ1Items = [
    ...targetMonth.q1.items,
    ...q1Recurring
      .filter((i) => !existingQ1Descs.has(i.desc.trim().toLowerCase()))
      .map((i) => ({
        ...i,
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })),
  ];

  const newQ2Items = [
    ...targetMonth.q2.items,
    ...q2Recurring
      .filter((i) => !existingQ2Descs.has(i.desc.trim().toLowerCase()))
      .map((i) => ({
        ...i,
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })),
  ];

  return {
    ...targetMonth,
    q1: {
      ...targetMonth.q1,
      items: newQ1Items,
    },
    q2: {
      ...targetMonth.q2,
      items: newQ2Items,
    },
  };
}

export interface GroupedExpenseItem {
  key: string;
  desc: string;
  totalAmount: number;
  count: number;
  q1Amount: number;
  q2Amount: number;
  isRecurring: boolean;
  itemIds: string[];
}

export interface GroupedExpensesSummary {
  groups: GroupedExpenseItem[];
  totalGroupedAmount: number;
  totalGroupedCount: number;
}

/**
 * Agrupa los gastos de la 1.ª y 2.ª quincena que tengan el mismo texto de descripción.
 * Solo incluye los gastos donde `checked !== false`.
 */
export function groupLedgerExpenses(monthLedger: MonthLedger): GroupedExpensesSummary {
  const map = new Map<string, GroupedExpenseItem>();

  const processItems = (items: LedgerItem[], quincena: 'q1' | 'q2') => {
    for (const item of items) {
      if (item.type !== 'expense') continue;
      if (!item.checked) continue; // Solo se incluyen los que el usuario marque con el check

      const normalized = item.desc.trim().toLowerCase();
      if (!normalized) continue;

      const amt = round2(item.amount);
      const existing = map.get(normalized);

      if (existing) {
        existing.totalAmount = round2(existing.totalAmount + amt);
        existing.count += 1;
        if (quincena === 'q1') existing.q1Amount = round2(existing.q1Amount + amt);
        if (quincena === 'q2') existing.q2Amount = round2(existing.q2Amount + amt);
        if (item.isRecurring) existing.isRecurring = true;
        existing.itemIds.push(item.id);
      } else {
        map.set(normalized, {
          key: normalized,
          desc: item.desc.trim(),
          totalAmount: amt,
          count: 1,
          q1Amount: quincena === 'q1' ? amt : 0,
          q2Amount: quincena === 'q2' ? amt : 0,
          isRecurring: Boolean(item.isRecurring),
          itemIds: [item.id],
        });
      }
    }
  };

  processItems(monthLedger.q1.items, 'q1');
  processItems(monthLedger.q2.items, 'q2');

  const groups = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  const totalGroupedAmount = round2(groups.reduce((acc, g) => acc + g.totalAmount, 0));
  const totalGroupedCount = groups.reduce((acc, g) => acc + g.count, 0);

  return {
    groups,
    totalGroupedAmount,
    totalGroupedCount,
  };
}
