import React, { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, type DictionaryImportProgress } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

export const AdminDictionaryPage: React.FC = () => {
  const [allowed, setAllowed] = useState<number | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<DictionaryImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await adminApi.dictionaryStats();
      setAllowed(s.dictionaryAllowedCount);
      setVersion(s.dictionarySourceVersion);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load stats');
    }
  }, []);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = useCallback(async () => {
    try {
      const p = await adminApi.importDictionaryStatus();
      setProgress(p);
      setAllowed(p.allowedCount);
      if (p.status === 'COMPLETED' || p.status === 'FAILED' || p.status === 'IDLE') {
        setBusy(p.status === 'RUNNING');
        if (p.status !== 'RUNNING') {
          stopPoll();
          setBusy(false);
          await load();
        }
      } else if (p.status === 'RUNNING') {
        setBusy(true);
      }
    } catch {
      // keep polling
    }
  }, [load]);

  useEffect(() => {
    void load();
    void pollStatus();
    return () => stopPoll();
  }, [load, pollStatus]);

  const runImport = async () => {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const started = await adminApi.importDictionary();
      setProgress(started);
      stopPoll();
      pollRef.current = setInterval(() => {
        void pollStatus();
      }, 1000);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Import failed');
      setBusy(false);
    }
  };

  const pct =
    progress && progress.processed > 0
      ? Math.min(99, Math.round((progress.accepted / Math.max(progress.processed, 1)) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Dictionary</h2>
      <div className="rounded border border-amber-700/40 bg-[#2a211a] p-4 text-sm space-y-2">
        <p>
          Allowed words: <strong>{allowed ?? '…'}</strong>
        </p>
        <p className="text-amber-100/70">Source version: {version ?? '—'}</p>
        <p className="text-xs text-amber-100/50">
          Open-source English lexicon (ESDB/SCOWL). Import runs in the background in chunks of
          1,000 words (not one giant request). Polling shows live progress — the UI will not hang.
        </p>
        {(allowed === 0 || (allowed != null && allowed < 1000)) && (
          <p className="text-amber-300 text-xs">
            Dictionary is too small for quality generation. Start import and wait until the count
            reaches at least 1,000 (full wordlist is much larger).
          </p>
        )}
      </div>
      <Button disabled={busy} onClick={() => void runImport()}>
        {busy ? 'Importing…' : 'Import from configured path'}
      </Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {progress && (
        <div className="rounded border border-amber-700/40 bg-[#1a1410] p-3 text-sm space-y-2">
          <p>
            Status: <strong className="text-amber-200">{progress.status}</strong>
            {progress.message ? ` — ${progress.message}` : ''}
          </p>
          <p className="text-xs text-amber-100/70">
            Processed {progress.processed.toLocaleString()} · Accepted{' '}
            {progress.accepted.toLocaleString()} · Rejected {progress.rejected.toLocaleString()} ·
            In DB {progress.allowedCount.toLocaleString()}
          </p>
          {progress.status === 'RUNNING' && (
            <div className="h-2 w-full overflow-hidden rounded bg-amber-950">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(5, pct)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
