import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store';
import { assetPreloader } from './utils/preloader';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, PublicRoute } from './components/auth/AuthRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Puzzle } from './pages/Puzzle';
import { Collection } from './pages/Collection';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [preloadingComplete, setPreloadingComplete] = useState(false);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  // Trigger preloading of background images and character card pack images
  useEffect(() => {
    const startPreloading = async () => {
      try {
        await assetPreloader.preloadAll((percent: number) => {
          setLoadingPercent(percent);
        });
        // Tiny artificial pause for visual ease
        setTimeout(() => {
          setPreloadingComplete(true);
        }, 300);
      } catch (err) {
        console.error("Asset preloading encountered warnings", err);
        setPreloadingComplete(true);
      }
    };

    startPreloading();
  }, []);

  if (!preloadingComplete) {
    return <LoadingSpinner progress={loadingPercent} />;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Public auth pages */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Authenticated layout pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default path redirects to Dojo dashboard */}
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="puzzle" element={<Puzzle />} />
          <Route path="collection" element={<Collection />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback redirects */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
