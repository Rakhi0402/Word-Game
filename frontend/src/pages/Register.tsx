import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { loginSuccess } from '../store/authSlice';
import { setUserProfile } from '../store/userSlice';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Secret phrases (passwords) do not match.');
      setLoading(false);
      return;
    }

    const res = await authService.register(username, email, password);

    if (res.success && res.data) {
      dispatch(loginSuccess({
        email: res.data.email,
        username: res.data.username,
        token: res.data.token
      }));
      dispatch(setUserProfile({
        username: res.data.username,
        email: res.data.email
      }));
      navigate('/home');
    } else {
      setError(res.message || 'Registration failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="group relative flex min-h-screen items-center justify-center px-4 bg-jade text-parchment"
      style={{
        backgroundImage: `url('/assets/background/login_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-jade-dark/70 opacity-0 transition-opacity duration-300 pointer-events-none z-0 group-hover:opacity-100" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md mt-40 mb-8">
        
        {/* Title Logo */}
        <div className="text-center mb-6">
          
        </div>

        {/* Form Card */}
        <Card variant="wood" className="border-2 border-gold shadow-2xl">
          <h3 className="text-xl font-bold tracking-widest text-center text-gold mb-6 uppercase font-martial">
            Disciple Registry
          </h3>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-950/80 border border-red-500/50 p-3 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5">
                Disciple Name (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Young Panda"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5">
                Scroll Address (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@academy.com"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5">
                Secret Phrase (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gold/80 mb-1.5">
                Verify Secret Phrase
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gold/30 bg-jade-dark/40 py-2.5 pl-10 pr-4 text-sm text-parchment placeholder-parchment/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              className="mt-6"
            >
              {loading ? 'Registering...' : 'Begin Training'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-parchment/70 border-t border-gold/25 pt-4">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-gold hover:text-gold-light hover:underline uppercase tracking-wide">
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
