import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Wallet, Home } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../../components/ui/PrimeUI.tsx';

export default function Error403() {
  const navigate = useNavigate();

  return (
    <div className="container-app py-12 flex justify-center items-center flex-1 min-h-[65vh]">
      <PrimeCard padded className="max-w-[440px] w-full text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-danger-soft)] mx-auto mb-3">
          <ShieldAlert size={22} className="text-[var(--color-danger)]" />
        </div>

        <PrimeTag severity="danger" className="mb-2">
          HTTP 403 · Acceso denegado
        </PrimeTag>

        <h5 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          Acceso restringido (403)
        </h5>

        <p className="text-[var(--color-muted)] text-xs leading-relaxed mb-5">
          No cuentas con permisos de administrador para ingresar a esta sección. Tu sesión tiene acceso únicamente a tus propios registros.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <PrimeButton variant="secondary" size="sm" onClick={() => navigate('/mis-gastos')}>
            <Wallet size={14} />
            <span>Ir a Mis gastos</span>
          </PrimeButton>
          <PrimeButton variant="outline" size="sm" onClick={() => navigate('/')}>
            <Home size={14} />
            <span>Volver al inicio</span>
          </PrimeButton>
        </div>
      </PrimeCard>
    </div>
  );
}
