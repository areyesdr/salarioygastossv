import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  LogIn,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Scale,
  FileText,
  Activity,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PrimeButton,
  PrimeCard,
  PrimeCheckbox,
  PrimeInput,
  PrimeMessage,
  PrimeSelectButton,
  PrimeTag,
  PrimeDivider,
} from '../components/ui/PrimeUI.tsx';

type AuthFormMode = 'login' | 'register';

export default function LoginPage() {
  const {
    user,
    isSupabaseConnected,
    loginWithCredentials,
    registerWithCredentials,
    loginAs,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const [formMode, setFormMode] = useState<AuthFormMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validación de términos: SOLO se exige al registrarse, no al iniciar sesión
    if (formMode === 'register' && !acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones y la Política de Privacidad para crear tu cuenta.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Ingresa tu correo electrónico y contraseña.');
      return;
    }

    if (formMode === 'register' && !name.trim()) {
      setErrorMsg('Ingresa tu nombre completo para personalizar tu cuenta.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'register') {
        const res = await registerWithCredentials(email, password, name);
        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar el usuario.');
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg('Cuenta creada correctamente. Redirigiendo a tu calculadora...');
        setTimeout(() => navigate('/'), 600);
      } else {
        const res = await loginWithCredentials(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Correo o contraseña incorrectos. Verifica tus datos.');
          setIsSubmitting(false);
          return;
        }
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servicio de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAccess = () => {
    loginAs('user', 'usuario@salariosv.com', 'Usuario Ciudadano');
    navigate('/');
  };

  return (
    <div className="container-app py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
        {/* Columna Izquierda: Información para el trabajador salvadoreño */}
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>El Salvador · Código de Trabajo 2026</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)] tracking-tight leading-tight mb-2">
              Calculadora Laboral para el Trabajador Salvadoreño
            </h1>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed m-0">
              Una herramienta ciudadana transparente para que conozcas con exactitud matemática lo que te corresponde por ley y ningún patrono te descuente de más ni te engañe en tu pago, finiquito o incapacidad.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3.5 rounded-xl surface-well border border-[var(--color-rule)]">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Scale size={18} />
              </div>
              <div>
                <h6 className="text-xs font-bold text-[var(--color-ink)] m-0 mb-0.5">
                  Boleta de Pago Exacta al Centavo
                </h6>
                <p className="text-[11px] text-[var(--color-muted)] m-0 leading-normal">
                  Deducciones reales de ISSS (tope legal mensual de $30.00), AFP (7.25% sin tope) y Renta (ISR) según la tabla oficial de tramos de Hacienda SV.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl surface-well border border-[var(--color-rule)]">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h6 className="text-xs font-bold text-[var(--color-ink)] m-0 mb-0.5">
                  Liquidación y Finiquito (Art. 58 CT y D.L. 592)
                </h6>
                <p className="text-[11px] text-[var(--color-muted)] m-0 leading-normal">
                  Cálculo claro de indemnización por despido, renuncia voluntaria con prestación y vacaciones y aguinaldo proporcionales irrenunciables.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl surface-well border border-[var(--color-rule)]">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <h6 className="text-xs font-bold text-[var(--color-ink)] m-0 mb-0.5">
                  Remuneración de Incapacidad Médica
                </h6>
                <p className="text-[11px] text-[var(--color-muted)] m-0 leading-normal">
                  Conoce cuánto cubre el subsidio del ISSS (75%) y qué días corresponden al patrono según el Código de Trabajo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl surface-well border border-[var(--color-rule)]">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h6 className="text-xs font-bold text-[var(--color-ink)] m-0 mb-0.5">
                  Privacidad y Seguridad en la Nube
                </h6>
                <p className="text-[11px] text-[var(--color-muted)] m-0 leading-normal">
                  Tus cálculos, historial de aumentos y libreta de gastos quincenales se guardan bajo tu cuenta privada con cifrado RLS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Acceso PrimeUI Aura */}
        <div className="lg:col-span-6">
          <PrimeCard padded className="w-full shadow-lg border border-[var(--color-rule)]">
            {/* Header del formulario */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 dark:border dark:border-slate-700 shrink-0 shadow-xs">
                  {formMode === 'login' ? <Lock size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-ink)] m-0">
                    {formMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Ciudadana'}
                  </h2>
                  <p className="text-xs text-[var(--color-muted)] m-0">
                    {formMode === 'login'
                      ? 'Accede a tus datos salariales y presupuestos'
                      : 'Guarda tus cálculos de forma segura y gratuita'}
                  </p>
                </div>
              </div>

              {isSupabaseConnected ? (
                <PrimeTag severity="success" className="text-[10px] hidden sm:inline-flex">
                  <CheckCircle2 size={11} />
                  <span>Nube RLS</span>
                </PrimeTag>
              ) : (
                <PrimeTag severity="neutral" className="text-[10px] hidden sm:inline-flex">
                  <Sparkles size={11} />
                  <span>Local</span>
                </PrimeTag>
              )}
            </div>

            {/* Si ya hay sesión activa */}
            {user?.loggedIn && (
              <div className="surface-well p-3.5 mb-4 text-xs rounded-xl border border-[var(--color-rule)]">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <strong className="text-[var(--color-ink)] block">{user.name}</strong>
                      <span className="text-[var(--color-muted)] font-mono text-[11px]">
                        {user.email} · Rol: {user.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <PrimeTag severity="success">Conectado</PrimeTag>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-rule)]">
                  <PrimeButton
                    variant="primary"
                    size="xs"
                    className="flex-1"
                    onClick={() => navigate('/')}
                  >
                    <span>Ir a la Calculadora</span>
                    <ArrowRight size={13} />
                  </PrimeButton>
                  <PrimeButton
                    variant="outline"
                    size="xs"
                    className="text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    onClick={async () => {
                      await logout();
                    }}
                  >
                    Cerrar sesión
                  </PrimeButton>
                </div>
              </div>
            )}

            {/* Switcher Iniciar Sesión / Registrarse */}
            <div className="mb-4">
              <PrimeSelectButton<AuthFormMode>
                value={formMode}
                onChange={(val) => {
                  setFormMode(val);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                fullWidth
                options={[
                  {
                    value: 'login',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <LogIn size={13} />
                        <span>Iniciar sesión</span>
                      </span>
                    ),
                  },
                  {
                    value: 'register',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <UserPlus size={13} />
                        <span>Registrarse</span>
                      </span>
                    ),
                  },
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
                    leftIcon={<User size={15} />}
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
                  leftIcon={<Mail size={15} />}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-[var(--color-ink-2)]">
                    Contraseña
                  </label>
                  {formMode === 'login' && (
                    <span className="text-[10.5px] text-[var(--color-muted)] font-mono">
                      Cifrado seguro
                    </span>
                  )}
                </div>
                <PrimeInput
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={formMode === 'register' ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                  autoComplete={formMode === 'register' ? 'new-password' : 'current-password'}
                  leftIcon={<Lock size={15} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer bg-transparent border-0 flex items-center justify-center"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {/* Checkbox de Términos: EXCLUSIVO del modo REGISTRO */}
              {formMode === 'register' && (
                <div className="flex items-start gap-2 pt-1">
                  <PrimeCheckbox
                    id="acceptTermsCheck"
                    checked={acceptedTerms}
                    onChange={setAcceptedTerms}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="acceptTermsCheck"
                    className="text-xs text-[var(--color-muted)] leading-snug cursor-pointer select-none"
                  >
                    He leído y acepto los{' '}
                    <Link
                      to="/terminos"
                      target="_blank"
                      className="text-[var(--color-ink)] font-semibold underline hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link
                      to="/privacidad"
                      target="_blank"
                      className="text-[var(--color-ink)] font-semibold underline hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </label>
                </div>
              )}

              {errorMsg && <PrimeMessage severity="danger">{errorMsg}</PrimeMessage>}
              {successMsg && <PrimeMessage severity="success">{successMsg}</PrimeMessage>}

              <PrimeButton
                type="submit"
                variant={formMode === 'register' ? 'primary' : 'secondary'}
                size="md"
                fullWidth
                disabled={isSubmitting}
                className="font-semibold shadow-sm"
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
                    <span>Crear cuenta gratuita</span>
                  </>
                )}
              </PrimeButton>
            </form>

            <PrimeDivider className="my-4" />

            {/* Alternar modo o entrar como invitado */}
            <div className="space-y-2 text-center text-xs">
              <div>
                {formMode === 'login' ? (
                  <p className="text-[var(--color-muted)] m-0">
                    ¿Aún no tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode('register');
                        setErrorMsg('');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      Regístrate gratis en 10 segundos
                    </button>
                  </p>
                ) : (
                  <p className="text-[var(--color-muted)] m-0">
                    ¿Ya tienes una cuenta registrada?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode('login');
                        setErrorMsg('');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      Inicia sesión aquí
                    </button>
                  </p>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors bg-transparent border-0 cursor-pointer underline"
                >
                  Continuar como invitado sin cuenta (almacenamiento en este navegador)
                </button>
              </div>
            </div>
          </PrimeCard>
        </div>
      </div>
    </div>
  );
}
