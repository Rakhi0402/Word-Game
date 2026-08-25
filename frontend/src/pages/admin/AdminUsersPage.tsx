import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, type AdminUserSummary } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

export const AdminUsersPage: React.FC = () => {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search: string, p: number) => {
    setError(null);
    try {
      const res = await adminApi.listUsers(search, p, 20);
      setUsers(res.content);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load users');
    }
  }, []);

  useEffect(() => {
    void load('', 0);
  }, [load]);

  const patch = async (
    id: string,
    body: { role?: string; enabled?: boolean; locked?: boolean }
  ) => {
    setBusyId(id);
    try {
      await adminApi.patchUser(id, body);
      await load(q, page);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Users</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q, 0);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username or email"
          className="flex-1 rounded border border-amber-700/50 bg-[#1a1410] px-3 py-2 text-sm"
        />
        <Button type="submit">Search</Button>
      </form>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-amber-700/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a211a] text-amber-400/80">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Role</th>
              <th className="p-2">XP</th>
              <th className="p-2">Flags</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-amber-800/30">
                <td className="p-2">
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-amber-100/50">{u.email}</div>
                </td>
                <td className="p-2 font-mono text-xs">{u.role}</td>
                <td className="p-2">{u.xp}</td>
                <td className="p-2 text-xs">
                  {!u.enabled && <span className="text-red-400">disabled </span>}
                  {u.locked && <span className="text-orange-400">locked</span>}
                  {u.enabled && !u.locked && <span className="text-green-500/80">ok</span>}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      className="rounded bg-amber-800/40 px-2 py-1 text-xs hover:bg-amber-700/50"
                      onClick={() =>
                        void patch(u.id, {
                          role: u.role.includes('ADMIN') ? 'ROLE_USER' : 'ROLE_ADMIN',
                        })
                      }
                    >
                      {u.role.includes('ADMIN') ? 'Demote' : 'Promote'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      className="rounded bg-amber-800/40 px-2 py-1 text-xs hover:bg-amber-700/50"
                      onClick={() => void patch(u.id, { enabled: !u.enabled })}
                    >
                      {u.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      className="rounded bg-amber-800/40 px-2 py-1 text-xs hover:bg-amber-700/50"
                      onClick={() => void patch(u.id, { locked: !u.locked })}
                    >
                      {u.locked ? 'Unlock' : 'Lock'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 text-sm">
        <Button disabled={page <= 0} onClick={() => void load(q, page - 1)}>
          Prev
        </Button>
        <span className="py-2 text-amber-100/60">
          Page {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button disabled={page + 1 >= totalPages} onClick={() => void load(q, page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};
