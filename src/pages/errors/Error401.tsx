import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../../components/ui/PrimeUI.tsx';

export default function Error401() {
  const navigate = useNavigate();

  return (
    <div className="container-app py-12 flex justify-center items-center flex-1 min-h-[65vh]">
      <PrimeCard padded className="max-w-[440px] w-full text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-rule)] mx-auto mb-3">
          <Lock size={22} className="text-[var(--color-muted)]" />
        </div>

        <PrimeTag severity="neutral" className="mb-2">
          HTTP 401 · No autenticado
        </PrimeTag>

        <h5 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          Inicia sesión para ver tus gastos
        </h5>

        <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-5">
          La sección de historial presupuestario y metas de bonos requiere una sesión activa para proteger tus datos financieros.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <PrimeButton variant="secondary" size="sm" onClick={() => navigate('/login')}>
            <LogIn size={14} />
            <span>Iniciar sesión</span>
          </PrimeButton>
          <PrimeButton variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={14} />
            <span>Calculadora pública</span>
          </PrimeButton>
        </div>
      </PrimeCard>
    </div>
  );
}
