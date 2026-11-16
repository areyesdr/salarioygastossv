import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, LogIn, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PrimeButton,
  PrimeCard,
  PrimeCheckbox,
  PrimeInput,
  PrimeMessage,
  PrimeSelectButton,
  PrimeTag,
} from '../components/ui/PrimeUI.tsx';

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
    <div className="container-app py-10 flex justify-center">
      <PrimeCard padded className="max-w-[460px] w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-ink)] text-[var(--color-card)] shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <h5 className="text-base font-semibold text-[var(--color-ink)] mb-0.5">
              Acceso a la plataforma
            </h5>
            <p className="text-xs text-[var(--color-muted)] m-0">
              Gestión salarial y libretas presupuestarias
            </p>
          </div>
        </div>

        <div className="mb-4">
          {isSupabaseConnected ? (
            <PrimeTag severity="success" className="w-full justify-start py-1.5 px-3 rounded-xl">
              <CheckCircle2 size={13} />
              <span>Base de datos Supabase conectada con RLS activo</span>
            </PrimeTag>
          ) : (
            <PrimeTag severity="neutral" className="w-full justify-start py-1.5 px-3 rounded-xl">
              <Sparkles size={13} />
              <span>Modo local autónomo (almacenamiento en navegador)</span>
            </PrimeTag>
          )}
        </div>

        {user?.loggedIn && (
          <div className="surface-well p-3.5 mb-4 text-xs">
            <div className="flex justify-between items-center gap-2 mb-2.5">
              <div>
                <strong className="text-[var(--color-ink)] block">Sesión activa: {user.name}</strong>
                <span className="text-[var(--color-muted)] font-mono text-[11px]">
                  {user.email} · Rol: {user.role.toUpperCase()}
                </span>
              </div>
              <PrimeTag severity="success">Activa</PrimeTag>
            </div>
            <div className="pt-2 border-t border-[var(--color-rule)]">
              <PrimeButton
                variant="outline"
                size="xs"
                fullWidth
                className="text-[var(--color-danger)] border-[var(--color-danger)]/30"
                onClick={async () => {
                  await logout();
                }}
              >
                Cerrar sesión
              </PrimeButton>
            </div>
          </div>
        )}

        <div className="mb-4">
          <PrimeSelectButton
            value={formMode}
            onChange={(val) => {
              setFormMode(val);
              setErrorMsg('');
            }}
            fullWidth
            options={[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Registrarse' },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
                Nombre completo
              </label>
              <PrimeInput
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Martínez"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
              Correo electrónico
            </label>
            <PrimeInput
              type="email"
              required
              mono
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
              Contraseña
            </label>
            <PrimeInput
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete={formMode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          <div className="flex items-start gap-2 pt-1">
            <PrimeCheckbox
              id="acceptTermsCheck"
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              className="mt-0.5"
            />
            <label htmlFor="acceptTermsCheck" className="text-xs text-[var(--color-muted)] leading-snug cursor-pointer">
              Acepto los{' '}
              <Link to="/terminos" className="text-[var(--color-ink)] font-semibold underline">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-[var(--color-ink)] font-semibold underline">
                Política de Privacidad
              </Link>
              .
            </label>
          </div>

          {errorMsg && <PrimeMessage severity="danger">{errorMsg}</PrimeMessage>}
          {successMsg && <PrimeMessage severity="success">{successMsg}</PrimeMessage>}

          <PrimeButton
            type="submit"
            variant="secondary"
            size="md"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : formMode === 'login' ? (
              <>
                <LogIn size={15} />
                <span>Iniciar sesión</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Crear cuenta</span>
              </>
            )}
          </PrimeButton>
        </form>
      </PrimeCard>
    </div>
  );
}
