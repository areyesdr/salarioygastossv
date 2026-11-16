import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  Trash2,
  UserCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Cookie,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PrimeButton, PrimeCard, PrimeDivider, PrimeInput, PrimeTag } from '../components/ui/PrimeUI.tsx';

export default function PrivacidadPage() {
  const { user, updateProfile, purgeUserDataAndAccount } = useAuth();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExportARCO = () => {
    const rawState = localStorage.getItem('salarioygastossv_state_v1');
    const payload = {
      exportedAt: new Date().toISOString(),
      legalBasis: 'Ejercicio de Derecho ARCO de Acceso y Portabilidad - El Salvador',
      userProfile: user,
      financialRecords: rawState ? JSON.parse(rawState) : {},
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datos-arco-${user?.id ?? 'invitado'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRectifyARCO = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editName, editEmail);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCancelARCO = () => {
    purgeUserDataAndAccount();
    navigate('/login');
  };

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
          Protección de datos y derechos ARCO
        </span>
      </div>

      <PrimeCard padded className="space-y-6">
        <div className="border-b border-[var(--color-rule)] pb-4">
          <PrimeTag severity="neutral" className="mb-2">
            Privacidad y seguridad de datos · El Salvador
          </PrimeTag>
          <h4 className="text-xl font-semibold text-[var(--color-ink)] mb-1">
            Política de Privacidad y Ejercicio de Derechos ARCO
          </h4>
          <p className="text-[var(--color-muted)] text-xs m-0">
            Transparencia sobre el tratamiento de datos personales y financieros en MiNominaSV.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="surface-well p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-[var(--color-muted)]" />
              <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
                ¿Qué datos recolectamos?
              </h6>
            </div>
            <ul className="text-xs text-[var(--color-muted)] space-y-1.5 pl-4 m-0 list-disc">
              <li>
                <strong className="text-[var(--color-ink-2)]">Identificación básica:</strong> Nombre o alias y correo al iniciar sesión opcionalmente.
              </li>
              <li>
                <strong className="text-[var(--color-ink-2)]">Parámetros de simulación:</strong> Salario ingresado, antigüedad y partidas presupuestarias asociadas a tu sesión.
              </li>
            </ul>
          </div>

          <div className="surface-well p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-[var(--color-muted)]" />
              <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
                ¿Cómo se protegen?
              </h6>
            </div>
            <ul className="text-xs text-[var(--color-muted)] space-y-1.5 pl-4 m-0 list-disc">
              <li>
                <strong className="text-[var(--color-ink-2)]">Sin venta a terceros:</strong> No comercializamos ni transferimos tus datos a agencias de crédito ni aseguradoras.
              </li>
              <li>
                <strong className="text-[var(--color-ink-2)]">Aislamiento (ID Matching):</strong> Cada usuario accede exclusivamente a sus propios registros.
              </li>
            </ul>
          </div>
        </div>

        <div className="surface-well p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cookie size={16} className="text-[var(--color-muted)] shrink-0" />
            <h6 className="text-sm font-semibold text-[var(--color-ink)] m-0">
              Uso de Cookies y Redes Publicitarias (Google AdSense)
            </h6>
          </div>
          <p className="text-xs text-[var(--color-muted)] mb-2">
            Para mantener el acceso público y gratuito a nuestras calculadoras y guías laborales en El Salvador, MiNominaSV puede mostrar anuncios patrocinados servidos por Google AdSense y sus redes asociadas.
          </p>
          <ul className="text-xs text-[var(--color-muted)] space-y-1.5 pl-4 mb-3 list-disc">
            <li>
              <strong className="text-[var(--color-ink-2)]">Cookies de proveedores externos:</strong> Terceros, incluido Google, utilizan cookies para publicar anuncios basados en visitas previas del usuario.
            </li>
            <li>
              <strong className="text-[var(--color-ink-2)]">Publicidad personalizada:</strong> Las cookies permiten a Google y a sus socios mostrar anuncios basados en intereses.
            </li>
            <li>
              <strong className="text-[var(--color-ink-2)]">Almacenamiento local (localStorage):</strong> Los datos de salario, deducciones y libreta de gastos se procesan de forma privada en tu navegador y no se transfieren a redes publicitarias.
            </li>
          </ul>
          <PrimeDivider />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--color-muted)]">
              Puedes gestionar o inhabilitar la publicidad personalizada en cualquier momento:
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <PrimeButton variant="outline" size="xs">
                  <span>Configuración de Anuncios de Google</span>
                  <ExternalLink size={11} />
                </PrimeButton>
              </a>
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <PrimeButton variant="outline" size="xs">
                  <span>AboutAds Choices</span>
                  <ExternalLink size={11} />
                </PrimeButton>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--color-rule)]">
          <h6 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
            Centro de Control de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
          </h6>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            Como titular de tus datos en El Salvador, puedes ejercer tus derechos directamente desde aquí o escribiendo a privacidad@salariosv.com:
          </p>

          {user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-[var(--color-rule)] flex flex-col justify-between gap-3">
                <div>
                  <PrimeTag severity="neutral" className="mb-2">1. Acceso</PrimeTag>
                  <h6 className="text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Descargar copia de datos
                  </h6>
                  <p className="text-[11px] text-[var(--color-muted)] m-0">
                    Obtén un archivo JSON con tu perfil y registros financieros vinculados.
                  </p>
                </div>
                <PrimeButton variant="secondary" size="xs" fullWidth onClick={handleExportARCO}>
                  <Download size={13} />
                  <span>Exportar (.JSON)</span>
                </PrimeButton>
              </div>

              <form
                onSubmit={handleRectifyARCO}
                className="p-3.5 rounded-xl border border-[var(--color-rule)] flex flex-col justify-between gap-3"
              >
                <div>
                  <PrimeTag severity="neutral" className="mb-2">2. Rectificación</PrimeTag>
                  <h6 className="text-xs font-semibold text-[var(--color-ink)] mb-2">
                    Actualizar datos personales
                  </h6>
                  <div className="space-y-1.5">
                    <PrimeInput
                      type="text"
                      inputSize="sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre"
                    />
                    <PrimeInput
                      type="email"
                      inputSize="sm"
                      mono
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Correo"
                    />
                  </div>
                </div>
                <PrimeButton type="submit" variant="secondary" size="xs" fullWidth>
                  {savedNotice ? (
                    <>
                      <CheckCircle2 size={13} className="text-[var(--color-emerald)]" />
                      <span>Actualizado</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={13} />
                      <span>Guardar cambios</span>
                    </>
                  )}
                </PrimeButton>
              </form>

              <div className="p-3.5 rounded-xl border border-[var(--color-rule)] flex flex-col justify-between gap-3">
                <div>
                  <PrimeTag severity="danger" className="mb-2">3. Cancelación</PrimeTag>
                  <h6 className="text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Purga total de cuenta
                  </h6>
                  <p className="text-[11px] text-[var(--color-muted)] m-0">
                    Elimina de forma irreversible tu sesión, partidas de gastos y metas registradas.
                  </p>
                </div>
                {!confirmDelete ? (
                  <PrimeButton
                    variant="outline"
                    size="xs"
                    fullWidth
                    className="text-[var(--color-danger)] border-[var(--color-danger)]/40"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={13} />
                    <span>Solicitar purga</span>
                  </PrimeButton>
                ) : (
                  <div className="flex gap-1.5">
                    <PrimeButton variant="danger" size="xs" className="flex-1" onClick={handleCancelARCO}>
                      Confirmar
                    </PrimeButton>
                    <PrimeButton variant="outline" size="xs" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </PrimeButton>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="surface-well p-3.5 text-xs text-[var(--color-muted)] flex flex-wrap justify-between items-center gap-3">
              <span>
                Actualmente navegas como <strong className="text-[var(--color-ink)]">Invitado (Anónimo)</strong>. Inicia sesión para guardar o exportar tus registros financieros.
              </span>
              <Link to="/login" className="no-underline">
                <PrimeButton variant="secondary" size="xs">
                  Iniciar sesión
                </PrimeButton>
              </Link>
            </div>
          )}
        </div>
      </PrimeCard>
    </div>
  );
}
