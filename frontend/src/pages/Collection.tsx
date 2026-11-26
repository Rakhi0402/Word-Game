import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setRarityFilter,
  getCharacterMultiplier,
  replaceCards,
} from '../store/cardsSlice';
import { setCharacterMultiplier } from '../store/userSlice';
import { fetchDashboard } from '../store/dashboardSlice';
import { mapCollectionToCards } from '../store/mapCollection';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { CanvasCard } from '../components/cards/CanvasCard';
import { CHARACTER_CARDS } from '../constants';
import { CHEST_DRAW_COST } from '../constants/rewards';
import type { CharacterCard, RarityType } from '../types';
import { cardService } from '../services/cardService';
import { playSound } from '../utils/audio';
import { Lock, Sparkles, Share2, Coins, HelpCircle } from 'lucide-react';
import { ApiClientError } from '../types/auth';

type DrawResult = {
  card: CharacterCard;
  isDuplicate: boolean;
  isExhaustedRestore: boolean;
  refundAmount: number;
  usedFreeToken: boolean;
};

const mapCard = (c: {
  id: string;
  name: string;
  rarity: string;
  image: string;
  stars: number;
  bonuses?: string[];
  description?: string;
}): CharacterCard => {
  const local = CHARACTER_CARDS.find((x) => x.id === c.id);
  return {
    id: c.id,
    name: c.name || local?.name || c.id,
    rarity: (c.rarity as RarityType) || local?.rarity || 'common',
    image: c.image || local?.image || '',
    stars: c.stars ?? local?.stars ?? 1,
    bonuses: c.bonuses || local?.bonuses || [],
    description: c.description || local?.description || '',
  };
};

export const Collection: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const cards = useAppSelector((state) => state.cards);
  const soundEnabled = useAppSelector((state) => state.settings.sound);

  const [selectedCard, setSelectedCard] = useState<CharacterCard | null>(null);
  const [shareCard, setShareCard] = useState<CharacterCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CharacterCard[]>([]);

  const loadCollection = useCallback(async (force = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [serverCatalog, collection] = await Promise.all([
        cardService.getAllCards({ force }),
        cardService.getCollection({ force }),
      ]);
      // Prefer local pack art so CanvasCard always has a preloaded image.
      const mappedCatalog =
        serverCatalog?.length > 0
          ? serverCatalog.map(mapCard)
          : CHARACTER_CARDS;
      const withLocalArt = mappedCatalog.map((c) => {
        const local = CHARACTER_CARDS.find((x) => x.id === c.id);
        return local ? { ...c, image: local.image || c.image } : c;
      });
      setCatalog(withLocalArt.length > 0 ? withLocalArt : CHARACTER_CARDS);
      dispatch(replaceCards(mapCollectionToCards(collection)));
      if (collection.equippedCardId) {
        dispatch(setCharacterMultiplier(getCharacterMultiplier(collection.equippedCardId)));
      }
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Could not load collection.');
      setCatalog(CHARACTER_CARDS);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    // Force network so stale empty IndexedDB ownership does not hide starter scrolls.
    void loadCollection(true);
  }, [loadCollection]);

  const filterOptions = [
    { id: 'all', label: 'All Scrolls' },
    { id: 'common', label: 'Common' },
    { id: 'rare', label: 'Rare' },
    { id: 'epic', label: 'Epic' },
    { id: 'legendary', label: 'Legendary' },
  ];

  const filteredCards = useMemo(
    () =>
      (catalog.length > 0 ? catalog : CHARACTER_CARDS).filter((card) => {
        if (cards.rarityFilter === 'all') return true;
        return card.rarity === cards.rarityFilter;
      }),
    [catalog, cards.rarityFilter]
  );

  const handleDrawCard = async () => {
    const useToken = user.freeChestTokens > 0;
    if (!useToken && user.coins < CHEST_DRAW_COST) {
      playSound.failure(soundEnabled);
      alert(`You need ${CHEST_DRAW_COST} coins to draw from the Sacred Scroll Chest!`);
      return;
    }

    setIsDrawing(true);
    playSound.success(soundEnabled);

    try {
      const result = await cardService.drawCard();
      const pulled = mapCard(result.card);
      setDrawResult({
        card: pulled,
        isDuplicate: result.duplicate,
        isExhaustedRestore: Boolean(result.exhaustedRestore),
        refundAmount: result.refundAmount,
        usedFreeToken: Boolean(result.usedFreeToken ?? useToken),
      });
      await Promise.all([
        loadCollection(true),
        dispatch(fetchDashboard({ force: true })),
      ]);
    } catch (err) {
      playSound.failure(soundEnabled);
      alert(err instanceof ApiClientError ? err.message : 'Draw failed.');
    }
    setIsDrawing(false);
  };

  const handleCopyLink = async () => {
    if (!shareCard) return;
    const shareText = `Check out my ${shareCard.name} scroll in Kung Fu Word Quest! (${shareCard.rarity})`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      playSound.click(soundEnabled);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert(shareText);
    }
  };

  const handleEquip = async (cardId: string) => {
    const entry = cards.inventory[cardId];
    if (!entry || entry.status !== 'available') {
      playSound.failure(soundEnabled);
      return;
    }
    try {
      const collection = await cardService.equipCard(cardId);
      dispatch(replaceCards(mapCollectionToCards(collection)));
      dispatch(setCharacterMultiplier(getCharacterMultiplier(cardId)));
      await dispatch(fetchDashboard({ force: true }));
    } catch (err) {
      playSound.failure(soundEnabled);
      alert(err instanceof ApiClientError ? err.message : 'Could not equip card.');
    }
  };

  const isUnlocked = (cardId: string) => cards.unlockedCardIds.includes(cardId);
  const isEquipped = (cardId: string) => cards.equippedCardId === cardId;
  const isExhausted = (cardId: string) => cards.inventory[cardId]?.status === 'exhausted';
  const chargesOf = (cardId: string) => cards.inventory[cardId]?.chargesRemaining ?? 0;

  const canAffordChest = user.freeChestTokens > 0 || user.coins >= CHEST_DRAW_COST;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-parchment/70">
        Loading scroll collection…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-sm text-red-300">{loadError}</p>
        <Button variant="primary" onClick={() => void loadCollection()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 border-b border-gold/15 pb-4 sm:flex-row">
        <div>
          <h2 className="font-martial text-3xl font-extrabold uppercase tracking-wider text-black text-gold-glow dark:text-[#f7d36b]">
            Scroll Collection
          </h2>
          <p className="text-sm font-medium text-jade-dark/90 dark:text-parchment/70">
            Same star count = same bonuses. Charges deplete on puzzle clear; exhausted scrolls need a
            chest restore or streak refill.
          </p>
          {(user.streakShields > 0 || user.freeChestTokens > 0) && (
            <p className="mt-1 text-xs text-gold">
              Day Streak Shields: {user.streakShields} · Free chest tokens: {user.freeChestTokens}
            </p>
          )}
        </div>

        <Button
          variant="primary"
          onClick={() => void handleDrawCard()}
          disabled={isDrawing || !canAffordChest}
          className="flex shrink-0 animate-lantern items-center space-x-2 border-b-4 border-gold-dark"
        >
          <Sparkles className="h-4 w-4" />
          <span>
            {user.freeChestTokens > 0
              ? `Free Summon (${user.freeChestTokens})`
              : `Summon Scroll (${CHEST_DRAW_COST})`}
          </span>
        </Button>
      </div>

      <Tabs
        options={filterOptions}
        activeTab={cards.rarityFilter}
        onChange={(id) => dispatch(setRarityFilter(id as RarityType | 'all'))}
      />

      <div className="grid grid-cols-2 gap-20 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredCards.map((card) => {
          const unlocked = isUnlocked(card.id);
          const equipped = isEquipped(card.id);
          const exhausted = isExhausted(card.id);

          return (
            <div key={card.id} className="relative">
              <div
                onClick={() => {
                  if (unlocked) {
                    setSelectedCard(card);
                    playSound.click(soundEnabled);
                  } else {
                    playSound.failure(soundEnabled);
                  }
                }}
                className={`relative flex cursor-pointer select-none flex-col items-center rounded-2xl p-1 transition-all duration-300 ${
                  unlocked
                    ? exhausted
                      ? 'border-red-500/40 opacity-60 hover:scale-105'
                      : 'border-gold hover:scale-105 hover:shadow-xl'
                    : 'cursor-not-allowed opacity-20'
                }`}
              >
                <CanvasCard card={card} width={210} height={294} interactive={false} />

                {equipped && (
                  <span className="absolute left-2 top-2 rounded-full border border-emerald-400 bg-emerald-600 px-2 py-0.5 text-[8px] font-black uppercase text-white shadow">
                    Active
                  </span>
                )}
                {unlocked && exhausted && (
                  <span className="absolute right-2 top-2 rounded-full border border-red-400 bg-red-900/90 px-2 py-0.5 text-[8px] font-black uppercase text-white shadow">
                    Spent
                  </span>
                )}
                {unlocked && !exhausted && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold text-gold">
                    {chargesOf(card.id)} charges
                  </span>
                )}
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl">
                    <Lock className="h-6 w-6 text-gold" />
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gold">
                      Locked
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="py-16 text-center text-jade-dark/50 dark:text-parchment/40">
          <HelpCircle className="mx-auto mb-2 h-12 w-12 text-gold" />
          <p className="text-sm font-bold uppercase tracking-wider">No scrolls found in this category</p>
        </div>
      )}

      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title="Scroll Detail"
          variant="wood"
        >
          <div className="flex flex-col items-center space-y-4 py-2">
            <CanvasCard card={selectedCard} width={360} height={448} interactive={false} />
            <div className="w-full space-y-2 text-center">
              <h3 className="font-martial text-xl font-black uppercase tracking-wider text-gold text-gold-glow">
                {selectedCard.name}
              </h3>
              <Badge rarity={selectedCard.rarity}>
                {selectedCard.rarity} · {selectedCard.stars}★
              </Badge>
              <p className="mt-2 px-4 text-xs italic leading-relaxed text-parchment/70">
                &ldquo;{selectedCard.description}&rdquo;
              </p>

              <div className="mx-auto mt-4 max-w-sm space-y-1.5 rounded-xl border border-gold/20 bg-jade-dark/50 p-3 text-left">
                <span className="mb-1 block border-b border-gold/10 pb-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                  Star-tier blessings ({selectedCard.stars}★)
                </span>
                {selectedCard.bonuses.map((bonus, idx) => (
                  <p key={idx} className="text-xs font-medium text-parchment/90">
                    {bonus}
                  </p>
                ))}
                {isUnlocked(selectedCard.id) && (
                  <p className="pt-2 text-xs text-gold">
                    Status:{' '}
                    {isExhausted(selectedCard.id)
                      ? 'Spent Scroll (unavailable)'
                      : `${chargesOf(selectedCard.id)} charges remaining`}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center space-x-3 border-t border-gold/20 pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    handleEquip(selectedCard.id);
                    playSound.success(soundEnabled);
                    setSelectedCard(null);
                  }}
                  disabled={
                    isEquipped(selectedCard.id) ||
                    isExhausted(selectedCard.id) ||
                    !isUnlocked(selectedCard.id)
                  }
                  className="px-6"
                >
                  {isExhausted(selectedCard.id)
                    ? 'Exhausted'
                    : isEquipped(selectedCard.id)
                      ? 'Equipped'
                      : 'Equip Scroll'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShareCard(selectedCard);
                    setSelectedCard(null);
                  }}
                  className="flex items-center space-x-1 px-4"
                >
                  <Share2 className="h-4 w-4" /> <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {shareCard && (
        <Modal isOpen={!!shareCard} onClose={() => setShareCard(null)} title="Share Scroll" variant="wood">
          <div className="flex flex-col items-center space-y-4 py-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold">
              Disciple {user.username} showcases:
            </h4>
            <div id="share-card-canvas" className="flex justify-center">
              <CanvasCard card={shareCard} width={300} height={420} interactive={false} />
            </div>
            <div className="mt-4 flex w-full max-w-xs flex-col space-y-2 border-t border-gold/20 pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${shareCard.id}_showcase.png`;
                  const canvasEl = document.querySelector('#share-card-canvas canvas');
                  if (canvasEl instanceof HTMLCanvasElement) {
                    link.href = canvasEl.toDataURL('image/png');
                    link.click();
                    playSound.success(soundEnabled);
                  }
                }}
                fullWidth
              >
                Download Image
              </Button>
              <Button variant="outline" onClick={() => void handleCopyLink()} fullWidth>
                {copiedLink ? 'Copied Scroll Link!' : 'Copy Showcase Link'}
              </Button>
              <Button variant="ghost" onClick={() => setShareCard(null)} fullWidth>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isDrawing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="animate-pulse space-y-6 text-center">
            <span className="block animate-bounce text-7xl">📦</span>
            <h2 className="font-martial text-2xl font-black uppercase tracking-widest text-gold text-gold-glow">
              Summoning Scroll...
            </h2>
          </div>
        </div>
      )}

      {drawResult && (
        <Modal
          isOpen={!!drawResult}
          onClose={() => setDrawResult(null)}
          title="Summoning Result"
          variant="wood"
        >
          <div className="space-y-5 py-4 text-center">
            <h3 className="font-martial text-xl font-extrabold uppercase tracking-widest text-gold text-gold-glow">
              {drawResult.isExhaustedRestore
                ? 'Scroll Restored!'
                : drawResult.isDuplicate
                  ? 'Duplicate Scroll!'
                  : 'New Scroll Summoned!'}
            </h3>
            <div className="flex justify-center">
              <CanvasCard card={drawResult.card} width={300} height={420} interactive={false} />
            </div>
            {drawResult.isExhaustedRestore ? (
              <p className="text-sm leading-relaxed text-parchment/80">
                <span className="font-bold text-gold">{drawResult.card.name}</span> charges fully
                restored.
              </p>
            ) : drawResult.isDuplicate ? (
              <div className="mt-2 flex items-center justify-center space-x-1.5 text-base font-bold text-gold">
                <Coins className="h-5 w-5 animate-pulse" />
                <span>Refunded +{drawResult.refundAmount} Coins!</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-parchment/80">
                Unlocked <span className="font-bold text-gold">{drawResult.card.name}</span> with full
                charges.
              </p>
            )}
            {drawResult.usedFreeToken && (
              <p className="text-xs text-parchment/60">Used a free chest token.</p>
            )}
            <div className="flex justify-center border-t border-gold/20 pt-4">
              <Button variant="primary" onClick={() => setDrawResult(null)} className="px-8">
                Continue
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
