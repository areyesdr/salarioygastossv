import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Wallet, Home } from 'lucide-react';

export default function Error403() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DFDCD2] p-8 text-center shadow-2xs space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B91C1C]/10 text-[#B91C1C] font-semibold">
            Estado HTTP 403 · Acceso Denegado
          </span>
          <h1 className="font-serif-editorial text-2xl font-semibold text-[#141413]">
            Acceso Restringido (403)
          </h1>
          <p className="text-sm text-[#65635E]">
            No tienes los permisos de administrador necesarios para ver esta sección. Tu sesión actual cuenta
            únicamente con acceso a tu propio panel financiero.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/mis-gastos')}
            className="px-4 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Ir a mis gastos</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-[#EFECE6] text-[#141413] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#E2DFD7] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
