import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../../components/ui/PrimeUI.tsx';

export default function Error404() {
  const navigate = useNavigate();

  return (
    <div className="container-app py-12 flex justify-center items-center flex-1 min-h-[65vh]">
      <PrimeCard padded className="max-w-[440px] w-full text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-rule)] mx-auto mb-3">
          <FileQuestion size={22} className="text-[var(--color-muted)]" />
        </div>

        <PrimeTag severity="neutral" className="mb-2">
          HTTP 404 · No encontrado
        </PrimeTag>

        <h5 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          Página no encontrada (404)
        </h5>

        <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-5">
          La ruta que intentas consultar no existe o la dirección web fue ingresada con algún error de escritura.
        </p>

        <PrimeButton variant="secondary" size="sm" onClick={() => navigate('/')}>
          <Home size={14} />
          <span>Volver al inicio</span>
        </PrimeButton>
      </PrimeCard>
    </div>
  );
}
