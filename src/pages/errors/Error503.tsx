import { useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCw } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../../components/ui/PrimeUI.tsx';

export default function Error503() {
  const navigate = useNavigate();

  return (
    <div className="container-app py-12 flex justify-center items-center flex-1 min-h-[65vh]">
      <PrimeCard padded className="max-w-[440px] w-full text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-rule)] mx-auto mb-3">
          <ServerCrash size={22} className="text-[var(--color-muted)]" />
        </div>

        <PrimeTag severity="neutral" className="mb-2">
          HTTP 502 / 503 · Mantenimiento
        </PrimeTag>

        <h5 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          Mantenimiento de plataforma
        </h5>

        <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-5">
          El servicio se encuentra en mantenimiento programado o bajo una ventana de actualización. Reintenta en breve.
        </p>

        <PrimeButton variant="secondary" size="sm" onClick={() => navigate('/')}>
          <RefreshCw size={14} />
          <span>Volver a la calculadora</span>
        </PrimeButton>
      </PrimeCard>
    </div>
  );
}
