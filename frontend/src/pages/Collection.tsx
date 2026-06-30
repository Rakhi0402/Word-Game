import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { unlockCard, equipCard, setRarityFilter } from '../store/cardsSlice';
import { addCoins, deductCoins, incrementCardsCount } from '../store/userSlice';
import { evaluateAchievements } from '../store/achievementsSlice';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { CanvasCard } from '../components/cards/CanvasCard';
import { CHARACTER_CARDS } from '../constants';
import type { CharacterCard, RarityType } from '../types';
import { cardService } from '../services/cardService';
import { playSound } from '../utils/audio';
import { Lock, Sparkles, Share2, Coins, HelpCircle } from 'lucide-react';

export const Collection: React.FC = () => {
  const dispatch = useAppDispatch();

  // State selectors
  const user = useAppSelector(state => state.user);
  const cards = useAppSelector(state => state.cards);
  const soundEnabled = useAppSelector(state => state.settings.sound);

  // Local component states
  const [selectedCard, setSelectedCard] = useState<CharacterCard | null>(null);
  const [shareCard, setShareCard] = useState<CharacterCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<{ card: CharacterCard; isDuplicate: boolean; refundAmount: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Scrolls' },
    { id: 'common', label: 'Common' },
    { id: 'rare', label: 'Rare' },
    { id: 'epic', label: 'Epic' },
    { id: 'legendary', label: 'Legendary' }
  ];

  // Filter cards list
  const filteredCards = CHARACTER_CARDS.filter(card => {
    if (cards.rarityFilter === 'all') return true;
    return card.rarity === cards.rarityFilter;
  });

  // Chest gacha draw
  const handleDrawCard = async () => {
    if (user.coins < 50) {
      playSound.failure(soundEnabled);
      alert("You need 50 coins to draw from the Sacred Scroll Chest!");
      return;
    }

    setIsDrawing(true);
    playSound.success(soundEnabled);

    // Call service to pull random card
    const res = await cardService.drawRandomCard(cards.unlockedCardIds);

    if (res.success && res.data) {
      const pulled = res.data.card;
      
      // Deduct coins
      dispatch(deductCoins(50));

      if (res.data.isDuplicate) {
        // Refund coins
        dispatch(addCoins(res.data.refundAmount));
      } else {
        // Unlock card
        dispatch(unlockCard(pulled.id));
        dispatch(incrementCardsCount());
        
        // Trigger achievements check
        dispatch(evaluateAchievements({
          stats: {
            ...user.stats,
            cardsCollected: user.stats.cardsCollected + 1
          },
          xp: user.xp
        }));
      }

      setDrawResult(res.data);
    }
    setIsDrawing(false);
  };

  const handleCopyLink = () => {
    if (!shareCard) return;
    const shareUrl = `${window.location.origin}/share/${shareCard.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    playSound.click(soundEnabled);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isUnlocked = (cardId: string) => cards.unlockedCardIds.includes(cardId);
  const isEquipped = (cardId: string) => cards.equippedCardId === cardId;

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col justify-between items-center gap-4 sm:flex-row border-b border-gold/15 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-black text-gold-glow dark:text-[#f7d36b] uppercase font-martial tracking-wider">
            Scroll Collection
          </h2>
          <p className="text-sm text-jade-dark/90 dark:text-parchment/70 font-medium">
            Unlock legendary Furious Five character scrolls to boost your word decoding stats.
          </p>
        </div>

        {/* Chest Summoning Button */}
        <Button 
          variant="primary" 
          onClick={handleDrawCard} 
          disabled={isDrawing || user.coins < 50}
          className="flex items-center space-x-2 shrink-0 animate-lantern border-b-4 border-gold-dark"
        >
          <Sparkles className="h-4 w-4" />
          <span>Summon Scroll (50)</span>
        </Button>
      </div>

      {/* Tabs Filter */}
      <Tabs 
        options={filterOptions} 
        activeTab={cards.rarityFilter} 
        onChange={(id) => dispatch(setRarityFilter(id as RarityType | 'all'))} 
      />

      {/* Cards Grid */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredCards.map((card) => {
          const unlocked = isUnlocked(card.id);
          const equipped = isEquipped(card.id);

          return (
            <div key={card.id} className="relative">
              {/* Card Container */}
              <div 
                onClick={() => {
                  if (unlocked) {
                    setSelectedCard(card);
                    playSound.click(soundEnabled);
                  } else {
                    playSound.failure(soundEnabled);
                  }
                }}
                className={`
                  relative flex flex-col items-center p-1 rounded-2xl border-2 transition-all duration-300 select-none cursor-pointer
                  ${unlocked 
                    ? 'border-gold bg-parchment/40 dark:bg-jade-gold/20 hover:scale-105 hover:shadow-xl' 
                    : 'border-jade-dark/20 dark:border-parchment/10 bg-jade-dark/10 opacity-40 cursor-not-allowed'
                  }
                `}
              >
                {/* Visual Card Artwork Canvas Preview */}
                <CanvasCard card={card} width={210} height={294} interactive={false} />

                {/* Badge Overlay */}
                {equipped && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow border border-emerald-400">
                    Active
                  </span>
                )}

                {/* Lock Overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                    <Lock className="h-6 w-6 text-gold" />
                    <span className="text-[9px] font-bold text-gold uppercase tracking-widest mt-1">Locked</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16 text-jade-dark/50 dark:text-parchment/40">
          <HelpCircle className="h-12 w-12 mx-auto mb-2 text-gold" />
          <p className="font-bold uppercase tracking-wider text-sm">No scrolls found in this category</p>
          <p className="text-xs mt-1">Summon cards using your gold coins or complete daily puzzles!</p>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title="Scroll Detail 📜"
          variant="wood"
        >
          <div className="flex flex-col items-center space-y-4 py-2">
            {/* Canvas-rendered card inside Modal */}
            <CanvasCard card={selectedCard} width={360} height={448} interactive={false} />

            <div className="w-full text-center space-y-2">
              <h3 className="text-xl font-black text-gold text-gold-glow uppercase tracking-wider font-martial">
                {selectedCard.name}
              </h3>
              <Badge rarity={selectedCard.rarity}>{selectedCard.rarity}</Badge>
              
              <p className="text-xs text-parchment/70 italic px-4 leading-relaxed mt-2">
                "{selectedCard.description}"
              </p>

              {/* Stats Box */}
              <div className="bg-jade-dark/50 border border-gold/20 rounded-xl p-3 text-left max-w-sm mx-auto mt-4 space-y-1.5">
                <span className="block text-[10px] font-bold text-gold uppercase tracking-wider border-b border-gold/10 pb-1 mb-1">
                  Passive Blessings (Bonuses)
                </span>
                {selectedCard.bonuses.map((bonus, idx) => (
                  <p key={idx} className="text-xs text-parchment/90 font-medium">
                    ⚡ {bonus}
                  </p>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 mt-6 border-t border-gold/20 pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    dispatch(equipCard(selectedCard.id));
                    playSound.success(soundEnabled);
                    setSelectedCard(null);
                  }}
                  disabled={isEquipped(selectedCard.id)}
                  className="px-6"
                >
                  {isEquipped(selectedCard.id) ? 'Equipped' : 'Equip Scroll'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShareCard(selectedCard);
                    setSelectedCard(null);
                  }}
                  className="px-4 flex items-center space-x-1"
                >
                  <Share2 className="h-4 w-4" /> <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Share Modal */}
      {shareCard && (
        <Modal
          isOpen={!!shareCard}
          onClose={() => setShareCard(null)}
          title="Share Scroll ☯️"
          variant="wood"
        >
          <div className="flex flex-col items-center space-y-4 py-2">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Disciple {user.username} showcases:</h4>
            
            {/* Card Render */}
            <CanvasCard card={shareCard} width={300} height={420} interactive={false} />

            <p className="text-xs text-parchment/60 text-center max-w-xs leading-relaxed">
              Show off this unlocked Furious Five scroll character and its stats to your guild members!
            </p>

            {/* Actions */}
            <div className="flex flex-col w-full max-w-xs space-y-2 mt-4 border-t border-gold/20 pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${shareCard.id}_showcase.png`;
                  const canvasEl = document.querySelector('canvas');
                  if (canvasEl) {
                    link.href = canvasEl.toDataURL('image/png');
                    link.click();
                    playSound.success(soundEnabled);
                  }
                }}
                fullWidth
              >
                Download Image
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                fullWidth
              >
                {copiedLink ? 'Copied Scroll Link!' : 'Copy Showcase Link'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShareCard(null)}
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Chest Drawing Animation Modal */}
      {isDrawing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center space-y-6 animate-pulse">
            <span className="text-7xl block animate-bounce">📦</span>
            <h2 className="text-2xl font-black text-gold text-gold-glow uppercase tracking-widest font-martial">
              Summoning Scroll...
            </h2>
            <p className="text-xs text-parchment/60 max-w-xs leading-relaxed mx-auto">
              Channels of jade chi are opening. Unrolling the scroll bounds...
            </p>
          </div>
        </div>
      )}

      {/* Gacha Draw Result Modal */}
      {drawResult && (
        <Modal
          isOpen={!!drawResult}
          onClose={() => setDrawResult(null)}
          title="Summoning Result! ☯️"
          variant="wood"
        >
          <div className="text-center space-y-5 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold border-4 border-parchment text-3xl shadow-xl animate-float">
              ✨
            </div>

            <h3 className="text-xl font-extrabold text-gold text-gold-glow uppercase tracking-widest font-martial">
              {drawResult.isDuplicate ? 'Duplicate Scroll!' : 'New Scroll Summoned!'}
            </h3>

            {/* Display Summoned Card */}
            <div className="flex justify-center">
              <CanvasCard card={drawResult.card} width={300} height={420} interactive={false} />
            </div>

            {drawResult.isDuplicate ? (
              <div className="space-y-1">
                <p className="text-sm text-parchment/80 leading-relaxed">
                  You already have <span className="font-bold text-gold">{drawResult.card.name}</span> in your collection.
                </p>
                <div className="flex items-center justify-center space-x-1.5 text-gold font-bold text-base mt-2">
                  <Coins className="h-5 w-5 animate-pulse" />
                  <span>Refunded +{drawResult.refundAmount} Coins!</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-parchment/80 leading-relaxed">
                Congratulations! You successfully unlocked <span className="font-bold text-gold">{drawResult.card.name}</span>. Go to your collection grid to equip it!
              </p>
            )}

            <div className="pt-4 border-t border-gold/20 flex justify-center">
              <Button variant="primary" onClick={() => setDrawResult(null)} className="px-8">
                Praise Master Oogway
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
