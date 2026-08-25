import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminOverview } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminApi
      .overview()
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiClientError ? e.message : 'Failed to load overview')
      );
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-amber-200/60">Loading…</p>;

  const cards = [
    { label: 'Users', value: data.userCount, to: '/admin/users' },
    { label: 'Admins', value: data.adminCount, to: '/admin/users' },
    { label: 'Puzzles', value: data.puzzleCount, to: '/admin/puzzles' },
    { label: 'Active puzzles', value: data.activePuzzleCount, to: '/admin/puzzles' },
    {
      label: 'Dictionary words',
      value: data.dictionaryAllowedCount,
      to: '/admin/dictionary',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-amber-200">Overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-lg border border-amber-700/40 bg-[#2a211a] p-4 hover:border-amber-500/60"
          >
            <p className="text-xs uppercase tracking-wide text-amber-400/70">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-amber-100">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-lg border border-amber-700/40 bg-[#2a211a] p-4 text-sm">
        <p>
          Today ({data.todayDailyDate}):{' '}
          {data.todayDailyPuzzleId ? (
            <span className="font-mono text-amber-200">{data.todayDailyPuzzleId}</span>
          ) : (
            <span className="text-amber-400/70">not assigned</span>
          )}
        </p>
        <p className="mt-1 text-amber-100/70">
          Dictionary version: {data.dictionarySourceVersion ?? '—'}
        </p>
      </div>
    </div>
  );
};
