import { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function App() {
  const [monthlySalary, setMonthlySalary] = useState<number>(1000);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#141413]">
      <header className="border-b border-[#E2DFD7] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C3A] text-white flex items-center justify-center font-mono-tabular font-semibold text-sm">
              SV
            </div>
            <div>
              <h1 className="font-serif-editorial text-xl font-semibold tracking-tight">
                Salario y Gastos SV
              </h1>
              <p className="text-xs text-[#65635E]">
                Calculadora de descuentos de ley, bonos y control de gastos
              </p>
            </div>
          </div>
          <Calculator className="w-5 h-5 text-[#0F4C3A]" />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-2xl border border-[#DFDCD2] max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#65635E]">
            Salario Mensual (USD)
          </label>
          <input
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value) || 0)}
            className="mt-2 w-full text-2xl font-mono-tabular font-semibold border border-[#DFDCD2] rounded-xl px-3 py-2"
          />
        </div>
      </main>
    </div>
  );
}
