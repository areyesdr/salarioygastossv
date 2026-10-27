import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MonthLedger } from './monthlyLedger.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl.startsWith('http')
);

// Cliente singleton de Supabase
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface DbProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  current_hire_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbSalaryHistory {
  id?: string;
  user_id: string;
  effective_date: string;
  gross_salary: number;
  reason?: string;
  company_name?: string | null;
  hire_date?: string | null;
  notes?: string;
  created_at?: string;
}

export interface DbMonthLedger {
  id?: string;
  user_id: string;
  year: number;
  month: number;
  gross_salary?: number | null;
  q1_items: any[];
  q2_items: any[];
  q1_starting_balance: number | null;
  q2_starting_balance: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Carga las libretas quincenales del usuario autenticado desde Supabase.
 */
export async function fetchMonthLedgersFromSupabase(userId: string): Promise<Record<string, MonthLedger> | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('month_ledgers')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Error al cargar libretas desde Supabase:', error.message);
      return null;
    }

    if (!data || data.length === 0) return {};

    const map: Record<string, MonthLedger> = {};
    for (const row of data) {
      const key = `${row.year}-${row.month}`;
      map[key] = {
        id: row.id || `ledger-${row.user_id}-${row.year}-${row.month}`,
        ownerId: row.user_id,
        year: row.year,
        month: row.month,
        q1: {
          items: Array.isArray(row.q1_items) ? row.q1_items : [],
          customStartingBalance: row.q1_starting_balance !== null ? Number(row.q1_starting_balance) : undefined,
        },
        q2: {
          items: Array.isArray(row.q2_items) ? row.q2_items : [],
          customStartingBalance: row.q2_starting_balance !== null ? Number(row.q2_starting_balance) : undefined,
        },
      };
    }
    return map;
  } catch (err) {
    console.warn('Fallo de red al consultar Supabase:', err);
    return null;
  }
}

/**
 * Guarda o actualiza una libreta mensual en Supabase aplicando RLS por user_id.
 */
export async function upsertMonthLedgerToSupabase(
  userId: string,
  ledger: MonthLedger,
  grossSalary?: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const payload = {
      user_id: userId,
      year: ledger.year,
      month: ledger.month,
      gross_salary: typeof grossSalary === 'number' ? grossSalary : null,
      q1_items: ledger.q1.items || [],
      q2_items: ledger.q2.items || [],
      q1_starting_balance: ledger.q1.customStartingBalance ?? null,
      q2_starting_balance: ledger.q2.customStartingBalance ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('month_ledgers')
      .upsert(payload, { onConflict: 'user_id,year,month' });

    if (error) {
      console.warn('Error al guardar libreta en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Fallo de red al sincronizar con Supabase:', err);
    return false;
  }
}

/**
 * Carga el historial de sueldos y aumentos del usuario.
 */
export async function fetchSalaryHistoryFromSupabase(userId: string): Promise<DbSalaryHistory[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('user_id', userId)
      .order('effective_date', { ascending: false });

    if (error) {
      console.warn('Error al consultar historial salarial:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Fallo de red en historial salarial:', err);
    return [];
  }
}

/**
 * Registra un nuevo aumento o ajuste salarial con su fecha de vigencia.
 */
export async function addSalaryRecordToSupabase(
  userId: string,
  record: Omit<DbSalaryHistory, 'id' | 'user_id' | 'created_at'>
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const { error } = await supabase.from('salary_history').insert({
      user_id: userId,
      effective_date: record.effective_date,
      gross_salary: record.gross_salary,
      reason: record.reason || 'Aumento salarial',
      company_name: record.company_name || null,
      hire_date: record.hire_date || null,
      notes: record.notes || null,
    });

    if (error) {
      console.warn('Error al guardar aumento salarial:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Fallo de red al registrar aumento salarial:', err);
    return false;
  }
}

/**
 * Consulta el perfil del usuario autenticado en Supabase.
 */
export async function fetchUserProfileFromSupabase(userId: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error al consultar perfil en Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Fallo de red al consultar perfil:', err);
    return null;
  }
}

/**
 * Actualiza la fecha de inicio de labores en el perfil de Supabase.
 */
export async function updateProfileHireDateInSupabase(
  userId: string,
  hireDate: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        current_hire_date: hireDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('Error al guardar fecha de inicio en perfil:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Fallo de red al actualizar fecha de inicio:', err);
    return false;
  }
}

/**
 * Modifica un registro salarial existente en Supabase.
 */
export async function updateSalaryRecordInSupabase(
  userId: string,
  recordId: string,
  updates: Partial<Omit<DbSalaryHistory, 'id' | 'user_id' | 'created_at'>>
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !recordId) return false;

  try {
    const { error } = await supabase
      .from('salary_history')
      .update(updates)
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Error al actualizar registro salarial en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Fallo de red al actualizar registro salarial:', err);
    return false;
  }
}

/**
 * Elimina un registro del historial salarial en Supabase.
 */
export async function deleteSalaryRecordFromSupabase(
  userId: string,
  recordId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !recordId) return false;

  try {
    const { error } = await supabase
      .from('salary_history')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Error al eliminar registro salarial en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Fallo de red al eliminar registro salarial:', err);
    return false;
  }
}
