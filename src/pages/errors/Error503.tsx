import { useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCw } from 'lucide-react';

export default function Error503() {
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '65vh' }}>
      <div className="card-soft p-4 p-sm-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center bg-slate-100 text-slate-dark mx-auto mb-3"
          style={{ width: '48px', height: '48px' }}
        >
          <ServerCrash size={22} className="text-secondary" />
        </div>

        <span className="badge bg-light text-secondary border font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
          Estado HTTP 502 / 503 · Mantenimiento
        </span>

        <h5 className="fw-semibold text-slate-dark mb-2">
          Mantenimiento de Plataforma
        </h5>

        <p className="text-muted small mb-4" style={{ fontSize: '13px' }}>
          El servicio se encuentra en mantenimiento programado o bajo una ventana de actualización. Por favor reintenta en breve.
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-4 fw-semibold"
        >
          <RefreshCw size={14} />
          <span>Volver a la Calculadora</span>
        </button>
      </div>
    </div>
  );
}
