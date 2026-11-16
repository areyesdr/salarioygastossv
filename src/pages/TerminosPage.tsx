import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, Shield, FileText, Building, ArrowLeft } from 'lucide-react';
import { PrimeButton, PrimeCard, PrimeTag } from '../components/ui/PrimeUI.tsx';

export default function TerminosPage() {
  return (
    <div className="container-app py-8 max-w-[840px]">
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="no-underline">
          <PrimeButton variant="ghost" size="xs">
            <ArrowLeft size={13} />
            <span>Volver a la calculadora</span>
          </PrimeButton>
        </Link>
        <span className="text-xs text-[var(--color-muted)] font-mono">
          Última actualización: Octubre 2026
        </span>
      </div>

      <PrimeCard padded className="space-y-5">
        <div className="border-b border-[var(--color-rule)] pb-4">
          <PrimeTag severity="neutral" className="mb-2">
            Marco legal · República de El Salvador
          </PrimeTag>
          <h4 className="text-xl font-semibold text-[var(--color-ink)] mb-1">
            Términos y Condiciones de Uso (TyC)
          </h4>
          <p className="text-[var(--color-muted)] text-xs m-0">
            Condiciones legales que regulan el acceso y uso de la plataforma MiNominaSV.
          </p>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={16} className="text-[var(--color-muted)]" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              1. Exoneración de Responsabilidad (Disclaimer Financiero y Laboral)
            </h6>
          </div>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed m-0">
            Todos los cálculos de deducciones de ley (ISSS, AFP, Renta), prestaciones laborales (Vacación 30%, Aguinaldo, Quincena 25), costos por hora y proyecciones presupuestarias generados por{' '}
            <strong className="text-[var(--color-ink)]">MiNominaSV</strong> son de carácter estrictamente{' '}
            <strong className="text-[var(--color-ink-2)]">informativo, ilustrativo y referencial</strong>. Esta herramienta no constituye ni sustituye la asesoría legal, contable, tributaria ni el dictamen oficial de un especialista en Derecho Laboral o Recursos Humanos.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <Scale size={16} className="text-[var(--color-muted)]" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              2. Margen de Error y Discrepancias en Planilla
            </h6>
          </div>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed m-0">
            Debido a políticas internas de redondeo de cada empresa, reformas tributarias, tramos variables o recálculo semestral del Impuesto sobre la Renta (junio y diciembre), el titular de la plataforma no se hace responsable por diferencias entre los montos estimados en esta aplicación y las liquidaciones oficiales emitidas por el Ministerio de Trabajo y Previsión Social (MTPS), Ministerio de Hacienda, ISSS o AFP.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <FileText size={16} className="text-[var(--color-muted)]" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              3. Propiedad Intelectual
            </h6>
          </div>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed m-0">
            El diseño visual, interfaz de usuario, estructura de código y algoritmos de cálculo tributario de{' '}
            <strong className="text-[var(--color-ink)]">MiNominaSV</strong> se encuentran protegidos por la legislación aplicable. Queda prohibida su reproducción no autorizada o explotación comercial sin el consentimiento expreso del titular.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <Shield size={16} className="text-[var(--color-muted)]" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              4. Reglas de Registro y Custodia de Credenciales
            </h6>
          </div>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed m-0">
            El usuario registrado es responsable de la confidencialidad de su cuenta y de la exactitud de los datos personales ingresados en su sesión. Se prohíbe cualquier intento de vulnerar los controles de acceso o consultar información de terceros.
          </p>
        </section>

        <section className="pt-4 border-t border-[var(--color-rule)]">
          <div className="flex items-center gap-2 mb-2">
            <Building size={16} className="text-[var(--color-muted)]" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              5. Identificación del Proveedor y Jurisdicción (El Salvador)
            </h6>
          </div>
          <div className="surface-well p-3.5 text-xs text-[var(--color-muted)] space-y-2">
            <p className="m-0">
              En cumplimiento con la <strong className="text-[var(--color-ink-2)]">Ley de Comercio Electrónico de la República de El Salvador</strong>, se detallan los datos de contacto del responsable:
            </p>
            <ul className="list-none p-0 m-0 font-mono space-y-1">
              <li><strong className="text-[var(--color-ink)]">Titular del Proyecto:</strong> MiNominaSV</li>
              <li><strong className="text-[var(--color-ink)]">Jurisdicción:</strong> San Salvador, República de El Salvador</li>
              <li><strong className="text-[var(--color-ink)]">Contacto:</strong> contacto@minominasv.com</li>
            </ul>
            <p className="m-0">
              Cualquier controversia se regirá bajo las leyes de la <strong className="text-[var(--color-ink-2)]">República de El Salvador</strong>, con competencia exclusiva en los tribunales de San Salvador.
            </p>
          </div>
        </section>
      </PrimeCard>
    </div>
  );
}
