import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, AlertTriangle, ArrowLeft, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RATES, MINIMUM_WAGES_2026 } from '../lib/svLaborLaw.ts';
import { formatUSD } from '../lib/formatters.ts';
import { PrimeButton, PrimeCard, PrimeTag } from '../components/ui/PrimeUI.tsx';

export default function AdminPanel() {
  const { user } = useAuth();
  const [simulateCrash, setSimulateCrash] = useState(false);

  if (simulateCrash) {
    throw new Error('Simulación controlada de fallo interno 500 para verificar ErrorBoundary');
  }

  return (
    <div className="container-app py-8 max-w-[1000px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <PrimeTag severity="info">Ruta protegida RBAC · Rol Admin</PrimeTag>
            <span className="text-xs text-[var(--color-muted)] font-mono">
              Sesión: {user?.email}
            </span>
          </div>
          <h4 className="text-xl font-semibold text-[var(--color-ink)] mb-1">
            Panel interno de administración y parámetros legales
          </h4>
          <p className="text-[var(--color-muted)] text-xs m-0">
            Métricas globales anonimizadas con aislamiento de datos por usuario.
          </p>
        </div>

        <Link to="/" className="no-underline self-start">
          <PrimeButton variant="outline" size="sm">
            <ArrowLeft size={13} />
            <span>Volver al panel</span>
          </PrimeButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PrimeCard padded>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">Tablas tributarias</span>
            <CheckCircle2 size={16} className="text-[var(--color-emerald)]" />
          </div>
          <div className="text-base font-bold font-mono text-[var(--color-ink)] mb-1">
            Decreto 254 / Ley 499
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            Vigentes 2026 · Quincena 25 obligatoria 2027
          </span>
        </PrimeCard>

        <PrimeCard padded>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">Aislamiento (ID Matching)</span>
            <Lock size={16} className="text-[var(--color-emerald)]" />
          </div>
          <div className="text-base font-bold font-mono text-[var(--color-emerald)] mb-1">
            Activo (100%)
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            Los administradores no visualizan registros de usuarios
          </span>
        </PrimeCard>

        <PrimeCard padded>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">Topes legales activos</span>
            <Shield size={16} className="text-[var(--color-muted)]" />
          </div>
          <div className="text-base font-bold font-mono text-[var(--color-ink)] mb-1">
            ISSS {formatUSD(RATES.ISSS_CAP_MONTHLY)} · Q25 {formatUSD(RATES.QUINCENA_25_CAP)}
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            Salario mín. comercio: {formatUSD(MINIMUM_WAGES_2026.comercio.monthly)}
          </span>
        </PrimeCard>
      </div>

      <PrimeCard padded>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-[var(--color-amber)]" />
          <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
            Verificador de respuestas HTTP y ErrorBoundary
          </h6>
        </div>
        <p className="text-[var(--color-muted)] text-xs mb-4">
          Herramienta interna para comprobar las páginas de contingencia ante accesos no autorizados o fallos de ejecución:
        </p>

        <div className="flex flex-wrap gap-2">
          <Link to="/401" className="no-underline">
            <PrimeButton variant="outline" size="xs" className="font-mono">
              Vista 401 (Unauthorized)
            </PrimeButton>
          </Link>
          <Link to="/403" className="no-underline">
            <PrimeButton variant="outline" size="xs" className="font-mono">
              Vista 403 (Forbidden)
            </PrimeButton>
          </Link>
          <Link to="/ruta-inexistente-404" className="no-underline">
            <PrimeButton variant="outline" size="xs" className="font-mono">
              Vista 404 (Not Found)
            </PrimeButton>
          </Link>
          <Link to="/503" className="no-underline">
            <PrimeButton variant="outline" size="xs" className="font-mono">
              Vista 503 (Mantenimiento)
            </PrimeButton>
          </Link>
          <PrimeButton
            variant="outline"
            size="xs"
            className="font-mono text-[var(--color-danger)] border-[var(--color-danger)]/40"
            onClick={() => setSimulateCrash(true)}
          >
            <Bug size={12} />
            <span>Disparar ErrorBoundary (500)</span>
          </PrimeButton>
        </div>
      </PrimeCard>
    </div>
  );
}
