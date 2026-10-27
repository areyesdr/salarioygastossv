import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, Shield, FileText, Building, ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="container py-4" style={{ maxWidth: '840px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link
          to="/"
          className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-inline-flex align-items-center gap-2"
          style={{ fontSize: '12px' }}
        >
          <ArrowLeft size={13} />
          <span>Volver a la Calculadora</span>
        </Link>
        <span className="small text-muted font-monospace" style={{ fontSize: '11px' }}>
          Última actualización: Octubre 2026
        </span>
      </div>

      <div className="card-soft p-4 p-sm-5 space-y-4">
        <div className="border-bottom pb-3 mb-4">
          <span className="badge bg-slate-100 text-slate-700 border border-slate-200 font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
            Marco Legal · República de El Salvador
          </span>
          <h4 className="fw-semibold text-slate-dark mb-1">
            Términos y Condiciones de Uso (TyC)
          </h4>
          <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
            Condiciones legales que regulan el acceso y uso de la plataforma Salario SV.
          </p>
        </div>

        {/* 1. Exoneración de responsabilidad */}
        <section className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-secondary" />
            <h6 className="fw-semibold text-slate-dark mb-0">
              1. Exoneración de Responsabilidad (Disclaimer Financiero y Laboral)
            </h6>
          </div>
          <p className="text-muted small leading-relaxed mb-0" style={{ fontSize: '13px' }}>
            Todos los cálculos de deducciones de ley (ISSS, AFP, Renta), prestaciones laborales (Vacación 30%,
            Aguinaldo, Quincena 25), costos por hora y proyecciones presupuestarias generados por{' '}
            <strong className="text-slate-dark">Salario SV</strong> son de carácter estrictamente{' '}
            <strong>informativo, ilustrativo y referencial</strong>. Esta herramienta no constituye ni
            sustituye la asesoría legal, contable, tributaria ni el dictamen oficial de un especialista en
            Derecho Laboral o Recursos Humanos.
          </p>
        </section>

        {/* 2. Margen de error */}
        <section className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Scale size={16} className="text-secondary" />
            <h6 className="fw-semibold text-slate-dark mb-0">
              2. Margen de Error y Discrepancias en Planilla
            </h6>
          </div>
          <p className="text-muted small leading-relaxed mb-0" style={{ fontSize: '13px' }}>
            Debido a políticas internas de redondeo de cada empresa, reformas tributarias, tramos variables o
            recalculo semestral del Impuesto sobre la Renta (junio y diciembre), el titular de la plataforma no se hace
            responsable por diferencias entre los montos estimados en esta aplicación y las liquidaciones oficiales
            emitidas por el Ministerio de Trabajo y Previsión Social (MTPS), Ministerio de Hacienda, ISSS o AFP.
          </p>
        </section>

        {/* 3. Propiedad Intelectual */}
        <section className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <FileText size={16} className="text-secondary" />
            <h6 className="fw-semibold text-slate-dark mb-0">
              3. Propiedad Intelectual
            </h6>
          </div>
          <p className="text-muted small leading-relaxed mb-0" style={{ fontSize: '13px' }}>
            El diseño visual, interfaz de usuario, estructura de código y algoritmos de cálculo tributario de{' '}
            <strong className="text-slate-dark">Salario SV</strong> se encuentran protegidos por la legislación aplicable.
            Queda prohibida su reproducción no autorizada o explotación comercial sin el consentimiento expreso del titular.
          </p>
        </section>

        {/* 4. Reglas de uso */}
        <section className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Shield size={16} className="text-secondary" />
            <h6 className="fw-semibold text-slate-dark mb-0">
              4. Reglas de Registro y Custodia de Credenciales
            </h6>
          </div>
          <p className="text-muted small leading-relaxed mb-0" style={{ fontSize: '13px' }}>
            El usuario registrado es responsable de la confidencialidad de su cuenta y de la exactitud de los datos
            personales ingresados en su sesión. Se prohíbe cualquier intento de vulnerar los controles de acceso o
            consultar información de terceros.
          </p>
        </section>

        {/* 5. Ley de Comercio Electrónico */}
        <section className="pt-3 border-top">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Building size={16} className="text-secondary" />
            <h6 className="fw-semibold text-slate-dark mb-0">
              5. Identificación del Proveedor y Jurisdicción (El Salvador)
            </h6>
          </div>
          <div className="p-3 rounded bg-slate-50 border border-slate-200 small text-muted" style={{ fontSize: '12px' }}>
            <p className="mb-2">
              En cumplimiento con la <strong>Ley de Comercio Electrónico de la República de El Salvador</strong>, se detallan los datos de contacto del responsable:
            </p>
            <ul className="list-unstyled mb-2 font-monospace space-y-1">
              <li><strong>Titular / Desarrollador:</strong> Axel Reyes</li>
              <li><strong>Domicilio:</strong> San Salvador, República de El Salvador</li>
              <li><strong>Contacto:</strong> axel.f.reyes.a@gmail.com</li>
            </ul>
            <p className="mb-0">
              Cualquier controversia se regirá bajo las leyes de la <strong>República de El Salvador</strong>, con competencia exclusiva en los tribunales de San Salvador.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
