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
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-slate-900 text-white font-monospace text-uppercase" style={{ fontSize: '11px' }}>
              Ruta Protegida RBAC · Rol Admin
            </span>
            <span className="small text-muted font-monospace" style={{ fontSize: '11px' }}>
              Sesión: {user?.email}
            </span>
          </div>
          <h4 className="fw-semibold text-slate-dark mb-1">
            Panel Interno de Administración y Parámetros Legales
          </h4>
          <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
            Métricas globales anonimizadas (privacidad financiera garantizada sin exposición de salarios individuales).
          </p>
        </div>

        <Link
          to="/"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 self-start py-1.5 px-3"
          style={{ fontSize: '12px' }}
        >
          <ArrowLeft size={13} />
          <span>Volver al Panel</span>
        </Link>
      </div>

      {/* Métricas Globales */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card-soft p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-slate-muted small fw-semibold text-uppercase" style={{ fontSize: '10px' }}>
                Tablas Tributarias
              </span>
              <CheckCircle2 size={16} className="text-emerald" />
            </div>
            <div className="fs-5 fw-bold font-monospace text-slate-dark mb-1">
              Decreto 254 / Ley 499
            </div>
            <span className="small text-muted" style={{ fontSize: '11px' }}>
              Vigentes 2026 · Quincena 25 obligatoria 2027
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-soft p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-slate-muted small fw-semibold text-uppercase" style={{ fontSize: '10px' }}>
                Aislamiento (ID Matching)
              </span>
              <Lock size={16} className="text-emerald" />
            </div>
            <div className="fs-5 fw-bold font-monospace text-emerald mb-1">
              Activo (100%)
            </div>
            <span className="small text-muted" style={{ fontSize: '11px' }}>
              Los administradores no visualizan registros de usuarios
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-soft p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-slate-muted small fw-semibold text-uppercase" style={{ fontSize: '10px' }}>
                Topes Legales Activos
              </span>
              <Shield size={16} className="text-secondary" />
            </div>
            <div className="fs-5 fw-bold font-monospace text-slate-dark mb-1">
              ISSS ${RATES.ISSS_CAP_MONTHLY} · Q25 ${RATES.QUINCENA_25_CAP}
            </div>
            <span className="small text-muted" style={{ fontSize: '11px' }}>
              Salario mín. comercio: ${MINIMUM_WAGES_2026.comercio.monthly.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Verificación de Contingencias y ErrorBoundary */}
      <div className="card-soft p-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-secondary" />
          <h6 className="fw-semibold text-slate-dark mb-0">
            Verificador de Respuestas HTTP y ErrorBoundary
          </h6>
        </div>
        <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
          Herramienta interna para comprobar las páginas de contingencia ante accesos no autorizados o fallos de ejecución:
        </p>

        <div className="d-flex flex-wrap gap-2 small">
          <Link to="/401" className="btn btn-sm btn-outline-secondary font-monospace" style={{ fontSize: '11px' }}>
            Vista 401 (Unauthorized)
          </Link>
          <Link to="/403" className="btn btn-sm btn-outline-secondary font-monospace" style={{ fontSize: '11px' }}>
            Vista 403 (Forbidden)
          </Link>
          <Link to="/ruta-inexistente-404" className="btn btn-sm btn-outline-secondary font-monospace" style={{ fontSize: '11px' }}>
            Vista 404 (Not Found)
          </Link>
          <Link to="/503" className="btn btn-sm btn-outline-secondary font-monospace" style={{ fontSize: '11px' }}>
            Vista 503 (Mantenimiento)
          </Link>
          <button
            type="button"
            onClick={() => setSimulateCrash(true)}
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 font-monospace"
            style={{ fontSize: '11px' }}
          >
            <Bug size={12} />
            <span>Disparar ErrorBoundary (500)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
