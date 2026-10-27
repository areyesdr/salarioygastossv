import { useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCw } from 'lucide-react';

export default function Error503() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DFDCD2] p-8 text-center shadow-2xs space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#B45309]/10 text-[#B45309] flex items-center justify-center mx-auto">
          <ServerCrash className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B45309]/10 text-[#B45309] font-semibold">
            Estado HTTP 502 / 503 · Servicio No Disponible
          </span>
          <h1 className="font-serif-editorial text-2xl font-semibold text-[#141413]">
            Plataforma en mantenimiento temporal
          </h1>
          <p className="text-sm text-[#65635E]">
            El servicio de sincronización se encuentra en mantenimiento programado o experimenta alta demanda.
            Por favor intenta nuevamente en unos minutos.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Volver a la Calculadora</span>
          </button>
        </div>
      </div>
    </div>
  );
}
