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
          className="rounded-circle d-flex align-items-center justify-content-center bg-danger-subtle text-danger mx-auto mb-3"
          style={{ width: '48px', height: '48px' }}
        >
          <AlertTriangle size={22} className="text-danger" />
        </div>

        <span className="badge bg-danger-subtle text-danger border font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
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
          className="btn btn-dark btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2 px-4 fw-semibold"
        >
          <RotateCcw size={14} />
          <span>Reintentar Operación</span>
        </button>
      </div>
    </div>
  );
}
