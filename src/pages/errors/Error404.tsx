import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function Error404() {
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '65vh' }}>
      <div className="card-soft p-4 p-sm-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-slate-dark mx-auto mb-3"
          style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9' }}
        >
          <FileQuestion size={22} className="text-secondary" />
        </div>

        <span className="badge bg-light text-secondary border font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
          Estado HTTP 404 · No Encontrado
        </span>

        <h5 className="fw-semibold text-slate-dark mb-2">
          Página No Encontrada (404)
        </h5>

        <p className="text-muted small mb-4" style={{ fontSize: '13px' }}>
          La ruta que intentas consultar no existe o la dirección web fue ingresada con algún error de escritura.
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-4 fw-semibold"
        >
          <Home size={14} />
          <span>Volver al Inicio</span>
        </button>
      </div>
    </div>
  );
}
