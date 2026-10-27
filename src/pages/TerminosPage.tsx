import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, Shield, FileText, Building, ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Calculadora</span>
        </Link>
        <span className="text-xs font-mono-tabular text-[#65635E]">
          Última actualización: Octubre 2026
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="border-b border-[#EFECE6] pb-4">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] font-semibold">
            Marco Legal · República de El Salvador
          </span>
          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold mt-2 text-[#141413]">
            Términos y Condiciones de Uso (TyC)
          </h1>
          <p className="text-sm text-[#65635E] mt-1">
            Condiciones legales que regulan el acceso y uso de la plataforma Salario y Gastos SV.
          </p>
        </div>

        {/* 1. Exoneración de responsabilidad (Disclaimer) */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[#B45309] font-semibold text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="font-serif-editorial text-lg text-[#141413]">
              1. Exoneración de Responsabilidad (Disclaimer Financiero y Laboral)
            </h2>
          </div>
          <p className="text-sm text-[#4A4945] leading-relaxed">
            Todos los cálculos de descuentos de ley (ISSS, AFP, Renta), prestaciones laborales (Vacación 30%,
            Aguinaldo, Quincena 25), costos por hora y proyecciones presupuestarias generados por{' '}
            <strong>Salario y Gastos SV</strong> son de carácter estrictamente{' '}
            <strong>informativo, ilustrativo y referencial</strong>. Esta herramienta no constituye ni
            sustituye la asesoría legal, contable, tributaria, financiera ni el dictamen oficial de un
            especialista en Recursos Humanos o Derecho Laboral.
          </p>
        </section>

        {/* 2. Margen de error */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[#0F4C3A] font-semibold text-base">
            <Scale className="w-5 h-5 shrink-0" />
            <h2 className="font-serif-editorial text-lg text-[#141413]">
              2. Margen de Error y Discrepancias en Planilla
            </h2>
          </div>
          <p className="text-sm text-[#4A4945] leading-relaxed">
            Debido a criterios internos de redondeo contable de cada empleador, reformas legislativas,
            retenciones acumuladas o recalculo semestral/anual del Impuesto sobre la Renta (junio y diciembre),
            el titular de la plataforma no se hace responsable por diferencias o discrepancias entre los
            montos estimados en esta aplicación y las liquidaciones oficiales emitidas por el Ministerio de
            Trabajo y Previsión Social (MTPS), el Ministerio de Hacienda, el Instituto Salvadoreño del Seguro
            Social (ISSS) o las Administradoras de Fondos de Pensiones (AFP).
          </p>
        </section>

        {/* 3. Propiedad Intelectual */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[#0F4C3A] font-semibold text-base">
            <FileText className="w-5 h-5 shrink-0" />
            <h2 className="font-serif-editorial text-lg text-[#141413]">
              3. Propiedad Intelectual
            </h2>
          </div>
          <p className="text-sm text-[#4A4945] leading-relaxed">
            El diseño visual, interfaz de usuario, estructura de código, algoritmos de simulación tributaria y
            documentación de <strong>Salario y Gastos SV</strong> se encuentran protegidos por la legislación
            aplicable en materia de propiedad intelectual. Queda prohibida la reproducción comercial,
            redistribución no autorizada o suplantación de identidad de la plataforma sin autorización expresa
            de su titular.
          </p>
        </section>

        {/* 4. Reglas de registro y uso */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[#0F4C3A] font-semibold text-base">
            <Shield className="w-5 h-5 shrink-0" />
            <h2 className="font-serif-editorial text-lg text-[#141413]">
              4. Reglas de Registro, Custodia de Credenciales y Veracidad
            </h2>
          </div>
          <p className="text-sm text-[#4A4945] leading-relaxed">
            El usuario registrado es el único responsable de mantener la confidencialidad de su contraseña y
            sesión activa, así como de la exactitud y veracidad de los montos salariales, bonos y registros de
            gastos ingresados en su cuenta personal. Queda prohibido intentar vulnerar los controles de acceso
            o consultar registros pertenecientes a otros usuarios.
          </p>
        </section>

        {/* 5. Ley de Comercio Electrónico y Jurisdicción de El Salvador */}
        <section className="space-y-2 pt-2 border-t border-[#EFECE6]">
          <div className="flex items-center gap-2 text-[#0F4C3A] font-semibold text-base">
            <Building className="w-5 h-5 shrink-0" />
            <h2 className="font-serif-editorial text-lg text-[#141413]">
              5. Identificación del Proveedor y Jurisdicción Aplicable (El Salvador)
            </h2>
          </div>
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] text-xs sm:text-sm text-[#4A4945] space-y-1.5">
            <p>
              En cumplimiento con la <strong>Ley de Comercio Electrónico de la República de El Salvador</strong>
              , se informa a los usuarios los datos de identificación y contacto del proveedor del servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono-tabular text-xs text-[#141413]">
              <li>
                <strong>Titular / Proveedor:</strong> Axel Reyes (Desarrollo Independiente · Salario y Gastos
                SV)
              </li>
              <li>
                <strong>Domicilio:</strong> San Salvador, República de El Salvador
              </li>
              <li>
                <strong>Correo electrónico de contacto y soporte legal:</strong> axel.f.reyes.a@gmail.com
              </li>
            </ul>
            <p className="pt-2 text-xs text-[#65635E]">
              <strong>Jurisdicción aplicable:</strong> Cualquier controversia o interpretación derivada del uso
              de esta aplicación se regirá por las leyes vigentes de la{' '}
              <strong>República de El Salvador</strong>, sometiéndose las partes a la jurisdicción de los
              tribunales competentes del distrito judicial de <strong>San Salvador</strong>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
