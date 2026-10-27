import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parsear .env manualmente sin dependencias adicionales
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch {
  // ignore
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const usersToSeed = [
    {
      email: 'admin@salariosv.com',
      password: 'AdminSV2026!',
      name: 'Administrador SV',
      role: 'admin',
    },
    {
      email: 'test@salariosv.com',
      password: 'TestSV2026!',
      name: 'Usuario Pruebas',
      role: 'user',
    },
  ];

  for (const u of usersToSeed) {
    console.log(`Procesando usuario: ${u.email}...`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        name: u.name,
        role: u.role,
      },
    });

    let userId = data?.user?.id;

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
        console.log(`  El usuario ${u.email} ya existe en Supabase Auth. Actualizando credenciales...`);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((x) => x.email === u.email);
        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: u.password,
            email_confirm: true,
            user_metadata: { name: u.name, role: u.role },
          });
        }
      } else {
        console.error(`  Error al crear ${u.email}:`, error.message);
      }
    } else {
      console.log(`  Usuario creado con ID: ${userId}`);
    }

    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: u.email,
          name: u.name,
          role: u.role,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn(`  Nota tabla profiles:`, profileError.message);
      } else {
        console.log(`  Perfil sincronizado en public.profiles.`);
      }
    }
  }

  console.log('Completado con éxito.');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
