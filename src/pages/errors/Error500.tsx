import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Error500Props {
  resetErrorBoundary?: () => void;
}

/**
 * Vista limpia de Error 500 (Internal Server / Application Error).
 * Por seguridad, oculta cualquier traza de código, pila de ejecución o consulta interna.
 */
export default function Error500({ resetErrorBoundary }: Error500Props) {
  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[#F6F5F0]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DFDCD2] p-8 text-center shadow-2xs space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B91C1C]/10 text-[#B91C1C] font-semibold">
            Estado HTTP 500 · Error Interno
          </span>
          <h1 className="font-serif-editorial text-2xl font-semibold text-[#141413]">
            Algo salió mal de nuestro lado
          </h1>
          <p className="text-sm text-[#65635E]">
            Hubo un inconveniente inesperado al procesar la solicitud. Por razones de seguridad no se exponen
            detalles técnicos del sistema. Estamos trabajando en ello.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reintentar de forma segura</span>
          </button>
        </div>
      </div>
    </div>
  );
}
