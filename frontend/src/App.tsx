import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { fetchCurrentUser } from './store/authSlice';
import { hydrateSession } from './store/session';
import { assetPreloader } from './utils/preloader';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/auth/AuthRoute';
import { AdminLayout } from './components/admin/AdminLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Puzzle } from './pages/Puzzle';
import { Collection } from './pages/Collection';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPuzzlesPage } from './pages/admin/AdminPuzzlesPage';
import { AdminCardsPage } from './pages/admin/AdminCardsPage';
import { AdminAchievementsPage } from './pages/admin/AdminAchievementsPage';
import { AdminDictionaryPage } from './pages/admin/AdminDictionaryPage';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [preloadingComplete, setPreloadingComplete] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    const startPreloading = async () => {
      try {
        await assetPreloader.preloadAll((percent: number) => {
          setLoadingPercent(percent);
        });
        setTimeout(() => setPreloadingComplete(true), 300);
      } catch (err) {
        console.error('Asset preloading encountered warnings', err);
        setPreloadingComplete(true);
      }
    };

    void startPreloading();
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      void dispatch(fetchCurrentUser());
      void hydrateSession(dispatch);
    }
  }, [dispatch, isAuthenticated, accessToken]);

  if (!preloadingComplete) {
    return <LoadingSpinner progress={loadingPercent} />;
  }

  return (
    <BrowserRouter>
      <Routes>
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

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="puzzle" element={<Puzzle />} />
          <Route path="collection" element={<Collection />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="puzzles" element={<AdminPuzzlesPage />} />
          <Route path="cards" element={<AdminCardsPage />} />
          <Route path="achievements" element={<AdminAchievementsPage />} />
          <Route path="dictionary" element={<AdminDictionaryPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
