import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, LogIn, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { type UserRole } from '../lib/security.ts';

export default function LoginPage() {
  const { user, loginAs, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'clean' | 'demo'>('clean');
  const [name, setName] = useState('Usuario Pruebas');
  const [email, setEmail] = useState('test@salariosv.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleModeChange = (newMode: 'clean' | 'demo') => {
    setMode(newMode);
    if (newMode === 'clean') {
      setName('Usuario Pruebas');
      setEmail('test@salariosv.com');
      setSelectedRole('user');
    } else {
      setName('Usuario Demo');
      setEmail('usuario@salariosv.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }
    setErrorMsg('');
    const isClean = mode === 'clean';
    loginAs(selectedRole, email, name, isClean);
    navigate(selectedRole === 'admin' ? '/admin' : '/');
  };

  const handleStartFreshTestUser = () => {
    loginAs('user', 'test@salariosv.com', 'Usuario Pruebas', true);
    navigate('/');
  };

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <div className="card-soft p-4 p-sm-5">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white"
            style={{ width: '42px', height: '42px', backgroundColor: '#0f172a' }}
          >
            <Lock size={20} />
          </div>
          <div>
            <h5 className="fw-semibold text-slate-dark mb-0">Acceso y Gestión de Pruebas</h5>
            <span className="small text-muted" style={{ fontSize: '12px' }}>
              Inicia sesión o crea una cuenta limpia para pruebas desde cero
            </span>
          </div>
        </div>

        {user?.loggedIn && (
          <div className="p-3 rounded bg-slate-50 border border-slate-200 small mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <strong className="text-slate-dark d-block">Sesión activa: {user.name}</strong>
                <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                  {user.email} · Rol: {user.role.toUpperCase()} · ID: {user.id}
                </span>
              </div>
              <span className="badge-subtle font-monospace">Activa</span>
            </div>
            <div className="d-flex gap-2 pt-1 border-top">
              <button
                type="button"
                onClick={handleStartFreshTestUser}
                className="btn btn-sm btn-outline-secondary py-1 px-2.5 flex-grow-1"
                style={{ fontSize: '11px' }}
              >
                Reiniciar cuenta a cero
              </button>
              <button
                type="button"
                onClick={logout}
                className="btn btn-sm btn-outline-danger py-1 px-2.5"
                style={{ fontSize: '11px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Selector de Modo: Pruebas desde Cero vs Demo */}
        <div className="segmented-control mb-4">
          <button
            type="button"
            onClick={() => handleModeChange('clean')}
            className={mode === 'clean' ? 'active' : ''}
          >
            Pruebas desde Cero
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('demo')}
            className={mode === 'demo' ? 'active' : ''}
          >
            Usuario Demo (Ejemplos)
          </button>
        </div>

        {mode === 'clean' && (
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-dark small mb-3" style={{ fontSize: '12px' }}>
            <strong>Cuenta limpia:</strong> Iniciarás sin historial de gastos ni metas precargadas, con el salario mínimo de ley ($408.80) para probar el flujo desde cero.
          </div>
        )}

        {mode === 'demo' && (
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-dark small mb-3" style={{ fontSize: '12px' }}>
            <strong>Cuenta demo:</strong> Contiene gastos mensuales y metas de ahorro precargadas para explorar la distribución presupuestaria.
          </div>
        )}

        <form onSubmit={handleSubmit} className="small">
          <div className="mb-3">
            <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control font-monospace"
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1.5" style={{ fontSize: '11px' }}>
              Tipo de Perfil
            </label>
            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={`w-100 p-2.5 rounded text-start border transition ${
                    selectedRole === 'user'
                      ? 'border-dark bg-slate-50 text-slate-dark'
                      : 'border-slate-200 bg-white text-muted'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="fw-semibold d-flex align-items-center gap-2">
                    <UserCheck size={14} className="text-secondary" />
                    <span>Usuario</span>
                  </div>
                  <span className="small text-muted d-block mt-0.5" style={{ fontSize: '11px' }}>
                    Historial personal
                  </span>
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`w-100 p-2.5 rounded text-start border transition ${
                    selectedRole === 'admin'
                      ? 'border-dark bg-slate-50 text-slate-dark'
                      : 'border-slate-200 bg-white text-muted'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="fw-semibold d-flex align-items-center gap-2">
                    <Shield size={14} className="text-secondary" />
                    <span>Administrador</span>
                  </div>
                  <span className="small text-muted d-block mt-0.5" style={{ fontSize: '11px' }}>
                    Parámetros legales
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              id="acceptTermsCheck"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="form-check-input"
            />
            <label htmlFor="acceptTermsCheck" className="form-check-label text-muted" style={{ fontSize: '12px' }}>
              Acepto los{' '}
              <Link to="/terminos" className="text-slate-dark fw-semibold text-decoration-underline">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-slate-dark fw-semibold text-decoration-underline">
                Política de Privacidad (ARCO)
              </Link>
              .
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-light border border-danger text-danger mb-3 font-medium small">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
          >
            <LogIn size={15} />
            <span>
              {mode === 'clean' ? 'Iniciar Pruebas desde Cero' : 'Cargar Sesión Demo'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
