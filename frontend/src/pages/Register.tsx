import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, registerUser } from '../store/authSlice';
import { validateRegisterForm } from '../constants/authValidation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    userName?: string;
    userEmail?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector((s) => s.auth.loading);
  const authError = useAppSelector((s) => s.auth.error);

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setFieldErrors({});

    const client = validateRegisterForm(username, email, password, confirmPassword);
    if (!client.ok) {
      setFieldErrors(client.fieldErrors);
      return;
    }

    const result = await dispatch(
      registerUser({
        userName: username.trim(),
        userEmail: email.trim().toLowerCase(),
        password,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      navigate('/login', {
        replace: true,
        state: {
          registered: true,
          email: result.payload.user.userEmail,
        },
      });
      return;
    }

    if (registerUser.rejected.match(result)) {
      const payload = result.payload as
        | { message?: string; fieldErrors?: Record<string, string>; status?: number }
        | undefined;
      if (payload?.fieldErrors) {
        setFieldErrors({
          userName: payload.fieldErrors.userName,
          userEmail: payload.fieldErrors.userEmail,
          password: payload.fieldErrors.password,
        });
      }
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50';

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 bg-jade text-parchment py-10"
      style={{
        backgroundImage: `url('/assets/background/login_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-jade-dark/50 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md my-8">
        <Card variant="wood" className="border-2 border-gold shadow-2xl">
          <h3 className="text-xl font-bold tracking-widest text-center text-gold mb-6 uppercase font-martial">
            Disciple Registry
          </h3>

          {authError && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-950/80 border border-red-500/50 p-3 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reg-username"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Disciple Name (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((f) => ({ ...f, userName: undefined }));
                  }}
                  placeholder="Young_Panda"
                  className={fieldClass}
                />
              </div>
              {fieldErrors.userName && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.userName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Scroll Address (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((f) => ({ ...f, userEmail: undefined }));
                  }}
                  placeholder="name@academy.com"
                  className={fieldClass}
                />
              </div>
              {fieldErrors.userEmail && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.userEmail}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Secret Phrase (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={fieldClass}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5"
              >
                Verify Secret Phrase
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFieldErrors((f) => ({ ...f, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className={fieldClass}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-300">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={loading} className="mt-6">
              {loading ? 'Registering...' : 'Begin Training'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-parchment/70 border-t border-gold/25 pt-4">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-bold text-gold hover:text-gold-light hover:underline uppercase tracking-wide"
            >
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
