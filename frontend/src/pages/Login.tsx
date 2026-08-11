import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, loginUser } from '../store/authSlice';
import { hydrateSession } from '../store/session';
import { validateLoginForm } from '../constants/authValidation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Mail, Lock, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    userEmail?: string;
    password?: string;
  }>({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useAppSelector((s) => s.auth.loading);
  const authError = useAppSelector((s) => s.auth.error);

  const registeredState = location.state as { registered?: boolean; email?: string } | null;
  const from = (location.state as { from?: string } | null)?.from || '/home';

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  React.useEffect(() => {
    if (registeredState?.email) setEmail(registeredState.email);
  }, [registeredState?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setFieldErrors({});

    const client = validateLoginForm(email, password);
    if (!client.ok) {
      setFieldErrors(client.fieldErrors);
      return;
    }

    const result = await dispatch(
      loginUser({ userEmail: email.trim().toLowerCase(), password })
    );

    if (loginUser.fulfilled.match(result)) {
      await hydrateSession(dispatch);
      navigate(from, { replace: true });
    } else if (loginUser.rejected.match(result)) {
      const payload = result.payload as
        | { message?: string; fieldErrors?: Record<string, string> }
        | undefined;
      if (payload?.fieldErrors) {
        setFieldErrors({
          userEmail: payload.fieldErrors.userEmail,
          password: payload.fieldErrors.password,
        });
      }
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 bg-jade text-parchment"
      style={{
        backgroundImage: `url('/assets/background/login_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-jade-dark/50 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        <Card variant="wood" className="border-2 border-gold shadow-2xl">
          <h3 className="text-xl font-bold tracking-widest text-center text-gold mb-6 uppercase font-martial">
            Academy Entry
          </h3>

          {registeredState?.registered && (
            <div className="mb-4 rounded-xl border border-green-500/40 bg-green-950/50 p-3 text-xs text-green-200">
              Registration successful. Sign in with your credentials.
            </div>
          )}

          {authError && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-950/80 border border-red-500/50 p-3 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Scroll Address (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((f) => ({ ...f, userEmail: undefined }));
                  }}
                  placeholder="name@academy.com"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              {fieldErrors.userEmail && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.userEmail}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Secret Phrase (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.password}</p>
              )}
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={loading} className="mt-6">
              {loading ? 'Entering...' : 'Enter the Dojo'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-parchment/70 border-t border-gold/25 pt-4">
            New disciple?{' '}
            <Link
              to="/register"
              className="font-bold text-gold hover:text-gold-light hover:underline uppercase tracking-wide"
            >
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
