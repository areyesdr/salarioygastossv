import { round2 } from './svLaborLaw.ts';

export type LedgerEntryType = 'expense' | 'income';

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

export interface LedgerItem {
  id: string;
  desc: string;
  amount: number;
  type: LedgerEntryType;
  day: number;
  category?: ExpenseCategory;
  isRecurring?: boolean;
  checked?: boolean;
  paid?: boolean;
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
        paid: false,
      })),
  ];

  const newQ2Items = [
    ...targetMonth.q2.items,
    ...q2Recurring
      .filter((i) => !existingQ2Descs.has(i.desc.trim().toLowerCase()))
      .map((i) => ({
        ...i,
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        paid: false,
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

export interface AllMonthsGroupedExpenseItem {
  key: string;
  desc: string;
  totalAmount: number;
  count: number;
  monthsCount: number;
  monthsList: { month: number; name: string; amount: number }[];
  isRecurring: boolean;
}

export interface AllMonthsGroupedSummary {
  groups: AllMonthsGroupedExpenseItem[];
  totalGroupedAmount: number;
  totalGroupedCount: number;
  monthsRepresented: number[];
}

/**
 * Agrupa los gastos marcados con el check a lo largo de TODOS los meses registrados.
 */
export function groupAllMonthsExpenses(
  monthLedgers: MonthLedger[],
  targetYear?: number
): AllMonthsGroupedSummary {
  const map = new Map<string, AllMonthsGroupedExpenseItem>();
  const monthsRepresentedSet = new Set<number>();

  const filteredLedgers = targetYear
    ? monthLedgers.filter((m) => m.year === targetYear)
    : monthLedgers;

  for (const ledger of filteredLedgers) {
    const monthNum = ledger.month;
    const monthName = MONTH_NAMES_ES[monthNum - 1] || `Mes ${monthNum}`;

    const processItems = (items: LedgerItem[]) => {
      for (const item of items) {
        if (item.type !== 'expense') continue;
        if (!item.checked) continue; // Solo los marcados con el check

        const normalized = item.desc.trim().toLowerCase();
        if (!normalized) continue;

        monthsRepresentedSet.add(monthNum);
        const amt = round2(item.amount);
        const existing = map.get(normalized);

        if (existing) {
          existing.totalAmount = round2(existing.totalAmount + amt);
          existing.count += 1;
          if (item.isRecurring) existing.isRecurring = true;

          const existingMonth = existing.monthsList.find((m) => m.month === monthNum);
          if (existingMonth) {
            existingMonth.amount = round2(existingMonth.amount + amt);
          } else {
            existing.monthsList.push({ month: monthNum, name: monthName, amount: amt });
            existing.monthsCount += 1;
          }
        } else {
          map.set(normalized, {
            key: normalized,
            desc: item.desc.trim(),
            totalAmount: amt,
            count: 1,
            monthsCount: 1,
            monthsList: [{ month: monthNum, name: monthName, amount: amt }],
            isRecurring: Boolean(item.isRecurring),
          });
        }
      }
    };

    processItems(ledger.q1.items);
    processItems(ledger.q2.items);
  }

  for (const group of map.values()) {
    group.monthsList.sort((a, b) => a.month - b.month);
  }

  const groups = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  const totalGroupedAmount = round2(groups.reduce((acc, g) => acc + g.totalAmount, 0));
  const totalGroupedCount = groups.reduce((acc, g) => acc + g.count, 0);

  return {
    groups,
    totalGroupedAmount,
    totalGroupedCount,
    monthsRepresented: Array.from(monthsRepresentedSet).sort((a, b) => a - b),
  };
}

/**
 * Infiere automáticamente la categoría de un gasto a partir de palabras clave en su descripción.
 */
export function autoCategorizeExpense(desc: string): ExpenseCategory {
  const text = desc.toLowerCase().trim();

  if (/(alquiler|renta|casa|vivienda|apartamento|cuota\s*vivienda|hipoteca|condominio)/i.test(text)) {
    return 'Vivienda';
  }
  if (/(super|súper|comida|mercado|alimento|despensa|víveres|viveres|almuerzo|cena|desayuno|restaurante|pupusa|pan)/i.test(text)) {
    return 'Alimentación';
  }
  if (/(gasolina|combustible|diesel|diésel|uber|taxi|pasaje|bus|ruta|parqueo|taller|llanta|mecanico|mecánico)/i.test(text)) {
    return 'Transporte';
  }
  if (/(luz|agua|energia|energía|internet|claro|tigo|movistar|digicel|cable|telefono|teléfono|celular|gas|caess|delsur|anda)/i.test(text)) {
    return 'Servicios';
  }
  if (/(tarjeta|prestamo|préstamo|credito|crédito|deuda|cuota\s*banco|banco|interes|interés)/i.test(text)) {
    return 'Deudas';
  }
  if (/(medicina|farmacia|medico|médico|doctor|consulta|clinica|clínica|hospital|laboratorio|lente|dental|diente)/i.test(text)) {
    return 'Salud';
  }
  if (/(colegio|escuela|universidad|matricula|matrícula|mensualidad|libro|útil|util|curso|capacitacion|capacitación)/i.test(text)) {
    return 'Educación';
  }
  if (/(ahorro|fondo|cooperativa|emergencia|inversion|inversión|aportacion|aportación)/i.test(text)) {
    return 'Ahorro';
  }
  if (/(netflix|spotify|cine|salida|paseo|viaje|fiesta|juego|diversion|diversión|ocio)/i.test(text)) {
    return 'Ocio';
  }

  return 'Servicios';
}

/**
 * Agrupa los gastos de un mes por categoría sumando montos y calculando porcentajes.
 */
export function groupMonthExpensesByCategory(
  monthLedger: MonthLedger
): {
  byCategory: Record<ExpenseCategory, number>;
  totalExpenses: number;
} {
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

  let totalExpenses = 0;

  const processItems = (items: LedgerItem[]) => {
    for (const item of items) {
      if (item.type !== 'expense') continue;
      const amt = round2(item.amount);
      if (amt <= 0) continue;

      const cat = item.category || autoCategorizeExpense(item.desc);
      byCategory[cat] = round2(byCategory[cat] + amt);
      totalExpenses = round2(totalExpenses + amt);
    }
  };

  processItems(monthLedger.q1.items);
  processItems(monthLedger.q2.items);

  return {
    byCategory,
    totalExpenses,
  };
}

export interface FixedTemplateItem {
  name: string;
  amount: number;
  category: ExpenseCategory;
  cycle: 'quincena_1' | 'quincena_2' | 'mensual';
  isFixed?: boolean;
}

/**
 * Importa la plantilla de gastos fijos a un mes determinado distribuyéndolos en Q1, Q2 o divididos (mensual).
 */
export function importFixedTemplateToMonth(
  templateItems: FixedTemplateItem[],
  targetMonth: MonthLedger
): MonthLedger {
  const existingQ1Descs = new Set(targetMonth.q1.items.map((i) => i.desc.trim().toLowerCase()));
  const existingQ2Descs = new Set(targetMonth.q2.items.map((i) => i.desc.trim().toLowerCase()));

  const newQ1Items = [...targetMonth.q1.items];
  const newQ2Items = [...targetMonth.q2.items];

  for (const item of templateItems) {
    const norm = item.name.trim().toLowerCase();
    const isMonthlySplit = item.cycle === 'mensual';

    if (item.cycle === 'quincena_1' || isMonthlySplit) {
      if (!existingQ1Descs.has(norm)) {
        newQ1Items.push({
          id: `tpl-q1-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          desc: item.name.trim(),
          amount: isMonthlySplit ? round2(item.amount / 2) : item.amount,
          type: 'expense',
          day: 15,
          category: item.category,
          isRecurring: true,
          checked: false,
          paid: false,
        });
        existingQ1Descs.add(norm);
      }
    }

    if (item.cycle === 'quincena_2' || isMonthlySplit) {
      if (!existingQ2Descs.has(norm)) {
        newQ2Items.push({
          id: `tpl-q2-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          desc: item.name.trim(),
          amount: isMonthlySplit ? round2(item.amount / 2) : item.amount,
          type: 'expense',
          day: 30,
          category: item.category,
          isRecurring: true,
          checked: false,
          paid: false,
        });
        existingQ2Descs.add(norm);
      }
    }
  }

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
