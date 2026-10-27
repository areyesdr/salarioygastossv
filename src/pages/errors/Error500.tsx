import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Error500Props {
  resetErrorBoundary?: () => void;
}

export default function Error500({ resetErrorBoundary }: Error500Props) {
  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '65vh' }}>
      <div className="card-soft p-4 p-sm-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-slate-dark mx-auto mb-3"
          style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2' }}
        >
          <AlertTriangle size={22} style={{ color: '#991b1b' }} />
        </div>

        <span className="badge bg-light border font-monospace text-uppercase mb-2" style={{ fontSize: '10px', color: '#991b1b' }}>
          Estado HTTP 500 · Error Interno
        </span>

        <h5 className="fw-semibold text-slate-dark mb-2">
          Inconveniente en la Aplicación
        </h5>

        <p className="text-muted small mb-4" style={{ fontSize: '13px' }}>
          Ocurrió un fallo no previsto durante el procesamiento. Por seguridad no se muestran trazas internas del sistema.
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 py-2 px-4 fw-semibold"
        >
          <RotateCcw size={14} />
          <span>Reintentar Operación</span>
        </button>
      </div>
    </div>
  );
}
