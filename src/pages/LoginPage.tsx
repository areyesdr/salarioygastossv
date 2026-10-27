import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, LogIn, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

type AuthFormMode = 'login' | 'register';

export default function LoginPage() {
  const {
    user,
    isSupabaseConnected,
    loginWithCredentials,
    registerWithCredentials,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const [formMode, setFormMode] = useState<AuthFormMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }

    if (formMode === 'register' && !name.trim()) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'register') {
        const res = await registerWithCredentials(email, password, name);
        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar usuario.');
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg('Cuenta creada correctamente. Redirigiendo...');
        setTimeout(() => navigate('/'), 600);
      } else {
        const res = await loginWithCredentials(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales inválidas.');
          setIsSubmitting(false);
          return;
        }
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <div className="card-soft p-4 p-sm-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white"
              style={{ width: '42px', height: '42px', backgroundColor: '#0f172a' }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h5 className="fw-semibold text-slate-dark mb-0">Acceso a la Plataforma</h5>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Gestión salarial y libretas presupuestarias
              </span>
            </div>
          </div>
        </div>

        {/* Estado de conexión con Supabase */}
        <div className="mb-4">
          {isSupabaseConnected ? (
            <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-emerald-50 text-emerald border border-emerald-200" style={{ fontSize: '11px' }}>
              <CheckCircle2 size={13} />
              <span>Base de datos Supabase conectada con RLS activo</span>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-slate-100 text-muted border border-slate-200" style={{ fontSize: '11px' }}>
              <Sparkles size={13} />
              <span>Modo local autónomo (almacenamiento en navegador)</span>
            </div>
          )}
        </div>

        {user?.loggedIn && (
          <div className="p-3 rounded bg-slate-50 border border-slate-200 small mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <strong className="text-slate-dark d-block">Sesión activa: {user.name}</strong>
                <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                  {user.email} · Rol: {user.role.toUpperCase()}
                </span>
              </div>
              <span className="badge-subtle font-monospace">Activa</span>
            </div>
            <div className="pt-1 border-top">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="btn btn-sm btn-outline-danger py-1 px-3 w-100"
                style={{ fontSize: '11px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Selector de Modo: Solo Iniciar Sesión o Registrarse */}
        <div className="segmented-control mb-4">
          <button
            type="button"
            onClick={() => {
              setFormMode('login');
              setErrorMsg('');
            }}
            className={formMode === 'login' ? 'active' : ''}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setFormMode('register');
              setErrorMsg('');
            }}
            className={formMode === 'register' ? 'active' : ''}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="small">
          {formMode === 'register' && (
            <div className="mb-3">
              <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Martínez"
                className="form-control"
                autoComplete="name"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-slate-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="form-control font-monospace"
              autoComplete="email"
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
              placeholder="Ingresa tu contraseña"
              className="form-control"
              autoComplete={formMode === 'register' ? 'new-password' : 'current-password'}
            />
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
                Política de Privacidad
              </Link>
              .
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-light border border-danger text-danger mb-3 font-medium small">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded bg-light border border-success text-success mb-3 font-medium small">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : formMode === 'login' ? (
              <>
                <LogIn size={15} />
                <span>Iniciar Sesión</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
