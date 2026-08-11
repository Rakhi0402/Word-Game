import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleDarkMode, toggleSound } from '../store/settingsSlice';
import { fetchCurrentUser, logoutUser } from '../store/authSlice';
import { setUserProfile } from '../store/userSlice';
import { clearSession, resetProgression } from '../store/session';
import { settingsService } from '../services/settingsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertDialogReset } from '../components/ui/AlertDialogReset';
import { playSound } from '../utils/audio';
import { ApiClientError } from '../types/auth';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  LogOut,
  RotateCcw,
  ShieldAlert,
  Settings as SettingsIcon,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector((state) => state.settings);
  const soundEnabled = useAppSelector((state) => state.settings.sound);
  const user = useAppSelector((state) => state.user);
  const auth = useAppSelector((state) => state.auth);

  const [accountName, setAccountName] = useState(auth.username || user.username);
  const [accountEmail, setAccountEmail] = useState(auth.email || user.email);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setAccountLoading(true);
      setAccountError(null);
      try {
        const result = await dispatch(fetchCurrentUser());
        if (cancelled) return;
        if (fetchCurrentUser.fulfilled.match(result)) {
          setAccountName(result.payload.userName);
          setAccountEmail(result.payload.userEmail);
          dispatch(
            setUserProfile({
              username: result.payload.userName,
              email: result.payload.userEmail,
            })
          );
          return;
        }
        // Fallback: direct GET /users/me if thunk rejected without clearing session
        try {
          const me = await settingsService.getCurrentUser();
          if (!cancelled) {
            setAccountName(me.userName);
            setAccountEmail(me.userEmail);
          }
        } catch (err) {
          if (!cancelled) {
            setAccountError(
              err instanceof ApiClientError
                ? err.message
                : 'Could not load account from server.'
            );
            setAccountName(auth.username || user.username);
            setAccountEmail(auth.email || user.email);
          }
        }
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, auth.username, auth.email, user.username, user.email]);

  const handleLogout = () => {
    if (loggingOut) return;
    playSound.click(soundEnabled);
    setLoggingOut(true);
    void dispatch(logoutUser())
      .finally(async () => {
        await clearSession(dispatch);
        setLoggingOut(false);
        navigate('/login', { replace: true });
      });
  };

  const handleResetProgress = async () => {
    if (resetting) return;
    playSound.failure(soundEnabled);
    setResetting(true);
    try {
      await resetProgression(dispatch);
    } catch (err) {
      setResetting(false);
      throw err instanceof ApiClientError
        ? err
        : new Error('Could not reset progress on the server.');
    }
    setResetting(false);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="border-b border-gold/25 pb-4">
        <h2 className="text-3xl font-extrabold text-black text-gold-glow dark:text-[#f7d36b] uppercase font-martial tracking-wider">
          Gear & Preferences
        </h2>
        <p className="text-sm text-jade-dark/70 dark:text-parchment/70  dark:text-gold font-medium">
          Configure game sounds, visual appearance, and account options.
        </p>
      </div>

      <Card variant="wood" className="border border-gold/20 shadow-xl space-y-6">
        <h3 className="text-lg font-bold tracking-widest text-gold uppercase border-b border-gold/15 pb-2 font-martial flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-gold" /> System Config
        </h3>

        <div className="divide-y divide-gold/10 space-y-4">
          {/* Account (read-only from backend) */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h4 className="font-bold text-sm tracking-wide text-parchment">Training Account</h4>
              <p className="text-[10px] text-parchment/50">
                {accountLoading
                  ? 'Loading account from server…'
                  : accountError
                    ? accountError
                    : 'Signed-in disciple identity from the server.'}
              </p>
              {!accountLoading && (
                <p className="mt-1 text-xs text-parchment/80">
                  <span className="font-bold text-gold">{accountName || '—'}</span>
                  {accountEmail ? (
                    <span className="text-parchment/50"> · {accountEmail}</span>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="font-bold text-sm tracking-wide text-parchment">Visual Mode</h4>
              <p className="text-[10px] text-parchment/50">Toggle dark temple colors or light parchment colors.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => dispatch(toggleDarkMode())}
              className="px-4 py-2 flex items-center space-x-1.5"
            >
              {settings.darkMode ? (
                <>
                  <Sun className="h-4 w-4" /> <span>Light Scroll</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" /> <span>Dark Scroll</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="font-bold text-sm tracking-wide text-parchment">Synth Audio FX</h4>
              <p className="text-[10px] text-parchment/50">Enable or disable synthesized click and chime sound effects.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => dispatch(toggleSound())}
              className="px-4 py-2 flex items-center space-x-1.5"
            >
              {settings.sound ? (
                <>
                  <Volume2 className="h-4 w-4 text-emerald-400" /> <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-red-400" /> <span>Sound Muted</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="font-bold text-sm tracking-wide text-parchment">Leave Dojo</h4>
              <p className="text-[10px] text-parchment/50">Log out of the current training session.</p>
            </div>
            <Button
              variant="danger"
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 flex items-center space-x-1.5"
            >
              <LogOut className="h-4 w-4" /> <span>{loggingOut ? 'Exiting…' : 'Exit Dojo'}</span>
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="parchment" className="border border-red-500/30 dark:bg-red-950/15 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-900 shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="text-sm font-extrabold text-red-700 dark:text-red-400 uppercase tracking-widest font-martial">
              Danger Zone
            </h4>
            <p className="text-xs text-jade-dark/70 dark:text-parchment/70 leading-relaxed">
              Resetting progress will permanently erase your belt ratings, XP levels, collected scroll cards, and high scores on the server. This action cannot be undone.
            </p>
            <AlertDialogReset
              busy={resetting}
              onConfirm={handleResetProgress}
              trigger={
                <Button
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                  size="sm"
                  disabled={resetting}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset All Progress
                </Button>
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
export default Settings;
