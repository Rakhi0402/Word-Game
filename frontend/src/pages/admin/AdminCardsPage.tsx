import React, { useEffect, useState } from 'react';
import { adminApi, type AdminCard } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

const empty: AdminCard = {
  id: '',
  name: '',
  rarity: 'common',
  image: '/assets/card_pack/po_common.png',
  stars: 1,
  description: '',
  bonuses: [],
};

export const AdminCardsPage: React.FC = () => {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [form, setForm] = useState<AdminCard>(empty);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      setCards(await adminApi.listCards());
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load cards');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setError(null);
    setMsg(null);
    try {
      const payload: AdminCard = {
        ...form,
        bonuses: (form.bonuses || []).map((s) => s.trim()).filter(Boolean),
      };
      if (editing) {
        await adminApi.updateCard(form.id, payload);
        setMsg('Card updated');
      } else {
        await adminApi.createCard(payload);
        setMsg('Card created');
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
      <h2 className="text-2xl font-bold text-amber-200">Cards</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded border border-amber-700/40 bg-[#2a211a] p-4">
          <h3 className="font-semibold">{editing ? 'Edit card' : 'Create card'}</h3>
          {(
            [
              ['id', 'ID'],
              ['name', 'Name'],
              ['rarity', 'Rarity'],
              ['image', 'Image path'],
              ['description', 'Description'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs">
              {label}
              <input
                disabled={editing && key === 'id'}
                className="mt-1 w-full rounded border border-amber-800/50 bg-[#1a1410] px-2 py-1 text-sm"
                value={String(form[key] ?? '')}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-xs">
            Stars
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded border border-amber-800/50 bg-[#1a1410] px-2 py-1 text-sm"
              value={form.stars}
              onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })}
            />
          </label>
          <label className="block text-xs">
            Bonuses (one per line)
            <textarea
              className="mt-1 w-full rounded border border-amber-800/50 bg-[#1a1410] px-2 py-1 text-sm"
              rows={3}
              value={(form.bonuses || []).join('\n')}
              onChange={(e) =>
                setForm({
                  ...form,
                  bonuses: e.target.value.split('\n'),
                })
              }
            />
          </label>
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
                <th className="p-2">Name</th>
                <th className="p-2">★</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-t border-amber-800/30">
                  <td className="p-2 font-mono text-xs">{c.id}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.stars}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-xs text-amber-300"
                      onClick={() => {
                        setForm({ ...c, bonuses: c.bonuses || [] });
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
