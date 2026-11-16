import { AlertTriangle, RotateCcw } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../../components/ui/PrimeUI.tsx';

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
    <div className="container-app py-12 flex justify-center items-center flex-1 min-h-[65vh]">
      <PrimeCard padded className="max-w-[440px] w-full text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-danger-soft)] mx-auto mb-3">
          <AlertTriangle size={22} className="text-[var(--color-danger)]" />
        </div>

        <PrimeTag severity="danger" className="mb-2">
          HTTP 500 · Error interno
        </PrimeTag>

        <h5 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          Inconveniente en la aplicación
        </h5>

        <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-5">
          Ocurrió un fallo no previsto durante el procesamiento. Por seguridad no se muestran trazas internas del sistema.
        </p>

        <PrimeButton variant="secondary" size="sm" onClick={handleRetry}>
          <RotateCcw size={14} />
          <span>Reintentar operación</span>
        </PrimeButton>
      </PrimeCard>
    </div>
  );
}
