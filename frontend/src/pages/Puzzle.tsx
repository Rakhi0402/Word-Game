import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

import { useAppDispatch, useAppSelector, store } from '../store';
import {
  loadPuzzle,
  selectLetter,
  deleteLetter,
  clearWord,
  shuffleLetters,
  resetPuzzleState,
} from '../store/puzzleSlice';
import { refreshDailyHints, resetPuzzleHintCounters } from '../store/cardsSlice';
import {
  clearBonusFreeHintsNextDay,
  incrementChoicePuzzlesToday,
  setLastPuzzleMeta,
  syncChoicePuzzlesDay,
} from '../store/userSlice';

import { puzzleService } from '../services/puzzleService';
import { todayKey } from '../services/cache/cacheKeys';
import type { PuzzleDifficulty } from '../types';
import { MAX_CHOICE_PUZZLES_PER_DAY } from '../constants/rewards';

import { DifficultySelect } from '../components/puzzle/DifficultySelect';
import { PuzzleHeader } from '../components/puzzle/puzzleHeader';
import { PuzzleInput, type PuzzleInputHandle } from '../components/puzzle/puzzleInput';
import { PuzzleStats } from '../components/puzzle/puzzleStats';
import { FoundWords } from '../components/puzzle/FoundWords';
import { GameRules } from '../components/puzzle/GameRules';
import { CompletionModal } from '../components/puzzle/CompletionModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

import { usePuzzleKeyboard } from '../hooks/usePuzzleKeyboard';
import usePuzzleSubmission from '../hooks/usePuzzleSubmission';
import usePuzzleHints from '../hooks/usePuzzleHints';
import usePuzzleCompletion from '../hooks/usePuzzleCompletion';

type Screen = 'loading' | 'choice' | 'quota_done' | 'play';
type AsidePanel = 'none' | 'stats' | 'rules';

export const Puzzle: React.FC = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const user = useAppSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>('loading');
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [initDone, setInitDone] = useState(false);
  const [asidePanel, setAsidePanel] = useState<AsidePanel>('none');
  const puzzleInputRef = useRef<PuzzleInputHandle>(null);

  const toggleAside = (panel: Exclude<AsidePanel, 'none'>) => {
    setAsidePanel((prev) => (prev === panel ? 'none' : panel));
  };

  const liveChoiceRemaining = Math.max(
    0,
    MAX_CHOICE_PUZZLES_PER_DAY -
      (user.choicePuzzlesDate === todayKey() ? user.choicePuzzlesCompletedToday : 0)
  );

  useEffect(() => {
    dispatch(syncChoicePuzzlesDay(todayKey()));
    dispatch(
      refreshDailyHints({
        permanentExtra: user.permanentExtraDailyHint,
        bonusNextDay: user.bonusFreeHintsNextDay,
      })
    );
    if (user.bonusFreeHintsNextDay > 0) {
      dispatch(clearBonusFreeHintsNextDay(undefined));
    }
  }, [
    dispatch,
    user.permanentExtraDailyHint,
    user.bonusFreeHintsNextDay,
  ]);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        // Bypass stale IndexedDB so a fresh daily assignment is always seen.
        const dailyRes = await puzzleService.getDailyPuzzle({ force: true });
        if (!dailyRes.success || !dailyRes.data) {
          setScreen(liveChoiceRemaining > 0 ? 'choice' : 'quota_done');
          setLoading(false);
          setInitDone(true);
          return;
        }

        const todayPuzzle = dailyRes.data;
        const doneToday = Boolean(todayPuzzle.completed) ||
          Boolean(store.getState().dashboard.data?.dailyQuest?.completed);

        if (!doneToday) {
          const canResume =
            puzzle.activePuzzleId === todayPuzzle.id &&
            puzzle.isDailySession &&
            !puzzle.completed &&
            !puzzle.locked;

          if (!canResume) {
            dispatch(resetPuzzleState(undefined));
            dispatch(resetPuzzleHintCounters(undefined));
            await puzzleService.startSession(todayPuzzle.id);
            dispatch(loadPuzzle({ puzzle: todayPuzzle, isDailySession: true }));
            dispatch(
              setLastPuzzleMeta({ date: todayKey(), difficulty: todayPuzzle.difficulty })
            );
          } else {
            await puzzleService.startSession(todayPuzzle.id).catch(() => undefined);
          }
          setScreen('play');
        } else if (liveChoiceRemaining > 0) {
          setScreen('choice');
        } else {
          setScreen('quota_done');
        }
      } catch {
        // Daily may still be generating — still offer difficulty trials.
        setScreen(liveChoiceRemaining > 0 ? 'choice' : 'quota_done');
      }

      setLoading(false);
      setInitDone(true);
    };

    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const startChoiceDifficulty = async (difficulty: PuzzleDifficulty) => {
    if (liveChoiceRemaining <= 0) {
      setScreen('quota_done');
      return;
    }
    setChoiceError(null);
    setLoading(true);
    try {
      const res = await puzzleService.getPuzzleByDifficulty(difficulty, { force: true });
      if (!res.success || !res.data) {
        setChoiceError(
          `No unused ${difficulty} puzzles left in the pool. Generate more in Admin → Puzzles, or try another difficulty.`
        );
        setScreen('choice');
        return;
      }
      dispatch(resetPuzzleState(undefined));
      dispatch(resetPuzzleHintCounters(undefined));
      await puzzleService.startSession(res.data.id);
      dispatch(loadPuzzle({ puzzle: res.data, isDailySession: false }));
      dispatch(setLastPuzzleMeta({ date: todayKey(), difficulty }));
      dispatch(incrementChoicePuzzlesToday(todayKey()));
      setScreen('play');
    } catch {
      setChoiceError(
        `Could not start a ${difficulty} puzzle (none available or already completed). Try another difficulty.`
      );
      setScreen('choice');
    }
    setLoading(false);
  };

  const viewDailyResult = async () => {
    setLoading(true);
    try {
      const dailyRes = await puzzleService.getDailyPuzzle();
      if (dailyRes.success && dailyRes.data) {
        dispatch(loadPuzzle({ puzzle: dailyRes.data, isDailySession: true }));
        setScreen('play');
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  const submission = usePuzzleSubmission();
  const hints = usePuzzleHints();
  const completion = usePuzzleCompletion();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hrs}h ${mins}m`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, []);

  usePuzzleKeyboard({
    enabled: screen === 'play' && !puzzle.completed && !puzzle.locked,
    validLetters: puzzle.letters,
    onLetterSelect: (letter) => dispatch(selectLetter(letter)),
    onBackspace: () => dispatch(deleteLetter()),
    onClear: () => dispatch(clearWord()),
    onSubmit: () => {
      void puzzleInputRef.current?.submit();
    },
    onShuffle: () => dispatch(shuffleLetters()),
    onHint: hints.handleRevealHint,
  });

  const handleContinueAfterComplete = () => {
    completion.closeCompletionModal();
    if (!puzzle.isDailySession && liveChoiceRemaining > 1) {
      setScreen('choice');
    } else if (liveChoiceRemaining > 0) {
      setScreen('choice');
    } else {
      setScreen('quota_done');
    }
  };

  const dailyDoneToday = Boolean(store.getState().dashboard.data?.dailyQuest?.completed);

  if (!initDone || loading) {
    return (
      <div className="flex h-96 items-center justify-center">Loading puzzle...</div>
    );
  }

  if (screen === 'choice') {
    return (
      <div className="space-y-3">
        {choiceError && (
          <p className="mx-auto max-w-lg rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-center text-sm text-red-200">
            {choiceError}
          </p>
        )}
        <DifficultySelect
          onSelect={(d) => void startChoiceDifficulty(d)}
          remainingToday={liveChoiceRemaining}
          mode={dailyDoneToday ? 'extra' : 'first'}
          onViewDaily={dailyDoneToday ? () => void viewDailyResult() : undefined}
        />
      </div>
    );
  }

  if (screen === 'quota_done') {
    const dailyReady = Boolean(store.getState().dashboard.data?.dailyQuest?.puzzleId);
    return (
      <Card variant="wood" className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <h2 className="font-martial text-2xl font-extrabold uppercase tracking-wider text-gold">
          {dailyDoneToday ? 'Quests Complete' : 'Quest Desk'}
        </h2>
        <p className="text-sm text-parchment/70">
          {dailyDoneToday
            ? `Today's featured daily scroll is complete${
                liveChoiceRemaining > 0
                  ? `. You still have ${liveChoiceRemaining} extra difficulty trial${liveChoiceRemaining === 1 ? '' : 's'} today.`
                  : '. Come back tomorrow for a new daily scroll.'
              }`
            : dailyReady
              ? 'Unable to open today’s daily scroll right now.'
              : 'Today’s daily scroll is still being prepared by the dojo.'}
          {!dailyDoneToday && liveChoiceRemaining > 0
            ? ` You can still play ${liveChoiceRemaining} difficulty trial${liveChoiceRemaining === 1 ? '' : 's'} today.`
            : ''}
        </p>
        {liveChoiceRemaining > 0 && (
          <Button variant="primary" onClick={() => setScreen('choice')}>
            Choose difficulty
          </Button>
        )}
        {dailyDoneToday && (
          <Button variant="outline" onClick={() => void viewDailyResult()}>
            Review today&apos;s daily
          </Button>
        )}
      </Card>
    );
  }

  if (!puzzle.activePuzzleId) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-3 font-bold text-red-500">Failed to load puzzle.</h2>
        <button
          type="button"
          className="mt-4 text-gold underline"
          onClick={() => setScreen('choice')}
        >
          Choose difficulty
        </button>
      </div>
    );
  }

  const playDisabled = puzzle.completed || puzzle.locked;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {puzzle.isDailySession && (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gold">
          Daily Scroll · {puzzle.difficulty}
          {playDisabled ? ' · Completed (locked for today)' : ''}
        </p>
      )}
      {!puzzle.isDailySession && (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-parchment/60">
          Extra trial · {liveChoiceRemaining} remaining today after this clear
        </p>
      )}

      <PuzzleHeader />

      <div className="grid gap-6 lg:grid-cols-12">
        <main className="lg:col-span-6">
          <PuzzleInput
            ref={puzzleInputRef}
            disabled={playDisabled}
            isDailySession={puzzle.isDailySession}
            onSubmit={submission.handleSubmit}
            onHint={hints.handleRevealHint}
          />
        </main>
        <aside className="space-y-6 lg:col-span-6">
           <div className="rounded-xl border border-gold/80 bg-wood text-gold dark:bg-black/10  p-5">
                <div className="flex items-center gap-2">
                    <Clock size={18} />
                       <span className="font-semibold">Next Puzzle</span>
                </div>
                <p className="mt-2 text-2xl font-bold">{timeLeft}</p>
          </div>

          <PuzzleStats
            onHint={hints.handleRevealHint}
            disabled={playDisabled}
            expanded={asidePanel === 'stats'}
            onToggle={() => toggleAside('stats')}
          />
          <GameRules
            expanded={asidePanel === 'rules'}
            onToggle={() => toggleAside('rules')}
          />
        </aside>
      </div>

      <FoundWords />

      {playDisabled && !completion.showCompletionModal && (
        <div className="flex justify-center gap-3">
          {liveChoiceRemaining > 0 && (
            <Button variant="primary" onClick={() => setScreen('choice')}>
              Play another ({liveChoiceRemaining} left)
            </Button>
          )}
          {puzzle.isDailySession && dailyDoneToday && liveChoiceRemaining <= 0 && (
            <Button variant="outline" onClick={() => setScreen('quota_done')}>
              Done for today
            </Button>
          )}
        </div>
      )}

      <CompletionModal
        isOpen={completion.showCompletionModal}
        difficulty={puzzle.difficulty}
        wordsFound={puzzle.wordsFound.length}
        targetWords={puzzle.requiredWordsToComplete}
        pangramsFound={puzzle.pangramsFound.length}
        totalPangrams={puzzle.totalPangrams}
        score={puzzle.score}
        rewards={completion.rewards}
        beltUps={completion.beltUps}
        onContinue={handleContinueAfterComplete}
      />
    </div>
  );
};

export default Puzzle;
