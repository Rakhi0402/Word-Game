import React, { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  type AdminDaily,
  type AdminPuzzleDetail,
  type AdminPuzzleSummary,
} from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

export const AdminPuzzlesPage: React.FC = () => {
  const [difficulty, setDifficulty] = useState('');
  const [puzzles, setPuzzles] = useState<AdminPuzzleSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [daily, setDaily] = useState<AdminDaily | null>(null);
  const [detail, setDetail] = useState<AdminPuzzleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (diff: string, p: number) => {
    setError(null);
    try {
      const res = await adminApi.listPuzzles(diff || undefined, p, 15);
      setPuzzles(res.content);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load puzzles');
    }
  }, []);

  const loadDaily = useCallback(async () => {
    try {
      setDaily(await adminApi.getDaily());
    } catch {
      setDaily(null);
    }
  }, []);

  useEffect(() => {
    void load('', 0);
    void loadDaily();
  }, [load, loadDaily]);

  const generate = async (d: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const p = await adminApi.generatePuzzle(d);
      setMsg(`Generated ${p.difficulty} puzzle ${p.id}`);
      await load(difficulty, 0);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Generate failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Puzzles</h2>
      {daily && (
        <div className="rounded border border-amber-700/40 bg-[#2a211a] p-3 text-sm">
          Today&apos;s daily: <span className="font-mono">{daily.puzzleId}</span> ({daily.difficulty}){' '}
          letters {daily.letters?.join('')} center {daily.centerLetter}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            void load(e.target.value, 0);
          }}
          className="rounded border border-amber-700/50 bg-[#1a1410] px-2 py-2 text-sm"
        >
          <option value="">All difficulties</option>
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
          <option value="EXPERT">EXPERT</option>
        </select>
        {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const).map((d) => (
          <Button key={d} disabled={busy} onClick={() => void generate(d)}>
            Generate {d}
          </Button>
        ))}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-amber-700/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a211a] text-amber-400/80">
            <tr>
              <th className="p-2">Diff</th>
              <th className="p-2">Letters</th>
              <th className="p-2">Words</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {puzzles.map((p) => (
              <tr key={p.id} className="border-t border-amber-800/30">
                <td className="p-2">{p.difficulty}</td>
                <td className="p-2 font-mono text-xs">
                  {p.letters?.join('')} / {p.centerLetter}
                </td>
                <td className="p-2">
                  {p.validWordCount} (target {p.targetWordCount}, {p.pangramCount} pangrams)
                </td>
                <td className="p-2">{p.active ? 'yes' : 'no'}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded bg-amber-800/40 px-2 py-1 text-xs"
                      onClick={() =>
                        void adminApi.getPuzzle(p.id).then(setDetail).catch((e) =>
                          setError(e instanceof ApiClientError ? e.message : 'Load failed')
                        )
                      }
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      className="rounded bg-amber-800/40 px-2 py-1 text-xs"
                      onClick={() =>
                        void adminApi
                          .setPuzzleActive(p.id, !p.active)
                          .then(() => load(difficulty, page))
                      }
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="rounded bg-amber-700/50 px-2 py-1 text-xs"
                      onClick={() =>
                        void adminApi
                          .assignDaily(p.id)
                          .then((d) => {
                            setDaily(d);
                            setMsg(`Assigned daily → ${d.puzzleId}`);
                          })
                          .catch((e) =>
                            setError(e instanceof ApiClientError ? e.message : 'Assign failed')
                          )
                      }
                    >
                      Set daily
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 text-sm">
        <Button disabled={page <= 0} onClick={() => void load(difficulty, page - 1)}>
          Prev
        </Button>
        <span className="py-2 text-amber-100/60">
          Page {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button
          disabled={page + 1 >= totalPages}
          onClick={() => void load(difficulty, page + 1)}
        >
          Next
        </Button>
      </div>
      {detail && (
        <div className="rounded border border-amber-700/40 bg-[#2a211a] p-4 text-sm">
          <div className="mb-2 flex justify-between">
            <h3 className="font-semibold text-amber-200">Puzzle {detail.id}</h3>
            <button type="button" className="text-xs text-amber-400" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <p className="text-xs text-amber-100/60 mb-2">
            Pangrams: {(detail.pangrams || []).join(', ') || '—'}
          </p>
          <p className="max-h-40 overflow-y-auto font-mono text-xs break-all">
            {(detail.validWords || []).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
