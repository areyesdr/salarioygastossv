import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';

export default function Error401() {
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '65vh' }}>
      <div className="card-soft p-4 p-sm-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center bg-slate-100 text-slate-dark mx-auto mb-3"
          style={{ width: '48px', height: '48px' }}
        >
          <Lock size={22} className="text-secondary" />
        </div>

        <span className="badge bg-light text-secondary border font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
          Estado HTTP 401 · No Autenticado
        </span>

        <h5 className="fw-semibold text-slate-dark mb-2">
          Inicia sesión para ver tus gastos
        </h5>

        <p className="text-muted small mb-4" style={{ fontSize: '13px' }}>
          La sección de historial presupuestario y metas de bonos requiere una sesión activa para proteger la confidencialidad de tus datos.
        </p>

        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3 fw-semibold"
          >
            <LogIn size={14} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-3"
          >
            <ArrowLeft size={14} />
            <span>Calculadora Pública</span>
          </button>
        </div>
      </div>
    </div>
  );
}
