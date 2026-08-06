import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

import { useAppDispatch, useAppSelector, store } from '../store';
import {
  loadPuzzle,
  selectLetter,
  deleteLetter,
  clearWord,
  shuffleLetters,
  restoreCompletedPuzzle,
  resetPuzzleState,
} from '../store/puzzleSlice';
import { refreshDailyHints, resetPuzzleHintCounters } from '../store/cardsSlice';
import {
  clearBonusFreeHintsNextDay,
  consumeStreakShield,
  setDailyStreak,
  setLastPuzzleMeta,
  syncChoicePuzzlesDay,
} from '../store/userSlice';

import { puzzleService } from '../services/puzzleService';
import {
  isDailyCompleted,
  isTodaysDailyCompleted,
  loadCompletionForReview,
  loadDailyCompletion,
  todayKey,
  wasYesterdayCompleted,
} from '../utils/mockProgress';
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
  const email = useAppSelector((state) => state.auth.email || state.user.email);

  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>('loading');
  const [initDone, setInitDone] = useState(false);
  const [asidePanel, setAsidePanel] = useState<AsidePanel>('none');
  const puzzleInputRef = useRef<PuzzleInputHandle>(null);

  const toggleAside = (panel: Exclude<AsidePanel, 'none'>) => {
    setAsidePanel((prev) => {
      const next: AsidePanel = prev === panel ? 'none' : panel;
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
          hypothesisId: 'H2',
          location: 'Puzzle.tsx:toggleAside',
          message: 'aside accordion exclusivity toggle',
          data: { prev, clicked: panel, next },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return next;
    });
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

    if (email && user.dailyStreak > 0 && !wasYesterdayCompleted(email) && !isDailyCompleted(email)) {
      if (user.lastPuzzleDate && user.lastPuzzleDate !== todayKey()) {
        const last = user.lastPuzzleDate;
        const yesterday = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();
        if (last < yesterday) {
          if (user.streakShields > 0) {
            dispatch(consumeStreakShield(undefined));
          } else {
            dispatch(setDailyStreak(0));
          }
        }
      }
    }
  }, [
    dispatch,
    email,
    user.permanentExtraDailyHint,
    user.bonusFreeHintsNextDay,
    user.dailyStreak,
    user.lastPuzzleDate,
    user.streakShields,
  ]);

  useEffect(() => {
    const boot = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H3',location:'Puzzle.tsx:boot-entry',message:'boot start',data:{hasEmail:Boolean(email),emailLen:email?email.length:0,reduxPuzzleId:puzzle.activePuzzleId,reduxCompleted:puzzle.completed,reduxLocked:puzzle.locked},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (!email) {
        // #region agent log
        fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H3',location:'Puzzle.tsx:no-email',message:'boot skipped — no email → choice',data:{},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setScreen('choice');
        setInitDone(true);
        return;
      }

      setLoading(true);
      try {
        const dailyRes = await puzzleService.getDailyPuzzle();
        // #region agent log
        fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H1',location:'Puzzle.tsx:daily-fetch',message:'getDailyPuzzle result',data:{success:dailyRes.success,puzzleId:dailyRes.data?.id??null,difficulty:dailyRes.data?.difficulty??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!dailyRes.success || !dailyRes.data) {
          // #region agent log
          fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H1',location:'Puzzle.tsx:daily-fail',message:'daily fetch failed → choice',data:{},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setScreen('choice');
          setLoading(false);
          setInitDone(true);
          return;
        }

        const todayPuzzle = dailyRes.data;
        const snap = loadDailyCompletion(email);
        const doneToday = isTodaysDailyCompleted(email, todayPuzzle.id);
        const remaining =
          MAX_CHOICE_PUZZLES_PER_DAY -
          (store.getState().user.choicePuzzlesDate === todayKey()
            ? store.getState().user.choicePuzzlesCompletedToday
            : 0);

        // #region agent log
        fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'post-fix',hypothesisId:'H2',location:'Puzzle.tsx:done-check',message:'isTodaysDailyCompleted',data:{doneToday,todayPuzzleId:todayPuzzle.id,snapPuzzleId:snap?.puzzleId??null,snapDate:snap?.date??null,todayKey:todayKey(),remaining},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (!doneToday) {
          const canResume =
            puzzle.activePuzzleId === todayPuzzle.id &&
            puzzle.isDailySession &&
            !puzzle.completed &&
            !puzzle.locked;

          // #region agent log
          fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'post-fix',hypothesisId:'H5',location:'Puzzle.tsx:load-path',message:'loading playable daily',data:{canResume,branch:canResume?'resume':'fresh-load'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion

          if (canResume) {
            setScreen('play');
          } else {
            dispatch(resetPuzzleState(undefined));
            dispatch(resetPuzzleHintCounters(undefined));
            dispatch(loadPuzzle({ puzzle: todayPuzzle, isDailySession: true }));
            dispatch(
              setLastPuzzleMeta({ date: todayKey(), difficulty: todayPuzzle.difficulty })
            );
            setScreen('play');
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H2',location:'Puzzle.tsx:skip-daily',message:'daily skipped as done → extras',data:{nextScreen:remaining>0?'choice':'quota_done'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setScreen(remaining > 0 ? 'choice' : 'quota_done');
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'H4',location:'Puzzle.tsx:boot-error',message:'boot threw',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setScreen('choice');
      }

      setLoading(false);
      setInitDone(true);
    };

    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, email]);

  const startChoiceDifficulty = async (difficulty: PuzzleDifficulty) => {
    const remaining =
      MAX_CHOICE_PUZZLES_PER_DAY -
      (store.getState().user.choicePuzzlesDate === todayKey()
        ? store.getState().user.choicePuzzlesCompletedToday
        : 0);
    if (remaining <= 0) {
      setScreen('quota_done');
      return;
    }
    setLoading(true);
    dispatch(resetPuzzleState(undefined));
    dispatch(resetPuzzleHintCounters(undefined));
    const response = await puzzleService.getPuzzleByDifficulty(difficulty);
    if (response.success && response.data) {
      dispatch(loadPuzzle({ puzzle: response.data, isDailySession: false }));
      dispatch(setLastPuzzleMeta({ date: todayKey(), difficulty }));
      setScreen('play');
    }
    setLoading(false);
  };

  const viewDailyResult = async () => {
    if (!email) return;
    setLoading(true);
    const dailyRes = await puzzleService.getDailyPuzzle();
    const puzzleId = dailyRes.data?.id;
    const snapshot =
      loadCompletionForReview(email, puzzleId) || loadDailyCompletion(email);

    if (!snapshot?.puzzleId) {
      setLoading(false);
      return;
    }

    const response = await puzzleService.getPuzzleById(snapshot.puzzleId);
    if (response.success && response.data) {
      dispatch(
        restoreCompletedPuzzle({
          puzzle: response.data,
          wordsFound: snapshot.wordsFound || [],
          score: snapshot.score || 0,
          pangramsFound: snapshot.pangramsFound || [],
          hintedWords: snapshot.hintedWords || [],
          streak: snapshot.streak || 0,
          hintsUsedThisPuzzle: snapshot.hintsUsedThisPuzzle,
          isDailySession: true,
        })
      );
      setScreen('play');
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
      // #region agent log
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'post-fix',hypothesisId:'H1',location:'Puzzle.tsx:keyboard-submit',message:'keyboard Enter → PuzzleInput.submit (unified feedback)',data:{word:puzzle.currentWord,hasRef:Boolean(puzzleInputRef.current)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      void puzzleInputRef.current?.submit();
    },
    onShuffle: () => dispatch(shuffleLetters()),
    onHint: hints.handleRevealHint,
  });

  const handleContinueAfterComplete = () => {
    completion.closeCompletionModal();
    const u = store.getState().user;
    const remaining =
      MAX_CHOICE_PUZZLES_PER_DAY -
      (u.choicePuzzlesDate === todayKey() ? u.choicePuzzlesCompletedToday : 0);
    setScreen(remaining > 0 ? 'choice' : 'quota_done');
  };

  const dailyDoneToday =
    Boolean(email) &&
    Boolean(puzzle.activePuzzleId) &&
    isTodaysDailyCompleted(email!, puzzle.activePuzzleId || '');

  if (!initDone || loading) {
    return (
      <div className="flex h-96 items-center justify-center">Loading puzzle...</div>
    );
  }

  if (screen === 'choice') {
    return (
      <DifficultySelect
        onSelect={(d) => void startChoiceDifficulty(d)}
        remainingToday={liveChoiceRemaining}
        mode={email && isDailyCompleted(email) ? 'extra' : 'first'}
        onViewDaily={
          email && isDailyCompleted(email) ? () => void viewDailyResult() : undefined
        }
      />
    );
  }

  if (screen === 'quota_done') {
    return (
      <Card variant="wood" className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <h2 className="font-martial text-2xl font-extrabold uppercase tracking-wider text-gold">
          Quests Complete
        </h2>
        <p className="text-sm text-parchment/70">
          Daily scroll done and all {MAX_CHOICE_PUZZLES_PER_DAY} extra trials used. Return tomorrow
          for a fresh daily.
        </p>
        {email && isDailyCompleted(email) && (
          <Button variant="outline" onClick={() => void viewDailyResult()}>
            Review today&apos;s daily (found words)
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
        totalPangrams={puzzle.pangrams.length}
        score={puzzle.score}
        rewards={completion.rewards}
        beltUps={completion.beltUps}
        onContinue={handleContinueAfterComplete}
      />
    </div>
  );
};

export default Puzzle;
