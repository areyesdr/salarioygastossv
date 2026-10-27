import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, Trash2, UserCheck, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

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
          Protección de Datos y Derechos ARCO
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="border-b border-[#EFECE6] pb-4">
          <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] font-semibold">
            Privacidad y Seguridad de Datos · El Salvador
          </span>
          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold mt-2 text-[#141413]">
            Política de Privacidad y Ejercicio de Derechos ARCO
          </h1>
          <p className="text-sm text-[#65635E] mt-1">
            Transparencia sobre el tratamiento de datos personales y financieros en Salario y Gastos SV.
          </p>
        </div>

        {/* 1. Qué datos recolectamos y finalidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#141413]">
              <ShieldCheck className="w-4 h-4 text-[#0F4C3A]" />
              <span>¿Qué datos recolectamos?</span>
            </div>
            <ul className="text-xs text-[#4A4945] space-y-1.5 list-disc pl-4">
              <li>
                <strong>Datos de identificación:</strong> Nombre o alias y dirección de correo electrónico al
                iniciar sesión.
              </li>
              <li>
                <strong>Datos financieros de simulación:</strong> Monto de salario nominal, antigüedad laboral,
                partidas de gastos personales y metas de ahorro vinculadas a tu identificador de usuario (
                <code>ownerId</code>).
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2DFD7] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#141413]">
              <Lock className="w-4 h-4 text-[#0F4C3A]" />
              <span>¿Para qué se utilizan y cómo se protegen?</span>
            </div>
            <ul className="text-xs text-[#4A4945] space-y-1.5 list-disc pl-4">
              <li>
                <strong>Uso exclusivo:</strong> Los datos se emplean únicamente para conservar tu historial de
                presupuesto dentro de la aplicación.
              </li>
              <li>
                <strong>Cero venta a terceros:</strong> Nunca comercializamos, cedemos ni compartimos tus
                ingresos o gastos con terceros ni entidades crediticias.
              </li>
              <li>
                <strong>Seguridad:</strong> Aislamiento por sesión (RBAC + ID Matching), transmisión segura
                HTTPS/SSL y sanitización de errores.
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Panel Interactivo de Derechos ARCO */}
        <div className="pt-4 border-t border-[#EFECE6] space-y-4">
          <div>
            <h2 className="font-serif-editorial text-xl font-semibold text-[#141413]">
              Centro de Control de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p className="text-xs text-[#65635E] mt-0.5">
              Como titular de tus datos personales en El Salvador, puedes ejercer directamente tus derechos
              desde este panel o escribiendo a{' '}
              <span className="font-mono-tabular text-[#141413]">axel.f.reyes.a@gmail.com</span>.
            </p>
          </div>

          {user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ACCESO */}
              <div className="p-4 rounded-xl border border-[#DFDCD2] bg-white flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase font-semibold text-[#0F4C3A]">
                    1. Derecho de Acceso
                  </span>
                  <h3 className="font-semibold text-sm mt-1">Descargar copia de mis datos</h3>
                  <p className="text-xs text-[#65635E] mt-1">
                    Obtén un archivo JSON con tu perfil y todos los gastos y metas asociados a tu cuenta (
                    <code>{user.id}</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportARCO}
                  className="w-full py-2 px-3 rounded-lg bg-[#0F4C3A] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#0F4C3A]/90 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar mis datos (.JSON)</span>
                </button>
              </div>

              {/* RECTIFICACIÓN */}
              <form
                onSubmit={handleRectifyARCO}
                className="p-4 rounded-xl border border-[#DFDCD2] bg-white flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono-tabular uppercase font-semibold text-[#1D4ED8]">
                    2. Derecho de Rectificación
                  </span>
                  <h3 className="font-semibold text-sm">Actualizar mis datos</h3>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full text-xs border border-[#DFDCD2] rounded-lg px-2.5 py-1.5"
                  />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    className="w-full text-xs border border-[#DFDCD2] rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-[#141413] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#141413]/90 cursor-pointer"
                >
                  {savedNotice ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Datos rectificados</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Guardar rectificación</span>
                    </>
                  )}
                </button>
              </form>

              {/* CANCELACIÓN Y OPOSICIÓN */}
              <div className="p-4 rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/4 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase font-semibold text-[#B91C1C]">
                    3. Cancelación y Oposición
                  </span>
                  <h3 className="font-semibold text-sm mt-1 text-[#141413]">
                    Eliminar cuenta y borrar historial
                  </h3>
                  <p className="text-xs text-[#65635E] mt-1">
                    Purga de inmediato tu sesión, salario configurado, gastos registrados y metas de bonos.
                  </p>
                </div>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2 px-3 rounded-lg bg-[#B91C1C] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#B91C1C]/90 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Solicitar borrado total</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCancelARCO}
                      className="flex-1 py-2 px-2 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirmar purga
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="py-2 px-2.5 rounded-lg bg-white border border-[#DFDCD2] text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] text-xs text-[#4A4945] flex items-center justify-between">
              <span>
                Actualmente navegas como <strong>Invitado (Anónimo)</strong>. Inicia sesión para gestionar o
                exportar tus datos ARCO.
              </span>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg bg-[#0F4C3A] text-white font-medium shrink-0"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
