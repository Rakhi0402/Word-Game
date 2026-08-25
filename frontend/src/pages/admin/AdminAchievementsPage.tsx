import React, { useEffect, useState } from 'react';
import { adminApi, type AdminAchievement } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

const empty: AdminAchievement = {
  id: '',
  title: '',
  description: '',
  target: 1,
  rewardXp: 0,
  rewardCoins: 0,
  iconName: '',
};

export const AdminAchievementsPage: React.FC = () => {
  const [items, setItems] = useState<AdminAchievement[]>([]);
  const [form, setForm] = useState<AdminAchievement>(empty);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems(await adminApi.listAchievements());
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setError(null);
    setMsg(null);
    try {
      if (editing) {
        await adminApi.updateAchievement(form.id, form);
        setMsg('Updated');
      } else {
        await adminApi.createAchievement(form);
        setMsg('Created');
      }
      setForm(empty);
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Save failed');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Achievements</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded border border-amber-700/40 bg-[#2a211a] p-4">
          <h3 className="font-semibold">{editing ? 'Edit' : 'Create'}</h3>
          {(['id', 'title', 'description', 'iconName'] as const).map((key) => (
            <label key={key} className="block text-xs">
              {key}
              <input
                disabled={editing && key === 'id'}
                className="mt-1 w-full rounded border border-amber-800/50 bg-[#1a1410] px-2 py-1 text-sm"
                value={String(form[key] ?? '')}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          {(['target', 'rewardXp', 'rewardCoins'] as const).map((key) => (
            <label key={key} className="block text-xs">
              {key}
              <input
                type="number"
                className="mt-1 w-full rounded border border-amber-800/50 bg-[#1a1410] px-2 py-1 text-sm"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => void save()}>{editing ? 'Update' : 'Create'}</Button>
            {editing && (
              <Button
                onClick={() => {
                  setEditing(false);
                  setForm(empty);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded border border-amber-700/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#2a211a] text-amber-400/80">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Target</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-amber-800/30">
                  <td className="p-2 font-mono text-xs">{a.id}</td>
                  <td className="p-2">{a.title}</td>
                  <td className="p-2">{a.target}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-xs text-amber-300"
                      onClick={() => {
                        setForm(a);
                        setEditing(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
