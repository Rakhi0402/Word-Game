import React, { useEffect, useState } from 'react';
import { adminApi, type DictionaryImportResult } from '../../services/adminApi';
import { ApiClientError } from '../../types/auth';
import { Button } from '../../components/ui/Button';

export const AdminDictionaryPage: React.FC = () => {
  const [allowed, setAllowed] = useState<number | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [result, setResult] = useState<DictionaryImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const s = await adminApi.dictionaryStats();
      setAllowed(s.dictionaryAllowedCount);
      setVersion(s.dictionarySourceVersion);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load stats');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runImport = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await adminApi.importDictionary();
      setResult(r);
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-amber-200">Dictionary</h2>
      <div className="rounded border border-amber-700/40 bg-[#2a211a] p-4 text-sm">
        <p>
          Allowed words: <strong>{allowed ?? '…'}</strong>
        </p>
        <p className="mt-1 text-amber-100/70">Source version: {version ?? '—'}</p>
      </div>
      <Button disabled={busy} onClick={() => void runImport()}>
        {busy ? 'Importing…' : 'Import from configured path'}
      </Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <pre className="overflow-x-auto rounded border border-amber-800/40 bg-[#1a1410] p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};
