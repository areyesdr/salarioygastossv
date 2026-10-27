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
          Protección de Datos y Derechos ARCO
        </span>
      </div>

      <div className="card-soft p-4 p-sm-5 space-y-4">
        <div className="border-bottom pb-3 mb-4">
          <span className="badge bg-slate-100 text-slate-700 border border-slate-200 font-monospace text-uppercase mb-2" style={{ fontSize: '10px' }}>
            Privacidad y Seguridad de Datos · El Salvador
          </span>
          <h4 className="fw-semibold text-slate-dark mb-1">
            Política de Privacidad y Ejercicio de Derechos ARCO
          </h4>
          <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
            Transparencia sobre el tratamiento de datos personales y financieros en MiNominaSV.
          </p>
        </div>

        {/* 1. Qué datos recolectamos y finalidad */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 h-100">
              <div className="d-flex align-items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-secondary" />
                <h6 className="fw-semibold text-slate-dark mb-0" style={{ fontSize: '13px' }}>
                  ¿Qué datos recolectamos?
                </h6>
              </div>
              <ul className="text-muted small space-y-1 ps-3 mb-0" style={{ fontSize: '12px' }}>
                <li>
                  <strong>Identificación básica:</strong> Nombre o alias y correo al iniciar sesión opcionalmente.
                </li>
                <li>
                  <strong>Parámetros de simulación:</strong> Salario ingresado, antigüedad y partidas presupuestarias asociadas a tu sesión local.
                </li>
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 h-100">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Lock size={16} className="text-secondary" />
                <h6 className="fw-semibold text-slate-dark mb-0" style={{ fontSize: '13px' }}>
                  ¿Cómo se protegen?
                </h6>
              </div>
              <ul className="text-muted small space-y-1 ps-3 mb-0" style={{ fontSize: '12px' }}>
                <li>
                  <strong>Sin venta a terceros:</strong> No comercializamos ni transferimos tus datos a agencias de crédito ni aseguradoras.
                </li>
                <li>
                  <strong>Aislamiento (ID Matching):</strong> Cada usuario accede exclusivamente a sus propios registros.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Centro de Control ARCO */}
        <div className="pt-3 border-top">
          <h6 className="fw-semibold text-slate-dark mb-1">
            Centro de Control de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
          </h6>
          <p className="text-muted small mb-3" style={{ fontSize: '12px' }}>
            Como titular de tus datos en El Salvador, puedes ejercer tus derechos directamente desde aquí o escribiendo a privacidad@salariosv.com:
          </p>

          {user ? (
            <div className="row g-3">
              {/* Acceso */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded border border-slate-200 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <span className="badge bg-light text-secondary border font-monospace mb-1" style={{ fontSize: '10px' }}>
                      1. Acceso
                    </span>
                    <h6 className="fw-semibold text-slate-dark mb-1" style={{ fontSize: '13px' }}>
                      Descargar copia de datos
                    </h6>
                    <p className="text-muted small mb-3" style={{ fontSize: '11px' }}>
                      Obtén un archivo JSON con tu perfil y registros financieros vinculados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportARCO}
                    className="btn btn-dark btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1.5"
                    style={{ fontSize: '11px' }}
                  >
                    <Download size={13} />
                    <span>Exportar (.JSON)</span>
                  </button>
                </div>
              </div>

              {/* Rectificación */}
              <div className="col-12 col-md-4">
                <form
                  onSubmit={handleRectifyARCO}
                  className="p-3 rounded border border-slate-200 h-100 d-flex flex-column justify-content-between"
                >
                  <div>
                    <span className="badge bg-light text-secondary border font-monospace mb-1" style={{ fontSize: '10px' }}>
                      2. Rectificación
                    </span>
                    <h6 className="fw-semibold text-slate-dark mb-2" style={{ fontSize: '13px' }}>
                      Actualizar datos personales
                    </h6>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre"
                      className="form-control form-control-sm mb-1.5 text-xs"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Correo"
                      className="form-control form-control-sm mb-2 text-xs font-monospace"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-dark btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1.5"
                    style={{ fontSize: '11px' }}
                  >
                    {savedNotice ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald" />
                        <span>Actualizado</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={13} />
                        <span>Guardar cambios</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Cancelación */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded border border-slate-200 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <span className="badge bg-light text-danger border font-monospace mb-1" style={{ fontSize: '10px' }}>
                      3. Cancelación
                    </span>
                    <h6 className="fw-semibold text-slate-dark mb-1" style={{ fontSize: '13px' }}>
                      Purga total de cuenta
                    </h6>
                    <p className="text-muted small mb-3" style={{ fontSize: '11px' }}>
                      Elimina de forma irreversible tu sesión, partidas de gastos y metas registradas.
                    </p>
                  </div>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="btn btn-outline-danger btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1.5"
                      style={{ fontSize: '11px' }}
                    >
                      <Trash2 size={13} />
                      <span>Solicitar purga</span>
                    </button>
                  ) : (
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        onClick={handleCancelARCO}
                        className="btn btn-danger btn-sm flex-grow-1 py-1"
                        style={{ fontSize: '11px' }}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="btn btn-secondary btn-sm py-1"
                        style={{ fontSize: '11px' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded bg-slate-50 border border-slate-200 small text-muted d-flex justify-content-between align-items-center">
              <span>
                Actualmente navegas como <strong>Invitado (Anónimo)</strong>. Inicia sesión para guardar o exportar tus registros financieros.
              </span>
              <Link to="/login" className="btn btn-sm btn-dark ms-3 shrink-0 py-1 px-3" style={{ fontSize: '12px' }}>
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
