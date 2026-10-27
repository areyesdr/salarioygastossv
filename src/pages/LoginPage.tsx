import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogIn, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { type UserRole } from '../lib/security.ts';

export default function LoginPage() {
  const { user, loginAs, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('Axel Reyes');
  const [email, setEmail] = useState('axel.f.reyes.a@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }
    setErrorMsg('');
    loginAs(selectedRole, email, name);
    navigate(selectedRole === 'admin' ? '/admin' : '/mis-gastos');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-[#DFDCD2] p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F4C3A] text-white flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif-editorial text-xl font-semibold text-[#141413]">
              Acceso y Control de Sesión
            </h1>
            <p className="text-xs text-[#65635E]">
              Autenticación con Control de Acceso Basado en Roles (RBAC)
            </p>
          </div>
        </div>

        {user?.loggedIn && (
          <div className="p-3.5 rounded-xl bg-[#0F4C3A]/8 border border-[#0F4C3A]/20 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#0F4C3A] block">Sesión activa: {user.name}</span>
              <span className="font-mono-tabular text-[#4A4945]">
                Rol: {user.role.toUpperCase()} · ID: {user.id}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#DFDCD2] text-[#B91C1C] font-medium cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-[#65635E] mb-1">Nombre / Titular</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DFDCD2] bg-[#FAF9F5] focus:bg-white focus:border-[#0F4C3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#65635E] mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DFDCD2] bg-[#FAF9F5] focus:bg-white focus:border-[#0F4C3A] focus:outline-none font-mono-tabular"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#65635E] mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DFDCD2] bg-[#FAF9F5] focus:bg-white focus:border-[#0F4C3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#65635E] mb-1.5">
              Rol de acceso (Simulación RBAC)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('user')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  selectedRole === 'user'
                    ? 'border-[#0F4C3A] bg-[#0F4C3A]/8 text-[#141413]'
                    : 'border-[#DFDCD2] text-[#65635E]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#0F4C3A]" />
                  <span>Usuario Registrado</span>
                </div>
                <span className="text-[11px] block mt-0.5">Acceso a /mis-gastos (Bloquea /admin → 403)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-[#0F4C3A] bg-[#0F4C3A]/8 text-[#141413]'
                    : 'border-[#DFDCD2] text-[#65635E]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#0F4C3A]" />
                  <span>Administrador</span>
                </div>
                <span className="text-[11px] block mt-0.5">Acceso a /admin y métricas globales</span>
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-[#4A4945]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#0F4C3A]"
            />
            <span>
              He leído y acepto los{' '}
              <Link to="/terminos" className="text-[#0F4C3A] underline font-medium">
                Términos y Condiciones (Disclaimer Legal)
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-[#0F4C3A] underline font-medium">
                Política de Privacidad (Derechos ARCO)
              </Link>
              .
            </span>
          </label>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[#B91C1C]/10 text-[#B91C1C] font-medium">{errorMsg}</div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F4C3A] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0F4C3A]/90 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión Segura</span>
          </button>
        </form>
      </div>
    </div>
  );
}
