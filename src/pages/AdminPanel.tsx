import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, AlertTriangle, ArrowLeft, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RATES, MINIMUM_WAGES_2026 } from '../lib/svLaborLaw.ts';

export default function AdminPanel() {
  const { user } = useAuth();
  const [simulateCrash, setSimulateCrash] = useState(false);

  if (simulateCrash) {
    throw new Error('Simulación controlada de fallo interno 500 para verificar ErrorBoundary');
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-tabular uppercase px-2.5 py-0.5 rounded-full bg-[#0F4C3A] text-white font-semibold">
              Ruta Protegida RBAC · Rol Admin
            </span>
            <span className="text-xs font-mono-tabular text-[#65635E]">Sesión: {user?.email}</span>
          </div>
          <h1 className="font-serif-editorial text-2xl font-semibold mt-1 text-[#141413]">
            Panel Interno de Administración y Parámetros Legales
          </h1>
          <p className="text-xs text-[#65635E]">
            Métricas globales anonimizadas del sistema (cumpliendo privacidad financiera sin exponer salarios
            ni gastos individuales).
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-white border border-[#DFDCD2] text-[#141413] hover:border-[#0F4C3A]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel Principal</span>
        </Link>
      </div>

      {/* Global Anonymized Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#DFDCD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#65635E]">
            <span>Estado de Tablas Tributarias</span>
            <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
          </div>
          <div className="text-xl font-mono-tabular font-bold mt-2 text-[#141413]">
            Decreto 254 / Ley Q25 499
          </div>
          <span className="text-xs text-[#0F4C3A] block mt-1">
            Vigentes 2026 · Quincena 25 obligatoria 2027
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#DFDCD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#65635E]">
            <span>Aislamiento de Datos (ID Matching)</span>
            <Lock className="w-4 h-4 text-[#0F4C3A]" />
          </div>
          <div className="text-xl font-mono-tabular font-bold mt-2 text-[#0F4C3A]">Activo (100%)</div>
          <span className="text-xs text-[#65635E] block mt-1">
            Los administradores no visualizan montos privados de usuarios
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#DFDCD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#65635E]">
            <span>Topes Legales Activos</span>
            <Shield className="w-4 h-4 text-[#0F4C3A]" />
          </div>
          <div className="text-xl font-mono-tabular font-bold mt-2 text-[#141413]">
            ISSS ${RATES.ISSS_CAP_MONTHLY} · Q25 ${RATES.QUINCENA_25_CAP}
          </div>
          <span className="text-xs text-[#65635E] block mt-1">
            Salario mín. comercio: ${MINIMUM_WAGES_2026.comercio.monthly.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Security & Error Catalog Verification Console */}
      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#B45309]" />
          <h2 className="font-serif-editorial text-lg font-semibold">
            Verificador de Estados HTTP y Límite de Errores (Error Boundary)
          </h2>
        </div>
        <p className="text-xs text-[#65635E]">
          Prueba desde aquí las vistas de contingencia configuradas para garantizar que ningún error exponga
          código fuente ni consultas internas:
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1 text-xs">
          <Link
            to="/401"
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DFDCD2] font-mono-tabular hover:border-[#0F4C3A]"
          >
            Ver Vista 401 (Unauthorized)
          </Link>
          <Link
            to="/403"
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DFDCD2] font-mono-tabular hover:border-[#0F4C3A]"
          >
            Ver Vista 403 (Forbidden)
          </Link>
          <Link
            to="/ruta-inexistente-404"
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DFDCD2] font-mono-tabular hover:border-[#0F4C3A]"
          >
            Ver Vista 404 (Not Found)
          </Link>
          <Link
            to="/503"
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DFDCD2] font-mono-tabular hover:border-[#0F4C3A]"
          >
            Ver Vista 502/503 (Mantenimiento)
          </Link>
          <button
            type="button"
            onClick={() => setSimulateCrash(true)}
            className="px-3.5 py-2 rounded-xl bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/30 font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Disparar ErrorBoundary (500)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
