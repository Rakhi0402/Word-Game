import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  clearWord,
  shuffleLetters,
  selectLetter,
} from '../../store/puzzleSlice';
import { MAX_WORD_INPUT_LENGTH } from '../../constants/rewards';

import { Button } from '../ui/Button';
import { LetterWheel } from './LetterWheel';

import {
  Trash2,
  RotateCw,
  Check,
  Info,
  Lightbulb,
} from 'lucide-react';

const FEEDBACK_MS = 1800;

interface PuzzleInputProps {
  disabled: boolean;
  isDailySession?: boolean;
  onSubmit: () => Promise<string | false> | string | false;
  onHint: () => void;
}

export interface PuzzleInputHandle {
  submit: () => Promise<void>;
}

export const PuzzleInput = forwardRef<PuzzleInputHandle, PuzzleInputProps>(
  ({ disabled, isDailySession = true, onSubmit, onHint }, ref) => {
    const dispatch = useAppDispatch();
    const puzzle = useAppSelector((state) => state.puzzle);
    const [feedback, setFeedback] = useState<{
      tone: 'success' | 'error' | 'warning';
      message: string;
    } | null>(null);
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wordScrollRef = useRef<HTMLDivElement>(null);

    const showFeedback = (
      next: { tone: 'success' | 'error' | 'warning'; message: string } | null
    ) => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setFeedback(next);
      if (next) {
        clearTimerRef.current = setTimeout(() => {
          setFeedback(null);
          clearTimerRef.current = null;
        }, FEEDBACK_MS);
      }
    };

    useEffect(() => {
      return () => {
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      };
    }, []);

    useEffect(() => {
      if (puzzle.currentWord.length > 0) {
        if (clearTimerRef.current) {
          clearTimeout(clearTimerRef.current);
          clearTimerRef.current = null;
        }
        setFeedback(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puzzle.currentWord]);

    useEffect(() => {
      const el = wordScrollRef.current;
      if (el) {
        el.scrollLeft = el.scrollWidth;
        // #region agent log
        fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '156feb',
          },
          body: JSON.stringify({
            sessionId: '156feb',
            runId: 'ui-fix',
            hypothesisId: 'H1',
            location: 'puzzleInput.tsx:wordScroll',
            message: 'current word length + scroll metrics',
            data: {
              len: puzzle.currentWord.length,
              max: MAX_WORD_INPUT_LENGTH,
              atMax: puzzle.currentWord.length >= MAX_WORD_INPUT_LENGTH,
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              overflowX: el.scrollWidth > el.clientWidth,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
    }, [puzzle.currentWord]);
    const atMaxLength = puzzle.currentWord.length >= MAX_WORD_INPUT_LENGTH;

    const handleLetterClick = (letter: string) => {
      if (disabled || atMaxLength) return;
      showFeedback(null);
      dispatch(selectLetter(letter));
    };

    const handleSubmit = async () => {
      if (disabled || !puzzle.currentWord.trim()) return;

      // #region agent log
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '156feb',
        },
        body: JSON.stringify({
          sessionId: '156feb',
          runId: 'post-fix',
          hypothesisId: 'H1',
          location: 'puzzleInput.tsx:handleSubmit',
          message: 'unified submit path (click or keyboard)',
          data: { wordLen: puzzle.currentWord.length, word: puzzle.currentWord },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const result = await onSubmit();

      // #region agent log
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '156feb',
        },
        body: JSON.stringify({
          sessionId: '156feb',
          runId: 'post-fix',
          hypothesisId: 'H1',
          location: 'puzzleInput.tsx:handleSubmit-result',
          message: 'unified submit result → feedback',
          data: { result },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (result === false) {
        showFeedback({ tone: 'error', message: 'Could not submit' });
        return;
      }

      if (typeof result === 'string') {
        if (result === 'valid') {
          showFeedback({ tone: 'success', message: '✓ Valid Word' });
        } else {
          showFeedback({
            tone: result === 'Already Found' ? 'warning' : 'error',
            message: result,
          });
        }
        return;
      }

      showFeedback({ tone: 'success', message: '✓ Valid Word' });
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div className="space-y-5">
        <div
          className={`mx-auto w-full max-w-md rounded-xl border-2 p-4 text-center transition-all duration-300 ${
            puzzle.lastRejectedReason === 'duplicate'
              ? 'border-red-400 bg-red-500/20 shadow-[0_0_0_2px_rgba(248,113,113,0.35)] animate-pulse'
              : 'border-gold bg-jade'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs uppercase tracking-widest text-parchment/70">Current Word</h3>
            <span className="font-mono text-[10px] text-parchment/50">
              {puzzle.currentWord.length}/{MAX_WORD_INPUT_LENGTH}
            </span>
          </div>
          <div
            ref={wordScrollRef}
            className="mt-2 w-full overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:thin]"
          >
            <p className="inline-block min-w-full whitespace-nowrap px-1 text-3xl font-black uppercase tracking-[0.35em] text-parchment">
              {puzzle.currentWord || '____'}
            </p>
          </div>
          {atMaxLength && !disabled && (
            <p className="mt-2 text-[11px] text-amber-300">Max length reached</p>
          )}
        </div>

        <LetterWheel
          centerLetter={puzzle.centerLetter}
          outerLetters={puzzle.outerLetters}
          onLetterSelect={handleLetterClick}
          disabled={disabled || atMaxLength}
        />

        <div className="flex flex-wrap justify-center gap-3">
          <div className="group relative">
            <Button variant="danger" disabled={disabled} onClick={() => dispatch(clearWord())}>
              <Trash2 className="h-5 w-5" />
            </Button>
            <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
              <div className="font-semibold">Clear Word</div>
              <div className="mt-1 text-gold">
                Shortcut: <kbd className="rounded bg-black/20 px-1">Esc</kbd>
              </div>
            </div>
          </div>

          <div className="group relative">
            <Button
              variant="primary"
              disabled={disabled}
              onClick={() => dispatch(shuffleLetters())}
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
              <div className="font-semibold">Shuffle Letters</div>
              <div className="mt-1 text-gold">
                Shortcut: <kbd className="rounded bg-black/20 px-1">R</kbd>
              </div>
            </div>
          </div>

          <div className="group relative">
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => {
                showFeedback(null);
                onHint();
              }}
            >
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
              Hint
            </Button>
            <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
              <div className="font-semibold">Reveal Hint</div>
              <div className="mt-1 text-gold">
                Shortcut: <kbd className="rounded bg-black/20 px-1">H</kbd>
              </div>
            </div>
          </div>

          <div className="group relative">
            <Button
              variant="primary"
              disabled={disabled}
              onClick={() => void handleSubmit()}
              className="px-8"
            >
              <Check className="mr-2 h-5 w-5" />
              Submit
            </Button>
            <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
              <div className="font-semibold">Submit Word</div>
              <div className="mt-1 text-gold">
                Shortcut: <kbd className="rounded bg-black/20 px-1">Enter</kbd>
              </div>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              feedback.tone === 'success'
                ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300'
                : feedback.tone === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
            } ${feedback.message === 'Already Found' ? 'animate-pulse' : ''}`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 rounded-lg border border-gold/15 bg-jade/55 px-4 py-2 text-xs text-white dark:text-gray-300">
          <Info size={14} className="text-gold" />
          <span>
            Click letters or use your keyboard (A–Z). Hover over the controls to see their keyboard
            shortcuts.
          </span>
        </div>

        {disabled && (
          <div className="rounded-xl border border-green-500 bg-green-100 p-4 text-center dark:bg-green-900/20">
            <h4 className="font-bold text-green-700 dark:text-green-300">
              {isDailySession ? '✅ Daily Puzzle Completed' : '✅ Puzzle Completed'}
            </h4>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              {isDailySession
                ? 'Locked for today — your found words stay below. Come back tomorrow for a new daily.'
                : 'This trial is finished. Found words stay below.'}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PuzzleInput.displayName = 'PuzzleInput';

export default PuzzleInput;
