import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Map routes to their high-res background images
  const getBackgroundImage = () => {
    switch (path) {
      case '/home':
        return '/assets/background/home_bg.png';
      case '/puzzle':
        return '/assets/background/puzzle_bg.jpg'; // Reuse home background or parchment
      case '/collection':
        return '/assets/background/card_coll_bg.jpeg';
      case '/leaderboard':
        return '/assets/background/leaderboard_bg.jpeg';
      case '/profile':
      case '/settings':
        return '/assets/background/achievements.jpeg';
      default:
        return '/assets/background/home_bg.png';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-parchment text-jade-dark dark:bg-jade-dark dark:text-parchment">
      {/* Top Navigation */}
      <TopBar />

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Navigation Sidebar (Desktop) / Bottom Bar (Mobile) */}
        <BottomNav />

        {/* Main Content Area with dynamic background image and theme filters */}
        <main 
          className="relative flex-1 px-4 py-6 pb-24 md:pb-6 overflow-y-auto"
          style={{
            backgroundImage: `url(${getBackgroundImage()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Transparent Overlay for legibility */}
          <div className="absolute inset-0 bg-parchment/35 dark:bg-jade-dark/65 z-0 transition-colors duration-300 pointer-events-none" />

          {/* Actual content container */}
          <div className="relative z-10 mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
