import React, { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  type AdminAiStatus,
  type AdminDaily,
  type AdminPuzzleDetail,
  type AdminPuzzleSummary,
} from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

const DIFFS = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

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
  const [aiStatus, setAiStatus] = useState<AdminAiStatus | null>(null);
  const [aiDiff, setAiDiff] = useState<string>('MEDIUM');
  const [aiCount, setAiCount] = useState(5);

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

  const loadAiStatus = useCallback(async () => {
    try {
      setAiStatus(await adminApi.aiStatus());
    } catch {
      setAiStatus(null);
    }
  }, []);

  useEffect(() => {
    void load('', 0);
    void loadDaily();
    void loadAiStatus();
  }, [load, loadDaily, loadAiStatus]);

  const generate = async (d: string) => {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const p = await adminApi.generatePuzzle(d);
      setMsg(
        `Generated ${p.difficulty} puzzle (${p.validWordCount} dictionary words, ${p.pangramCount} pangrams)`
      );
      await load(difficulty, 0);
      await loadAiStatus();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Generate failed');
    } finally {
      setBusy(false);
    }
  };

  const generateAi = async () => {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const r = await adminApi.generatePuzzlesWithAi(aiDiff, aiCount);
      const rejectHint =
        r.rejected?.length > 0 ? ` Rejects: ${r.rejected.slice(0, 3).join(' | ')}` : '';
      setMsg(
        `AI batch ${r.batchId}: created ${r.created}/${r.requested} ${r.difficulty}` +
          (r.groqUsed ? ' (Groq letter sets + dictionary expand)' : ' (local dictionary search)') +
          rejectHint
      );
      await load(difficulty, 0);
      await loadAiStatus();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'AI generate failed');
    } finally {
      setBusy(false);
    }
  };

  const dictReady = aiStatus?.dictionaryReady ?? false;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Puzzles</h2>
      {daily && (
        <div className="rounded border border-amber-700/40 bg-[#2a211a] p-3 text-sm">
          Today&apos;s daily: <span className="font-mono">{daily.puzzleId}</span> ({daily.difficulty}){' '}
          letters {daily.letters?.join('')} center {daily.centerLetter}
        </div>
      )}

      {aiStatus && (
        <div className="rounded border border-amber-700/40 bg-[#2a211a] p-3 text-sm space-y-1">
          <p>
            Dictionary:{' '}
            <strong className={dictReady ? 'text-green-400' : 'text-red-400'}>
              {aiStatus.dictionaryAllowedCount.toLocaleString()}
            </strong>{' '}
            allowed words (need ≥ {aiStatus.minDictionaryWords.toLocaleString()} for generation)
          </p>
          <p className="text-amber-100/70">
            Groq: {aiStatus.groqConfigured ? `configured (${aiStatus.model})` : 'not configured — set GROQ_API_KEY'}
          </p>
          <p className="text-xs text-amber-100/50">
            Gates: {aiStatus.easyGate} · {aiStatus.mediumGate} · {aiStatus.hardGate} ·{' '}
            {aiStatus.expertGate}
          </p>
          {!dictReady && (
            <p className="text-amber-300 text-xs">
              Import the English dictionary under Admin → Dictionary before generating.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            void load(e.target.value, 0);
          }}
          className="rounded border border-amber-700/50 bg-[#1a1410] px-2 py-2 text-sm"
        >
          <option value="">All difficulties</option>
          {DIFFS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {DIFFS.map((d) => (
          <Button key={d} disabled={busy || !dictReady} onClick={() => void generate(d)}>
            Generate {d}
          </Button>
        ))}
      </div>

      <div className="rounded border border-amber-700/40 bg-[#1f1812] p-3 space-y-2">
        <h3 className="text-sm font-semibold text-amber-200">Generate with AI (Groq)</h3>
        <p className="text-xs text-amber-100/60">
          Groq proposes letter hives; every word is expanded and validated against the open-source
          dictionary (min length 4). Gameplay never calls the LLM.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={aiDiff}
            onChange={(e) => setAiDiff(e.target.value)}
            className="rounded border border-amber-700/50 bg-[#1a1410] px-2 py-2 text-sm"
          >
            {DIFFS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="text-sm text-amber-100/80 flex items-center gap-2">
            Count
            <input
              type="number"
              min={1}
              max={20}
              value={aiCount}
              onChange={(e) => setAiCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-16 rounded border border-amber-700/50 bg-[#1a1410] px-2 py-1 text-sm"
            />
          </label>
          <Button disabled={busy || !dictReady} onClick={() => void generateAi()}>
            {busy ? 'Generating…' : 'Generate with AI'}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <div className="overflow-x-auto rounded-lg border border-amber-700/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a211a] text-amber-400/80">
            <tr>
              <th className="p-2">Id</th>
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
                <td className="p-2 font-mono text-amber-100">{p.id}</td>
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
