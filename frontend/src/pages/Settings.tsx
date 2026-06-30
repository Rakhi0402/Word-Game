import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleDarkMode, toggleSound, resetSettings } from '../store/settingsSlice';
import { logout } from '../store/authSlice';
import { resetUser } from '../store/userSlice';
import { resetCards } from '../store/cardsSlice';
import { resetAchievements } from '../store/achievementsSlice';
import { resetLeaderboard } from '../store/leaderboardSlice';
import { resetPuzzleState } from '../store/puzzleSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { playSound } from '../utils/audio';
import { 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  LogOut, 
  RotateCcw, 
  ShieldAlert, 
  Settings as SettingsIcon 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const soundEnabled = useAppSelector(state => state.settings.sound);

  const handleLogout = () => {
    playSound.click(soundEnabled);
    dispatch(logout());
  };

  const handleResetProgress = () => {
    const confirmReset = window.confirm(
      "WARNING: This will wipe all your kung fu belt progress, unlocked cards, solved puzzles, and leaderboard rankings. Are you sure you want to restart your training?"
    );

    if (confirmReset) {
      playSound.failure(soundEnabled);
      // Reset all slices
      dispatch(resetUser());
      dispatch(resetCards());
      dispatch(resetAchievements());
      dispatch(resetLeaderboard());
      dispatch(resetPuzzleState());
      dispatch(resetSettings());
      alert("All training scrolls and belt progress have been reset to White Belt!");
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      
      {/* Title Header */}
      <div className="border-b border-gold/25 pb-4">
        <h2 className="text-3xl font-extrabold text-black text-gold-glow dark:text-[#f7d36b] uppercase font-martial tracking-wider">
          Gear & Preferences
        </h2>
        <p className="text-sm text-jade-dark/70 dark:text-parchment/70  dark:text-gold font-medium">
          Configure game sounds, visual appearance, and account options.
        </p>
      </div>

      {/* Settings Options Card */}
      <Card variant="wood" className="border border-gold/20 shadow-xl space-y-6">
        <h3 className="text-lg font-bold tracking-widest text-gold uppercase border-b border-gold/15 pb-2 font-martial flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-gold" /> System Config
        </h3>

        <div className="divide-y divide-gold/10 space-y-4">
          
          {/* Visual Appearance / Dark Mode */}
          <div className="flex items-center justify-between pt-1">
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

          {/* Sound Control */}
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

          {/* Account Logout */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="font-bold text-sm tracking-wide text-parchment">Leave Dojo</h4>
              <p className="text-[10px] text-parchment/50">Log out of the current training session.</p>
            </div>
            <Button
              variant="danger"
              onClick={handleLogout}
              className="px-4 py-2 flex items-center space-x-1.5"
            >
              <LogOut className="h-4 w-4" /> <span>Exit Dojo</span>
            </Button>
          </div>

        </div>
      </Card>

      {/* Danger Zone Card */}
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
              Resetting progress will permanently erase your belt ratings, XP levels, collected scroll cards, and high scores. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={handleResetProgress}
              className="border-red-500 text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
              size="sm"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset All Progress
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
};
export default Settings;
