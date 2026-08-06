import type { CharacterCard, BeltColor, DailyPuzzle, Achievement } from '../types';
import { BELT_PROGRESSION, DIFFICULTY_CONFIG } from './rewards';
import { describeStarTier } from './gameRules';

// Re-export belt progression as BELT_LEVELS for existing imports
export const BELT_LEVELS = BELT_PROGRESSION.map((b) => ({
  belt: b.belt as BeltColor,
  minXp: b.minXp,
  title: b.title,
  colorClass: b.colorClass,
}));

export { BELT_PROGRESSION, DIFFICULTY_CONFIG };

const flavorBonuses = (stars: number): string[] => describeStarTier(stars);

export const CHARACTER_CARDS: CharacterCard[] = [
  {
    id: 'po_common',
    name: 'Po (Initiate)',
    rarity: 'common',
    image: '/assets/card_pack/po_common.png',
    stars: 1,
    bonuses: flavorBonuses(1),
    description: 'A passionate panda who dreams of kung fu greatness. Slow but full of determination.',
  },
  {
    id: 'monkey_common',
    name: 'Master Monkey',
    rarity: 'common',
    image: '/assets/card_pack/monkey_common.png',
    stars: 1,
    bonuses: flavorBonuses(1),
    description: 'Playful, mischievous, and incredibly agile. Monkey uses speed and trickery to confuse foes.',
  },
  {
    id: 'crane_common',
    name: 'Master Crane',
    rarity: 'common',
    image: '/assets/card_pack/crane_common.png',
    stars: 1,
    bonuses: flavorBonuses(1),
    description: 'Calm and steady. Crane utilizes defensive maneuvers to redirect enemy force with grace.',
  },
  {
    id: 'mantis_rare',
    name: 'Master Mantis',
    rarity: 'rare',
    image: '/assets/card_pack/mantis_rare.png',
    stars: 3,
    bonuses: flavorBonuses(3),
    description: 'Small but mighty. Mantis strikes with absolute precision and blinding speed.',
  },
  {
    id: 'viper_rare',
    name: 'Master Viper',
    rarity: 'rare',
    image: '/assets/card_pack/viper_rare.png',
    stars: 3,
    bonuses: flavorBonuses(3),
    description: 'A compassionate dancer who fights with flexible and unpredictable strikes.',
  },
  {
    id: 'tigress_rare',
    name: 'Master Tigress',
    rarity: 'rare',
    image: '/assets/card_pack/tigress_rare.png',
    stars: 3,
    bonuses: flavorBonuses(3),
    description: 'The strongest and most dedicated of the Furious Five. Fierce, disciplined, and powerful.',
  },
  {
    id: 'shifu_epic',
    name: 'Master Shifu',
    rarity: 'epic',
    image: '/assets/card_pack/shifu_epic.png',
    stars: 4,
    bonuses: flavorBonuses(4),
    description: 'The wise master of the Jade Palace. Patiently guides others to unlock their inner potential.',
  },
  {
    id: 'dragon_warrior_po',
    name: 'Dragon Warrior Po',
    rarity: 'epic',
    image: '/assets/card_pack/dragon_warrior_po_epic.png',
    stars: 4,
    bonuses: flavorBonuses(4),
    description: 'The legendary Dragon Warrior. Combines body weight, noodle-eating stamina, and inner peace.',
  },
  {
    id: 'oogway_legendary',
    name: 'Grand Master Oogway',
    rarity: 'legendary',
    image: '/assets/card_pack/oogway_legendary.png',
    stars: 5,
    bonuses: flavorBonuses(5),
    description: 'The founder of Kung Fu and the Valley of Peace. His wisdom is infinite and his moves are timeless.',
  },
];

export const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    id: 'daily_puzzle_1',
    letters: ['A', 'D', 'N', 'P', 'S', 'T', 'G'],
    centerLetter: 'A',
    validWords: [
      'PANDA', 'PANDAS', 'SAND', 'SPAN', 'SNAP', 'PAST', 'SPAT', 'TAPS',
      'PANS', 'PATS', 'NAPS', 'STAND', 'TAGS', 'GASP', 'GAPS', 'PANG',
      'PANGS', 'PAGAN', 'PAGANS', 'DATA', 'ADAPT', 'GAITS', 'STANG',
    ],
    pangrams: ['STANDGAP'],
    difficulty: 'Easy',
    xpReward: DIFFICULTY_CONFIG.Easy.baseXp,
    coinReward: DIFFICULTY_CONFIG.Easy.baseCoins,
  },
  {
    id: 'daily_puzzle_2',
    letters: ['D', 'R', 'A', 'G', 'O', 'N', 'S'],
    centerLetter: 'O',
    validWords: [
      'DRAGON', 'DRAGONS', 'ROAD', 'ROADS', 'ORGAN', 'ORGANS', 'SONG',
      'SONGS', 'SOAR', 'GROAN', 'GROANS', 'DONOR', 'DONORS', 'GOAD', 'GOADS',
      'RADON', 'SAGO', 'ORANG', 'ORANGS', 'DRAGOONS',
    ],
    pangrams: ['DRAGONS'],
    difficulty: 'Medium',
    xpReward: DIFFICULTY_CONFIG.Medium.baseXp,
    coinReward: DIFFICULTY_CONFIG.Medium.baseCoins,
  },
  {
    id: 'daily_puzzle_3',
    letters: ['E', 'M', 'A', 'S', 'T', 'R', 'C'],
    centerLetter: 'E',
    validWords: [
      'MASTER', 'MASTERS', 'STEAM', 'TEAMS', 'SEAM', 'MEAT', 'TAME',
      'CRATE', 'CRATES', 'CREAM', 'CREAMS', 'SCREAM', 'SCREAMS', 'ACRE',
      'ACRES', 'TEAR', 'TEARS', 'STARE', 'RATES', 'MATE', 'MATES', 'STREAM',
      'STREAMS', 'CREST', 'REACT', 'TRACES',  'CREAMS', 'STREAMCASTER',
    ],
    pangrams: ['STREAMCASTER'],
    difficulty: 'Hard',
    xpReward: DIFFICULTY_CONFIG.Hard.baseXp,
    coinReward: DIFFICULTY_CONFIG.Hard.baseCoins,
  },
  {
    id: 'daily_puzzle_4',
    letters: ['L', 'I', 'G', 'H', 'T', 'E', 'R'],
    centerLetter: 'E',
    validWords: [
       'LIGHTER',  'THERE', 'THREE', 'TIGER', 
      'LITER',  'REEL', 'TREE', 'TREE', 'EIGHT',
      'RELIGHT', 'ELITE', 'TILE', 'RITE',  'TIRE',
      'HIRE', 'LEGIT', 'RETILE', 'TIER', 'TITLE', 'LITTER',
      'THEIR', 'HEEL', 'LETTER', 'LITHE', 'LITHER',
    ],
    pangrams: ['LIGHTER', 'RELIGHT'],
    difficulty: 'Easy',
    xpReward: DIFFICULTY_CONFIG.Easy.baseXp,
    coinReward: DIFFICULTY_CONFIG.Easy.baseCoins,
  },
];

/** XP progress within the current belt band */
export const getBeltProgress = (xp: number): { value: number; max: number; beltMin: number } => {
  let beltMin = 0;
  let nextMin = BELT_LEVELS[BELT_LEVELS.length - 1].minXp;
  for (let i = 0; i < BELT_LEVELS.length; i++) {
    if (xp >= BELT_LEVELS[i].minXp) {
      beltMin = BELT_LEVELS[i].minXp;
      nextMin = BELT_LEVELS[i + 1]?.minXp ?? beltMin + 1000;
    }
  }
  return { value: Math.max(0, xp - beltMin), max: Math.max(1, nextMin - beltMin), beltMin };
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_word',
    title: 'First Strike',
    description: 'Find your first correct word in any puzzle.',
    unlocked: false,
    progress: 0,
    target: 1,
    rewardXp: 15,
    rewardCoins: 10,
    iconName: 'Zap',
  },
  {
    id: 'puzzle_master',
    title: 'Scroll Guardian',
    description: 'Complete 5 puzzles.',
    unlocked: false,
    progress: 0,
    target: 5,
    rewardXp: 150,
    rewardCoins: 75,
    iconName: 'Scroll',
  },
  {
    id: 'collector',
    title: 'Furious Collection',
    description: 'Unlock 5 different character cards.',
    unlocked: false,
    progress: 1,
    target: 5,
    rewardXp: 200,
    rewardCoins: 100,
    iconName: 'Sparkles',
  },
  {
    id: 'streak_warrior',
    title: 'Unstoppable Flow',
    description: 'Build a word streak of 5 in a single puzzle.',
    unlocked: false,
    progress: 0,
    target: 5,
    rewardXp: 75,
    rewardCoins: 40,
    iconName: 'Flame',
  },
  {
    id: 'jade_belter',
    title: 'Jade Master',
    description: 'Reach the Green Belt rank (2500 XP).',
    unlocked: false,
    progress: 0,
    target: 2500,
    rewardXp: 250,
    rewardCoins: 150,
    iconName: 'Shield',
  },
  {
    id: 'day_devotee',
    title: 'Seven Forms',
    description: 'Maintain a 7-day completion streak.',
    unlocked: false,
    progress: 0,
    target: 7,
    rewardXp: 200,
    rewardCoins: 100,
    iconName: 'Flame',
  },
  {
    id: 'pangram_hunter',
    title: 'Pangram Hunter',
    description: 'Find 10 pangrams across all puzzles.',
    unlocked: false,
    progress: 0,
    target: 10,
    rewardXp: 150,
    rewardCoins: 60,
    iconName: 'Sparkles',
  },
  {
    id: 'perfect_scroll',
    title: 'Perfect Scroll',
    description: 'Clear every valid word in a puzzle.',
    unlocked: false,
    progress: 0,
    target: 1,
    rewardXp: 100,
    rewardCoins: 50,
    iconName: 'Trophy',
  },
];
