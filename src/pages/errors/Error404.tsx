import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function Error404() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DFDCD2] p-8 text-center shadow-2xs space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFECE6] text-[#4A4945] font-semibold">
            Estado HTTP 404 · No Encontrado
          </span>
          <h1 className="font-serif-editorial text-2xl font-semibold text-[#141413]">
            Esta página no existe (404)
          </h1>
          <p className="text-sm text-[#65635E]">
            La página de cálculos o sección que buscas no existe en nuestra aplicación o la dirección fue
            escrita de forma incorrecta.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
