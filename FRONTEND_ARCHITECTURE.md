# Kung Fu Word Quest - Frontend Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Layers](#architecture-layers)
5. [Core Features & Components](#core-features--components)
6. [State Management](#state-management)
7. [Routing & Authentication](#routing--authentication)
8. [Data Flow](#data-flow)
9. [Build & Development](#build--development)
10. [Key Design Patterns](#key-design-patterns)

---

## Overview

**Kung Fu Word Quest** is a gamified daily word puzzle game with a martial-arts theme. The frontend is built with React, TypeScript, and Redux Toolkit, delivering a responsive, interactive experience with persistent progression through belts, cards, XP, and achievements.

### Project Scope
- Authentication (login/register)
- Daily puzzle gameplay
- Character card collection
- Player progression & leaderboard
- Profile management & settings
- Achievements tracking

---

## Technology Stack

### Core Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| React | ^19.2.7 | UI framework |
| React DOM | ^19.2.7 | DOM rendering |
| React Router DOM | ^7.18.0 | Client-side routing |
| Redux Toolkit | ^2.12.0 | State management |
| React Redux | ^9.3.0 | React-Redux bindings |
| Lucide React | ^1.21.0 | Icon library |
| TypeScript | ~6.0.2 | Type safety |
| Tailwind CSS | ^3.4.19 | Utility CSS framework |
| Vite | ^8.1.0 | Build tool & dev server |

### Development Tools
- **TypeScript**: Full type safety for scalability
- **Vite**: Fast HMR and optimized builds
- **Tailwind CSS**: Responsive, theme-aware styling
- **PostCSS**: CSS processing with Autoprefixer
- **Oxlint**: Fast Rust-based linting

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                 # Root application component
│   ├── main.tsx                # Vite entry point
│   ├── App.css                 # Global styles
│   ├── index.css               # Reset & typography
│   │
│   ├── components/             # Reusable React components
│   │   ├── auth/
│   │   │   └── AuthRoute.tsx   # Protected/Public route guards
│   │   ├── layout/
│   │   │   ├── Layout.tsx      # Main authenticated layout
│   │   │   ├── TopBar.tsx      # Header with user info & nav
│   │   │   └── BottomNav.tsx   # Mobile navigation
│   │   ├── puzzle/
│   │   │   ├── PuzzleHeader.tsx
│   │   │   ├── PuzzleInput.tsx # Word entry & controls
│   │   │   ├── LetterWheel.tsx # Canvas-based letter UI
│   │   │   ├── FoundWords.tsx  # List of found words
│   │   │   ├── PuzzleStats.tsx # Progress & hint panel
│   │   │   ├── GameRules.tsx   # Rules display
│   │   │   ├── CompletionModal.tsx # Completion screen
│   │   │   ├── RewardSummary.tsx   # Reward breakdown
│   │   │   └── HintPanel.tsx   # Hint management
│   │   ├── cards/
│   │   │   └── CanvasCard.tsx  # Character card display
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ProgressBar.tsx
│   │       └── Tabs.tsx
│   │
│   ├── pages/                  # Route-level components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx
│   │   ├── Puzzle.tsx
│   │   ├── Collection.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   │
│   ├── store/                  # Redux state management
│   │   ├── index.ts            # Store configuration
│   │   ├── authSlice.ts        # Authentication state
│   │   ├── userSlice.ts        # User profile & stats
│   │   ├── puzzleSlice.ts      # Puzzle game state
│   │   ├── cardsSlice.ts       # Card collection state
│   │   ├── leaderboardSlice.ts # Leaderboard state
│   │   ├── achievementsSlice.ts # Achievements state
│   │   └── settingsSlice.ts    # User preferences
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── usePuzzleSubmission.ts   # Word submission logic
│   │   ├── usePuzzleCompletion.ts   # Completion detection & rewards
│   │   ├── usePuzzleHints.ts        # Hint reveal logic
│   │   ├── usePuzzleKeyboard.ts     # Keyboard input handling
│   │   └── rewardCalculator.ts      # Reward calculation
│   │
│   ├── services/               # API & business logic
│   │   ├── api.ts              # HTTP client utilities
│   │   ├── authService.ts      # Auth operations
│   │   ├── puzzleService.ts    # Puzzle data & validation
│   │   ├── cardService.ts      # Card mechanics
│   │   ├── leaderboardService.ts
│   │   └── profileService.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── constants/              # App constants
│   │   └── index.ts            # Daily puzzles & card data
│   │
│   ├── utils/                  # Utility functions
│   │   ├── audio.ts            # Sound effects
│   │   └── preloader.ts        # Asset preloading
│   │
│   └── assets/                 # Static assets (if any)
│
├── public/                     # Static public assets
│   └── assets/
│       ├── background/         # Background images
│       └── card_pack/          # Character card images
│
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Architecture Layers

### 1. **Presentation Layer (Components)**

Components are organized by feature area and UI hierarchy:

#### Page Components (`pages/`)
Top-level route components that compose entire page views.

**Example:** `Puzzle.tsx`
```typescript
- Coordinates puzzle page layout
- Wires hooks (submission, hints, completion, keyboard)
- Passes data to child components
- Manages loading and error states
```

#### Feature Components (`components/puzzle/`, `components/cards/`, etc.)
Reusable components for specific features.

**Key Puzzle Components:**
- `PuzzleInput.tsx` - Letter wheel & word entry controls
- `LetterWheel.tsx` - Canvas-based interactive letter grid
- `FoundWords.tsx` - Scrollable list of found words (6 per row)
- `PuzzleStats.tsx` - Progress bar, hints, reward preview
- `CompletionModal.tsx` - Modal showing completion rewards
- `GameRules.tsx` - Puzzle rules display

#### UI Components (`components/ui/`)
Reusable, presentation-only components with no business logic.

**Examples:**
- `Button.tsx` - Primary, secondary, outline, danger variants
- `Card.tsx` - Flexible card container
- `Badge.tsx` - Status badges
- `Modal.tsx` - Modal dialog container
- `ProgressBar.tsx` - XP/streak progress visualization

### 2. **State Management Layer (Redux Toolkit)**

Centralized state with slices for each domain:

```
store/
├── authSlice.ts      # { isAuthenticated, user credentials }
├── userSlice.ts      # { xp, coins, belt, rank, stats, streak }
├── puzzleSlice.ts    # { puzzle data, current word, found words, hints }
├── cardsSlice.ts     # { unlocked cards, equipped card, hint capacity }
├── achievementsSlice.ts # { achievements, unlock states, progress }
├── leaderboardSlice.ts  # { leaderboard entries, user rank }
└── settingsSlice.ts  # { theme, sound, notifications }
```

**State Persistence:**
- User & puzzle state auto-saved to localStorage
- Restored on app initialization

### 3. **Hooks Layer (Custom Hooks)**

Encapsulate complex logic into reusable hooks:

| Hook | Purpose |
|------|---------|
| `usePuzzleSubmission` | Handle word submission, validation, XP tracking |
| `usePuzzleCompletion` | Detect puzzle completion, calculate rewards, show modal |
| `usePuzzleHints` | Manage hint reveal, consumption, card bonuses |
| `usePuzzleKeyboard` | Handle keyboard shortcuts (letters, Enter, Esc, R, H) |
| `rewardCalculator` | Calculate XP/coins based on difficulty, pangrams, streak |

### 4. **Services Layer**

Business logic and API integration:

| Service | Responsibility |
|---------|-----------------|
| `puzzleService` | Fetch daily puzzle, validate words, check pangrams |
| `authService` | Login/register, credential validation |
| `cardService` | Draw cards, calculate duplicates, refund logic |
| `leaderboardService` | Fetch leaderboard, rank calculation |
| `profileService` | User stats, achievement checks |

### 5. **Types Layer**

Centralized TypeScript types for type safety across the app:

```typescript
// Core domain types
interface User { xp, coins, belt, rank, stats, ... }
interface DailyPuzzle { letters, centerLetter, validWords, ... }
interface CharacterCard { id, name, rarity, bonuses, ... }
interface Achievement { title, description, unlocked, progress, ... }
interface FoundWord { text, score, isPangram }
```

---

## Core Features & Components

### 1. Authentication Flow

**Components:**
- `ProtectedRoute` - Guards routes, redirects unauthenticated users
- `PublicRoute` - Prevents authenticated users from accessing login/register

**Files:**
- `pages/Login.tsx` - Username/password input
- `pages/Register.tsx` - Registration form
- `store/authSlice.ts` - Auth state
- `services/authService.ts` - Auth logic

**Flow:**
1. User logs in/registers on public route
2. Credentials stored in Redux + localStorage
3. Auth state checked on route access
4. ProtectedRoute redirects to /login if unauthenticated

### 2. Daily Puzzle Gameplay

**Pages:**
- `Puzzle.tsx` - Main puzzle container

**Components:**
- `LetterWheel.tsx` - Canvas-rendered letter grid (center + 6 outer)
- `PuzzleInput.tsx` - Current word display, controls (clear, shuffle, submit)
- `FoundWords.tsx` - Grid of found words (max 6 per row, sorted by length)
- `PuzzleStats.tsx` - Collapsible panel with progress, hints, rewards
- `CompletionModal.tsx` - Shows XP, coins, difficulty, words found

**Hooks:**
- `usePuzzleSubmission` - Word validation & state updates
- `usePuzzleCompletion` - Completion detection, reward application
- `usePuzzleHints` - Hint reveal on card bonus
- `usePuzzleKeyboard` - Keyboard input (A-Z, Enter, Backspace, Esc, R, H)

**State Flow:**
1. User clicks letters to build word
2. Keyboard shortcuts add/remove letters
3. Submit triggers `usePuzzleSubmission`
4. Valid word added to found list, score updated
5. Completion hook monitors word count
6. At target (e.g., 15 words), puzzle completes, rewards awarded
7. Completion modal displays final score & reward breakdown

### 3. Character Card Collection

**Pages:**
- `Collection.tsx` - Card grid with filters

**Component:**
- `CanvasCard.tsx` - Individual card display with rarity badge

**State:**
- `cardsSlice.ts` - Unlocked cards, equipped card, hint bonuses

**Features:**
- Draw card from chest
- Equip card for gameplay bonus (e.g., +1 free hint)
- Filter by rarity (common, rare, epic, legendary)
- Duplicate refund system

### 4. Player Progression

**Tracked Metrics:**
- XP → Belt rank progression (White to Black)
- Coins → In-game currency
- Daily streak → Consecutive day bonus
- Stats: Words found, cards collected, achievements, puzzles completed

**Reward Flow:**
1. Puzzle completion triggers reward calculation
2. `rewardCalculator` computes XP based on:
   - Base difficulty reward
   - Pangram count bonus
   - Streak multiplier
   - Character card bonus
3. Rewards applied to user state
4. New belt rank calculated if XP threshold reached

### 5. Leaderboard

**Pages:**
- `Leaderboard.tsx` - Rank table with user position

**State:**
- `leaderboardSlice.ts` - Top 100 players + current user rank

### 6. Profile & Settings

**Pages:**
- `Profile.tsx` - User stats, belt progress, achievements, equipped card
- `Settings.tsx` - Theme toggle, sound toggle, reset progress

**State:**
- `settingsSlice.ts` - Dark mode, sound, notifications

---

## State Management

### Redux Store Structure

```typescript
RootState {
  auth: {
    isAuthenticated: boolean;
    user: { username, email, token };
  };
  
  user: {
    username: string;
    xp: number;
    coins: number;
    belt: BeltColor;
    rank: string;
    streak: number;
    dailyStreak: number;
    stats: { wordsFound, cardsCollected, achievementsEarned, ... };
  };
  
  puzzle: {
    activePuzzleId: string;
    letters: string[];
    centerLetter: string;
    currentWord: string;
    wordsFound: FoundWord[];
    score: number;
    completed: boolean;
    locked: boolean;
    pangrams: string[];
    pangramsFound: string[];
    requiredWordsToComplete: number;
    lastRejectedReason: 'duplicate' | 'invalid' | null;
    lastRejectedWord: string | null;
  };
  
  cards: {
    unlocked: CharacterCard[];
    equipped: CharacterCard | null;
    availableHints: number;
    usedHints: number;
    rewardExpiration: number | null;
  };
  
  leaderboard: {
    entries: LeaderboardEntry[];
    userRank: number;
  };
  
  achievements: {
    achievements: Achievement[];
    unlockedCount: number;
  };
  
  settings: {
    darkMode: boolean;
    soundEnabled: boolean;
  };
}
```

### Persistence Strategy

**LocalStorage Keys:**
- `kungfu_user` - User profile, XP, coins, stats
- `kungfu_cards` - Unlocked cards, equipped card
- `kungfu_achievements` - Achievement states
- `kungfu_settings` - Theme, sound preferences

**Auto-save on State Changes:**
```typescript
persist(state: T) => localStorage.setItem(key, JSON.stringify(state))
```

---

## Routing & Authentication

### Route Structure

```
/
├── /login (PublicRoute)
├── /register (PublicRoute)
├── / (ProtectedRoute → Layout)
│   ├── /home
│   ├── /puzzle
│   ├── /collection
│   ├── /leaderboard
│   ├── /profile
│   └── /settings
```

### Auth Guards

**ProtectedRoute:**
- Checks Redux auth state
- Redirects to /login if unauthenticated
- Otherwise renders component

**PublicRoute:**
- Checks Redux auth state
- Redirects to /home if authenticated
- Otherwise renders component

### Layout Structure

**Layout.tsx**
```
┌────────────────────────────────────────┐
│          TopBar (user info)            │
├────────────────────────────────────────┤
│                                        │
│         Outlet (Page Content)          │
│                                        │
├────────────────────────────────────────┤
│     BottomNav (mobile nav)             │
└────────────────────────────────────────┘
```

---

## Data Flow

### Example: Word Submission Flow

```
User Input (Letter Click)
        ↓
selectLetter (dispatch to puzzleSlice)
        ↓
currentWord updated in Redux
        ↓
User presses Enter
        ↓
usePuzzleSubmission.handleSubmit()
        ↓
puzzleService.submitWord(word)
        ↓
Word validation logic:
  1. Check duplicate (wordsFound)
  2. Check valid word (validWords list)
  3. Check center letter included
        ↓
Valid word?
  ├─ YES:
  │   ├─ submitWordSuccess (add to wordsFound, update score)
  │   ├─ currentWord cleared
  │   └─ usePuzzleCompletion checks: wordsFound.length >= requiredWordsToComplete?
  │         ├─ YES: Complete puzzle
  │         │   ├─ Calculate rewards (rewardCalculator)
  │         │   ├─ Dispatch addXp, addCoins, addWordsFound
  │         │   ├─ Dispatch completePuzzle, lockPuzzle
  │         │   └─ Show CompletionModal
  │         └─ NO: Continue gameplay
  └─ NO:
      ├─ submitWordFailure
      ├─ Check if duplicate → set lastRejectedReason='duplicate'
      ├─ Check if invalid → set lastRejectedReason='invalid'
      └─ PuzzleInput displays feedback banner (red pulsing for duplicate)
```

### Puzzle Completion & Rewards

```
puzzleCompleted → usePuzzleCompletion hook
        ↓
rewardCalculator({
  difficulty: 'Hard',
  pangramsFound: 2,
  streak: 5,
  characterMultiplier: 1.2
})
        ↓
Returns: {
  xp: 456,
  coins: 175,
  pangramBonus: 150,
  streakBonus: 50,
  characterBonus: 60,
  achievement?: "Pangram Hunter"
}
        ↓
dispatch(addXp(456))
dispatch(addCoins(175))
dispatch(addWordsFound(15))
dispatch(updateHighestScore(1250))
dispatch(incrementPuzzlesCompleted())
        ↓
User stats updated + persisted to localStorage
        ↓
CompletionModal displays rewards
```

---

## Build & Development

### Development Server
```bash
npm run dev
# Runs Vite dev server on http://localhost:5173
# HMR enabled for fast refresh
```

### Production Build
```bash
npm run build
# Runs: tsc -b && vite build
# Outputs to: dist/
# Generates optimized CSS, JS bundles with tree-shaking
```

### Type Checking
```bash
tsc -b
# Validates TypeScript without emitting
```

### Linting
```bash
npm run lint
# Runs oxlint (Rust-based, faster than ESLint)
```

### Vite Configuration (`vite.config.ts`)
- React plugin for JSX transformation
- Optimized dev server with HMR
- Production builds with code splitting

### TypeScript Configuration
- Target: ES2020
- Strict mode enabled
- JSX: react-jsx

### Tailwind Configuration (`tailwind.config.js`)
- Custom color palette (gold, jade, parchment, wood)
- Dark mode support
- Custom theme tokens

---

## Key Design Patterns

### 1. **Redux Slice Pattern**
```typescript
// Clear separation of concerns
const slice = createSlice({
  name: 'puzzle',
  initialState,
  reducers: {
    loadPuzzle: (state, action) => { ... },
    submitWordSuccess: (state, action) => { ... },
  }
});
```

### 2. **Custom Hooks for Logic**
```typescript
// Encapsulate complex side effects
const usePuzzleCompletion = () => {
  useEffect(() => { ... }, [dependencies]);
  return { isCompleted, rewards, showModal };
};
```

### 3. **Typed Service Layer**
```typescript
// Interface-based design for testability
interface PuzzleService {
  getDailyPuzzle(): Promise<Response<DailyPuzzle>>;
  submitWord(puzzleId, word): Promise<Response<WordResult>>;
}
```

### 4. **Component Composition**
```typescript
// Prop drilling minimized via Redux
<Puzzle>
  <PuzzleInput onSubmit={submission.handleSubmit} />
  <PuzzleStats onHint={hints.handleRevealHint} />
  <FoundWords />
  <CompletionModal isOpen={completion.showCompletionModal} />
</Puzzle>
```

### 5. **LocalStorage Persistence**
```typescript
// Auto-save pattern on state mutations
const persist = (state: User) => 
  localStorage.setItem('kungfu_user', JSON.stringify(state));
```

### 6. **Memoization for Performance**
```typescript
// Prevent unnecessary re-renders
const filteredWords = useMemo(() => {
  return puzzle.wordsFound
    .filter(...)
    .sort(...)
}, [query, puzzle.wordsFound]);

const wordRows = useMemo(() => {
  // Group into rows of 6
}, [filteredWords]);
```

---

## Styling Approach

### Tailwind CSS + Custom Utilities

**Color Palette:**
```javascript
colors: {
  gold: '#D4A574',
  jade: '#2D5A4F',
  parchment: '#F5E6D3',
  wood: '#5C4033',
}
```

**Dark Mode Support:**
```html
<div class="bg-white dark:bg-slate-900">
```

**Responsive Design:**
```html
<!-- Mobile-first approach -->
<div class="grid gap-6 lg:grid-cols-12">
```

### Custom CSS

**App.css** - Global component overrides
**index.css** - Typography, resets, animations

---

## Performance Optimizations

1. **Code Splitting**: Vite auto-splits at routes
2. **Asset Preloading**: `utils/preloader.ts` loads images on startup
3. **Memoization**: useMemo for expensive computations
4. **Redux Selectors**: Prevents unnecessary component re-renders
5. **Canvas Rendering**: LetterWheel uses canvas for performance
6. **LocalStorage Caching**: Reduces API calls

---

## Error Handling

### Error Patterns

**Boundary Errors:**
```typescript
if (!puzzle.activePuzzleId) {
  return <AlertCircle /> with error message
}
```

**Service Errors:**
```typescript
if (!response.success) {
  dispatch(submitWordFailure({ retainStreak: false }));
  return "error";
}
```

**Validation Errors:**
```typescript
if (!centerLetterIncluded) {
  dispatch(submitWordFailure({ retainStreak: true }));
  return false;
}
```

---

## Future Enhancements

1. **Backend Integration**
   - Replace mock services with real API calls
   - Persistent server-side state
   - Real leaderboard rankings

2. **Advanced Features**
   - Real-time multiplayer puzzles
   - Seasonal challenges
   - Special events with limited-time cards
   - Daily streaks with visual rewards

3. **Performance**
   - Service workers for offline play
   - IndexedDB for larger data persistence
   - Image optimization & lazy loading

4. **Analytics**
   - User engagement tracking
   - Gameplay metrics
   - A/B testing support

---

## Deployment Checklist

- [ ] Run `npm run build` and verify no errors
- [ ] Check `dist/` output for size optimizations
- [ ] Test in production build locally: `npm run preview`
- [ ] Verify all routes and auth flows
- [ ] Test dark mode and responsive layouts
- [ ] Confirm localStorage persistence
- [ ] Test on mobile devices
- [ ] Optimize images in `public/assets/`
- [ ] Set up deployment (Vercel, Netlify, GitHub Pages, etc.)

---

## Developer Guide

### Adding a New Page

1. Create `pages/MyPage.tsx`
2. Add route to `App.tsx`
3. Create Redux slice if needed
4. Import components from `components/`
5. Use hooks for complex logic

### Adding a New Component

1. Create `components/feature/MyComponent.tsx`
2. Define props interface
3. Use Tailwind for styling
4. Export from `components/index.ts` (optional)

### Adding State

1. Create slice in `store/MySlice.ts`
2. Add to store config in `store/index.ts`
3. Export actions and reducer
4. Use `useAppSelector` and `dispatch` in components

### Adding a Hook

1. Create `hooks/useMyHook.ts`
2. Handle side effects with `useEffect`
3. Return derived state/functions
4. Use in pages/components

---

## Conclusion

The Kung Fu Word Quest frontend is architected for **scalability**, **maintainability**, and **performance**. Clear separation of concerns across components, state, services, and hooks enables rapid feature development while maintaining code quality. The use of Redux Toolkit, TypeScript, and Tailwind CSS provides a solid foundation for future enhancements.
