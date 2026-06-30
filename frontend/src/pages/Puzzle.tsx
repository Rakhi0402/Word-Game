import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loadPuzzle,
  selectLetter,
  clearWord,
  shuffleLetters,
  submitWordSuccess,
  submitWordFailure,
  forceCompletePuzzle
} from '../store/puzzleSlice';
import { addXp, addCoins, deductCoins, incrementWordsFound, incrementPuzzlesCompleted, updateHighestScore } from '../store/userSlice';
import { unlockCard } from '../store/cardsSlice';
import { evaluateAchievements } from '../store/achievementsSlice';
import { updateUserScore } from '../store/leaderboardSlice';
import { LetterWheel } from '../components/puzzle/LetterWheel';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { puzzleService } from '../services/puzzleService';
import { playSound } from '../utils/audio';
import { 
  Trash2, 
  RotateCw, 
  Check, 
  Lightbulb, 
  Flame, 
  Sparkles, 
  Trophy, 
  Award, 
  AlertCircle 
} from 'lucide-react';
import { CHARACTER_CARDS } from '../constants';

export const Puzzle: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const user = useAppSelector(state => state.user);
  const puzzle = useAppSelector(state => state.puzzle);
  const cards = useAppSelector(state => state.cards);
  const soundEnabled = useAppSelector(state => state.settings.sound);

  // Equipped character card properties
  const equippedCard = CHARACTER_CARDS.find(c => c.id === cards.equippedCardId) || CHARACTER_CARDS[0];

  // Local Component States
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [freeHintsUsed, setFreeHintsUsed] = useState(0);
  const [viperShieldUsed, setViperShieldUsed] = useState(false);
  const [xpGranted, setXpGranted] = useState(0);
  const [coinsGranted, setCoinsGranted] = useState(0);
  const [newCardUnlocked, setNewCardUnlocked] = useState<string | null>(null);

  // Load Daily Puzzle
  useEffect(() => {
    const fetchPuzzle = async () => {
      setLoading(true);
      const res = await puzzleService.getDailyPuzzle();
      if (res.success && res.data) {
        dispatch(loadPuzzle(res.data));
      }
      setLoading(false);
    };

    fetchPuzzle();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        <p className="text-sm text-gold tracking-widest uppercase font-martial animate-pulse">
          Unrolling Letter Scroll...
        </p>
      </div>
    );
  }

  if (!puzzle.activePuzzleId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest font-martial">Error</h3>
        <p className="text-xs text-jade-dark/70 dark:text-parchment/70 mt-1">Failed to load the daily puzzle. Please check your network.</p>
      </div>
    );
  }

  // Handle Letter Select
  const handleLetterSelect = (letter: string) => {
    dispatch(selectLetter(letter));
  };

  // Submit Current Word
  const handleSubmit = () => {
    const word = puzzle.currentWord.trim().toUpperCase();
    
    if (word.length < 4) {
      showFeedback("Words must be at least 4 letters!", true);
      playSound.failure(soundEnabled);
      return;
    }

    if (!word.includes(puzzle.centerLetter)) {
      showFeedback(`Must contain center letter '${puzzle.centerLetter}'!`, true);
      playSound.failure(soundEnabled);
      return;
    }

    if (puzzle.wordsFound.includes(word)) {
      showFeedback(`Already decoded '${word}'!`, true);
      playSound.failure(soundEnabled);
      return;
    }

    // Check if word is valid
    const cleanPuzzleId = puzzle.activePuzzleId || '';
    // Validate against mock data
    const isValid = word.split('').every(char => puzzle.letters.includes(char));
    
    // We fetch correct words from the daily list
    const dailyPuzzleObj = {
      puzzle_1: ['PANDA', 'PANDAS', 'SAND', 'SPAN', 'SNAP', 'PAST', 'SPAT', 'TAPS', 'PANS', 'PATS', 'NAPS', 'STAND', 'TAGS', 'GASP', 'GAPS', 'PANG', 'PANGS', 'PAGAN', 'PAGANS'],
      puzzle_2: ['DRAGON', 'DRAGONS', 'ROAD', 'ROADS', 'ORGAN', 'ORGANS', 'SONG', 'SONGS', 'DONG', 'DONGS', 'SOAR', 'GROAN', 'GROANS', 'DONOR', 'DONORS', 'GOAD', 'GOADS', 'RADON', 'RADONS'],
      puzzle_3: ['MASTER', 'MASTERS', 'STEAM', 'TEAMS', 'SEAM', 'MEAT', 'TAME', 'CRATE', 'CRATES', 'CREAM', 'CREAMS', 'SCREAM', 'SCREAMS', 'ACRE', 'ACRES', 'TEAR', 'TEARS', 'STARE', 'RATES', 'MATE', 'MATES']
    }[cleanPuzzleId as 'puzzle_1' | 'puzzle_2' | 'puzzle_3'] || [];

    if (isValid && dailyPuzzleObj.includes(word)) {
      // SUCCESS WORD FOUND
      playSound.success(soundEnabled);
      
      // Calculate Points
      let basePoints = word.length * 10;
      
      // Card Bonuses:
      // 1. Mantis double points for 5 letter words
      if (equippedCard.id === 'mantis_rare' && word.length === 5) {
        basePoints *= 2;
        showFeedback("Mantis Precision Strike! Double Points!", false);
      }
      
      // 2. Tigress double points for center-letter starters
      if (equippedCard.id === 'tigress_rare' && word.startsWith(puzzle.centerLetter)) {
        basePoints *= 2;
        showFeedback("Tigress Claw! Center Word Double Points!", false);
      }

      // Streak Modifier
      let streakMultiplier = 1 + (puzzle.streak * 0.1);
      if (equippedCard.id === 'shifu_epic') {
        streakMultiplier = 1 + (puzzle.streak * 0.25); // Faster multiplier
      }

      let totalPoints = Math.round(basePoints * streakMultiplier);

      // Card overall modifiers
      if (equippedCard.id === 'po_common') {
        totalPoints = Math.round(totalPoints * 1.1); // +10%
      } else if (equippedCard.id === 'dragon_warrior_po') {
        totalPoints = Math.round(totalPoints * 1.2); // +20%
      } else if (equippedCard.id === 'oogway_legendary') {
        totalPoints = Math.round(totalPoints * 1.3); // +30%
      }

      dispatch(submitWordSuccess({ word, points: totalPoints }));
      dispatch(incrementWordsFound());
      dispatch(updateHighestScore(totalPoints));

      // Trigger achievement evaluation
      dispatch(evaluateAchievements({
        stats: {
          ...user.stats,
          wordsFound: user.stats.wordsFound + 1,
          highestScore: Math.max(user.stats.highestScore, totalPoints)
        },
        xp: user.xp
      }));

      showFeedback(`Decoded '${word}'! +${totalPoints} Points`, false);

      // Check if all words found to handle completion
      const nextFoundWords = [...puzzle.wordsFound, word];
      if (nextFoundWords.length >= puzzle.totalValidWordsCount) {
        handlePuzzleComplete();
      }

    } else {
      // FAILURE
      playSound.failure(soundEnabled);
      
      // Check if Viper shield can save streak
      const hasViperShield = equippedCard.id === 'viper_rare' && !viperShieldUsed;
      
      if (hasViperShield) {
        setViperShieldUsed(true);
        dispatch(submitWordFailure({ retainStreak: true }));
        showFeedback("Viper's Coiled Defense! Streak Protected!", false);
      } else {
        dispatch(submitWordFailure({ retainStreak: false }));
        showFeedback("Invalid word scroll. Streak broken!", true);
      }
    }
  };

  const showFeedback = (text: string, isError: boolean) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Puzzle Hints / Word reveals
  const handleRevealHint = () => {
    // Collect un-found words
    const dailyPuzzleObj = {
      puzzle_1: ['PANDA', 'PANDAS', 'SAND', 'SPAN', 'SNAP', 'PAST', 'SPAT', 'TAPS', 'PANS', 'PATS', 'NAPS', 'STAND', 'SAT', 'AND', 'TAG', 'TAGS', 'GASP', 'GAP', 'GAPS', 'PANG', 'PANGS', 'PAGAN', 'PAGANS'],
      puzzle_2: ['DRAGON', 'DRAGONS', 'ROAD', 'ROADS', 'ORGAN', 'ORGANS', 'SONG', 'SONGS', 'DONG', 'DONGS', 'SOAR', 'GROAN', 'GROANS', 'DONOR', 'DONORS', 'GOAD', 'GOADS', 'RADON', 'RADONS'],
      puzzle_3: ['MASTER', 'MASTERS', 'STEAM', 'TEAMS', 'SEAM', 'MEAT', 'TAME', 'CRATE', 'CRATES', 'CREAM', 'CREAMS', 'SCREAM', 'SCREAMS', 'ACRE', 'ACRES', 'TEAR', 'TEARS', 'STARE', 'RATES', 'MATE', 'MATES']
    }[puzzle.activePuzzleId as 'puzzle_1' | 'puzzle_2' | 'puzzle_3'] || [];

    const unfound = dailyPuzzleObj.filter(w => !puzzle.wordsFound.includes(w));
    
    if (unfound.length === 0) return;

    // Check cost
    let isFree = false;
    if (equippedCard.id === 'oogway_legendary') {
      isFree = true;
    } else if (equippedCard.id === 'dragon_warrior_po' && freeHintsUsed === 0) {
      isFree = true;
    }

    if (!isFree && user.coins < 15) {
      showFeedback("Need 15 coins to buy a scroll hint!", true);
      return;
    }

    // Deduct coins if not free
    if (!isFree) {
      dispatch(deductCoins(15));
    } else if (equippedCard.id === 'dragon_warrior_po') {
      setFreeHintsUsed(1);
    }

    // Reveal random word
    const randWord = unfound[Math.floor(Math.random() * unfound.length)];
    
    // Auto submit it with standard points
    dispatch(submitWordSuccess({ word: randWord, points: randWord.length * 10 }));
    dispatch(incrementWordsFound());
    showFeedback(`Scroll Reveal: '${randWord}'!`, false);
    playSound.success(soundEnabled);

    // Check completion
    const nextFoundWords = [...puzzle.wordsFound, randWord];
    if (nextFoundWords.length >= puzzle.totalValidWordsCount) {
      handlePuzzleComplete();
    }
  };

  // Complete Puzzle & Roll rewards
  const handlePuzzleComplete = () => {
    // Calculate final base rewards
    let finalXp = puzzle.xpReward;
    let finalCoins = puzzle.coinReward;

    // Card multipliers:
    // Po Common: +5 XP
    if (equippedCard.id === 'po_common') {
      finalXp += 5;
    }
    // Mantis: +20% XP
    if (equippedCard.id === 'mantis_rare') {
      finalXp = Math.round(finalXp * 1.20);
    }
    // Viper: +10 coins
    if (equippedCard.id === 'viper_rare') {
      finalCoins += 10;
    }
    // Shifu: +25% coins
    if (equippedCard.id === 'shifu_epic') {
      finalCoins = Math.round(finalCoins * 1.25);
    }
    // Dragon Warrior Po: +35% XP
    if (equippedCard.id === 'dragon_warrior_po') {
      finalXp = Math.round(finalXp * 1.35);
    }
    // Oogway: Double XP & Coins!
    if (equippedCard.id === 'oogway_legendary') {
      finalXp *= 2;
      finalCoins *= 2;
    }

    setXpGranted(finalXp);
    setCoinsGranted(finalCoins);

    // Roll card unlock! (50% chance if they solved all words, let's unlock a new card for them as a reward!)
    const lockedCardIds = CHARACTER_CARDS.map(c => c.id).filter(id => !cards.unlockedCardIds.includes(id));
    if (lockedCardIds.length > 0) {
      const randLockedId = lockedCardIds[Math.floor(Math.random() * lockedCardIds.length)];
      dispatch(unlockCard(randLockedId));
      setNewCardUnlocked(randLockedId);
    }

    // Dispatch rewards
    dispatch(addXp(finalXp));
    dispatch(addCoins(finalCoins));
    dispatch(incrementPuzzlesCompleted());
    dispatch(evaluateAchievements({
      stats: {
        ...user.stats,
        puzzlesCompleted: user.stats.puzzlesCompleted + 1,
        highestScore: Math.max(user.stats.highestScore, puzzle.score)
      },
      xp: user.xp + finalXp
    }));
    dispatch(forceCompletePuzzle());
    
    // Play celebratory levelUp sound
    playSound.levelUp(soundEnabled);

    // Sync leaderboard score
    const newLeaderboardScore = user.stats.highestScore + (puzzle.score * 5); // Add sum points
    dispatch(updateUserScore({
      username: user.username,
      score: newLeaderboardScore,
      belt: user.belt
    }));
  };

  // Calculate completion percentage
  const completionPercentage = Math.round((puzzle.wordsFound.length / (puzzle.totalValidWordsCount || 1)) * 100);

  return (
    <div className="space-y-6">
      
      {/* Puzzle Header Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card variant="wood" className="flex flex-col items-center justify-center p-3 text-center border border-gold/20">
          <Award className="h-5 w-5 text-gold mb-1" />
          <span className="text-xl font-black text-gold text-gold-glow font-mono">{puzzle.score}</span>
          <span className="text-[9px] font-bold text-parchment/60 uppercase tracking-widest mt-1">Scroll Score</span>
        </Card>

        <Card variant="wood" className="flex flex-col items-center justify-center p-3 text-center border border-gold/20">
          <Flame className="h-5 w-5 text-orange-500 fill-orange-500 mb-1" />
          <span className="text-xl font-black text-orange-400 font-mono">{puzzle.streak}x</span>
          <span className="text-[9px] font-bold text-parchment/60 uppercase tracking-widest mt-1">Word Streak</span>
        </Card>

        <Card variant="wood" className="flex flex-col items-center justify-center p-3 text-center border border-gold/20">
          <Trophy className="h-5 w-5 text-emerald-400 mb-1" />
          <span className="text-xl font-black text-emerald-400 font-mono">{completionPercentage}%</span>
          <span className="text-[9px] font-bold text-parchment/60 uppercase tracking-widest mt-1">Completion</span>
        </Card>

        <Card variant="wood" className="flex flex-col items-center justify-center p-3 text-center border border-gold/20">
          <Sparkles className="h-5 w-5 text-purple-400 mb-1" />
          <span className="text-xl font-black text-purple-300 font-mono">
            {puzzle.wordsFound.length} / {puzzle.totalValidWordsCount}
          </span>
          <span className="text-[9px] font-bold text-parchment/60 uppercase tracking-widest mt-1">Decoded Words</span>
        </Card>
      </div>

      {/* Main Wheel Grid */}
      <div className="grid gap-6 md:grid-cols-2 items-center">
        
        {/* Left Side: Canvas Letter Wheel */}
        <div className="flex flex-col items-center justify-center">
          
          {/* Selected Word Input Display */}
          <div className="w-full max-w-[280px] h-12 flex items-center justify-center border-b-4 border-gold bg-jade text-parchment font-black text-2xl rounded-t-xl mb-4 tracking-widest select-none shadow uppercase font-martial">
            {puzzle.currentWord || <span className="opacity-30">PANDA</span>}
          </div>

          {/* Interactive Canvas Wheel */}
          <LetterWheel 
            centerLetter={puzzle.centerLetter} 
            outerLetters={puzzle.outerLetters} 
            onLetterSelect={handleLetterSelect} 
          />

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-6">
            <Button 
              variant="danger" 
              onClick={() => dispatch(clearWord())}
              title="Clear Word"
              className="p-3"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => dispatch(shuffleLetters())}
              title="Shuffle letters"
              className="p-3"
            >
              <RotateCw className="h-5 w-5" />
            </Button>

            <Button 
              variant="primary" 
              onClick={handleSubmit}
              className="px-6 flex items-center space-x-1.5"
            >
              <Check className="h-5 w-5" /> <span>Submit</span>
            </Button>
          </div>
        </div>

        {/* Right Side: Found Words list */}
        <div className="flex flex-col h-full min-h-[380px]">
          <Card variant="parchment" className="flex-1 flex flex-col justify-between border border-gold/20 h-full">
            <div>
              <div className="flex items-center justify-between border-b border-gold/15 pb-2.5 mb-4">
                <h3 className="text-base font-extrabold text-gold-dark dark:text-gold uppercase tracking-wider font-martial">
                  Decoded Scrolls
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRevealHint}
                  className="px-3 py-1 flex items-center space-x-1"
                >
                  <Lightbulb className="h-3.5 w-3.5 fill-gold text-gold" />
                  <span>Reveal (15)</span>
                </Button>
              </div>

              {/* List */}
              {puzzle.wordsFound.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-jade-dark/50 dark:text-parchment/40">
                  <span className="text-4xl mb-2">📜</span>
                  <p className="text-xs font-bold uppercase tracking-wider">No scroll words solved yet</p>
                  <p className="text-[10px] mt-1">Spin the wheel and select letters containing center '{puzzle.centerLetter}'</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {puzzle.wordsFound.map((word, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gold/10 dark:bg-jade-gold/30 border border-gold/20 rounded-xl px-3 py-2 flex items-center justify-between animate-fadeIn text-sm font-bold uppercase tracking-widest text-gold-dark dark:text-gold"
                    >
                      <span>{word}</span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        +{word.length * 10} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Float Feedback Banner */}
            {feedback && (
              <div 
                className={`
                  mt-4 p-3 rounded-xl border text-xs font-bold text-center animate-bounce uppercase tracking-wide
                  ${feedback.isError 
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200' 
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200'
                  }
                `}
              >
                {feedback.text}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={puzzle.completed}
        onClose={() => dispatch(forceCompletePuzzle())} // closes modal by changing state
        title="Quest Complete! ☯️"
        variant="wood"
      >
        <div className="text-center space-y-5 py-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold border-4 border-parchment text-4xl shadow-2xl animate-float">
            🎉
          </div>

          <h3 className="text-xl font-extrabold text-gold text-gold-glow uppercase tracking-widest font-martial">
            Dragon Scroll Decoded!
          </h3>

          <p className="text-sm text-parchment/80 leading-relaxed">
            You successfully unlocked the secrets of today's word scroll. Your mental martial arts training is paying off!
          </p>

          {/* Reward Badges */}
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2">
            <div className="bg-jade-dark/50 border border-gold/30 rounded-2xl p-3 text-center">
              <span className="block text-xs font-semibold text-parchment/55 uppercase tracking-wider">XP Earned</span>
              <span className="text-lg font-black text-gold font-mono">+{xpGranted} XP</span>
            </div>
            <div className="bg-jade-dark/50 border border-gold/30 rounded-2xl p-3 text-center">
              <span className="block text-xs font-semibold text-parchment/55 uppercase tracking-wider">Coins Earned</span>
              <span className="text-lg font-black text-gold font-mono">+{coinsGranted}</span>
            </div>
          </div>

          {/* Unlocked Card Roll */}
          {newCardUnlocked && (
            <div className="bg-gold/15 border border-gold/40 rounded-2xl p-4 max-w-sm mx-auto animate-pulse">
              <span className="text-xs font-bold text-gold uppercase tracking-widest block mb-2">🎁 Character Scroll Unlocked!</span>
              <div className="flex items-center space-x-3 text-left">
                <img 
                  src={CHARACTER_CARDS.find(c => c.id === newCardUnlocked)?.image} 
                  alt="Unlocked Card" 
                  className="h-16 w-14 object-cover border border-gold rounded shadow bg-jade" 
                />
                <div>
                  <h4 className="font-extrabold text-gold text-sm tracking-wider uppercase font-martial">
                    {CHARACTER_CARDS.find(c => c.id === newCardUnlocked)?.name}
                  </h4>
                  <p className="text-[10px] text-parchment/60 italic leading-snug">
                    {CHARACTER_CARDS.find(c => c.id === newCardUnlocked)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gold/20 flex justify-center">
            <Button 
              variant="primary" 
              onClick={() => {
                dispatch(loadPuzzle({
                  id: 'puzzle_' + ((new Date().getDate() + 1) % 3 + 1), // load next puzzle
                  letters: [['E', 'M', 'A', 'S', 'T', 'R', 'C'], ['A', 'D', 'N', 'P', 'S', 'T', 'G'], ['D', 'R', 'A', 'G', 'O', 'N', 'S']][new Date().getDate() % 3],
                  centerLetter: ['E', 'A', 'O'][new Date().getDate() % 3],
                  validWords: [['MASTER', 'MASTERS', 'STEAM', 'TEAMS', 'SEAM', 'MEAT', 'TAME', 'CRATE', 'CRATES', 'CREAM', 'CREAMS', 'SCREAM', 'SCREAMS', 'ACRE', 'ACRES', 'TEAR', 'TEARS', 'STARE', 'RATES', 'MATE', 'MATES'], ['PANDA', 'PANDAS', 'SAND', 'SPAN', 'SNAP', 'PAST', 'SPAT', 'TAPS', 'PANS', 'PATS', 'NAPS', 'STAND', 'SAT', 'AND', 'TAG', 'TAGS', 'GASP', 'GAP', 'GAPS', 'PANG', 'PANGS', 'PAGAN', 'PAGANS'], ['DRAGON', 'DRAGONS', 'ROAD', 'ROADS', 'ORGAN', 'ORGANS', 'SONG', 'SONGS', 'DONG', 'DONGS', 'SOAR', 'GROAN', 'GROANS', 'DONOR', 'DONORS', 'GOAD', 'GOADS', 'RADON', 'RADONS']][new Date().getDate() % 3],
                  difficulty: ['Hard', 'Easy', 'Medium'][new Date().getDate() % 3] as 'Easy' | 'Medium' | 'Hard',
                  xpReward: 100,
                  coinReward: 50
                }));
              }}
              className="px-8"
            >
              Continue to Dojo
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
