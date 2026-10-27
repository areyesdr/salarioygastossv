import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Wallet, Home } from 'lucide-react';

export default function Error403() {
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '65vh' }}>
      <div className="card-soft p-4 p-sm-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center bg-danger-subtle text-danger mx-auto mb-3"
          style={{ width: '48px', height: '48px' }}
        >
          <ShieldAlert size={22} className="text-danger" />
        </div>

        <span className="badge bg-danger-subtle text-danger border font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
          Estado HTTP 403 · Acceso Denegado
        </span>

        <h5 className="fw-semibold text-slate-dark mb-2">
          Acceso Restringido (403)
        </h5>

        <p className="text-muted small mb-4" style={{ fontSize: '13px' }}>
          No posees credenciales de administrador para ingresar a esta sección. Tu sesión cuenta únicamente con acceso a tus propios registros financieros.
        </p>

        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
          <button
            type="button"
            onClick={() => navigate('/mis-gastos')}
            className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-semibold"
          >
            <Wallet size={14} />
            <span>Ir a Mis Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3"
          >
            <Home size={14} />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
