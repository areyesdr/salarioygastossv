import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';

export default function Error401() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DFDCD2] p-8 text-center shadow-2xs space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#B45309]/10 text-[#B45309] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B45309]/10 text-[#B45309] font-semibold">
            Estado HTTP 401 · No Autenticado
          </span>
          <h1 className="font-serif-editorial text-2xl font-semibold text-[#141413]">
            Inicia sesión para ver tus gastos
          </h1>
          <p className="text-sm text-[#65635E]">
            La sección de historial de gastos personales y metas de bonos requiere una sesión activa para
            proteger tu privacidad financiera.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Ir a Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-[#EFECE6] text-[#141413] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#E2DFD7] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Calculadora Pública</span>
          </button>
        </div>
      </div>
    </div>
  );
}
