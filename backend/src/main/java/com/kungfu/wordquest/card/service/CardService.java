package com.kungfu.wordquest.card.service;

import com.kungfu.wordquest.card.dto.CardDefinitionDto;
import com.kungfu.wordquest.card.dto.CollectionCardDto;
import com.kungfu.wordquest.card.dto.CollectionResponse;
import com.kungfu.wordquest.card.dto.DrawResultDto;
import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final UserCardRepository userCardRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public List<CardDefinitionDto> getAllCards() {
        return cardRepository.findAll().stream()
                .sorted(Comparator.comparing(Card::getId))
                .map(this::toDefinition)
                .toList();
    }

    @Transactional(readOnly = true)
    public CollectionResponse getCollection(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        List<UserCard> owned = userCardRepository.findByUserIdWithCard(userId);
        String equippedId = user.getEquippedCardId();

        List<CollectionCardDto> cards = new ArrayList<>(owned.size());
        for (UserCard uc : owned) {
            Card card = uc.getCard();
            cards.add(CollectionCardDto.builder()
                    .id(card.getId())
                    .owned(true)
                    .quantity(uc.getCount())
                    .equipped(card.getId().equals(equippedId))
                    .chargesRemaining(Math.max(0, uc.getChargesRemaining()))
                    .status(uc.getStatus())
                    .acquiredAt(uc.getAcquiredAt())
                    .definition(toDefinition(card))
                    .build());
        }
        cards.sort(Comparator.comparing(CollectionCardDto::getId));

        return CollectionResponse.builder()
                .cards(cards)
                .equippedCardId(equippedId)
                .build();
    }

    /** @deprecated Prefer {@link #getCollection(UUID)} DTO; kept for internal callers. */
    @Transactional(readOnly = true)
    public List<UserCard> getUserInventory(UUID userId) {
        return userCardRepository.findByUserIdWithCard(userId);
    }

    @Transactional
    public DrawResultDto drawCardChest(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        boolean usedFreeToken = user.getFreeChestTokens() > 0;
        if (usedFreeToken) {
            user.setFreeChestTokens(user.getFreeChestTokens() - 1);
        } else if (user.getCoins() < GameEconomy.CHEST_DRAW_COST) {
            throw new ValidationException(
                    "Insufficient coins. Summon Scroll chest costs " + GameEconomy.CHEST_DRAW_COST + " coins.");
        } else {
            user.setCoins(user.getCoins() - GameEconomy.CHEST_DRAW_COST);
        }

        double roll = random.nextDouble() * 100;
        String rarity;
        if (roll < 60) {
            rarity = "common";
        } else if (roll < 85) {
            rarity = "rare";
        } else if (roll < 97) {
            rarity = "epic";
        } else {
            rarity = "legendary";
        }

        List<Card> candidates = cardRepository.findAll().stream()
                .filter(c -> c.getRarity().equalsIgnoreCase(rarity))
                .toList();
        if (candidates.isEmpty()) {
            candidates = cardRepository.findAll();
        }
        if (candidates.isEmpty()) {
            throw new ResourceNotFoundException(ErrorCode.CARD_NOT_FOUND, "No scrolls available in the catalog.");
        }

        Card card = candidates.get(random.nextInt(candidates.size()));
        UserCard userCard = userCardRepository.findByUserIdAndCardId(userId, card.getId()).orElse(null);

        boolean isDuplicate = userCard != null;
        boolean exhaustedRestore = false;
        int refundAmount = 0;
        int fullCharges = GameEconomy.starTier(card.getStars()).charges();

        if (isDuplicate) {
            userCard.setCount(userCard.getCount() + 1);
            if ("exhausted".equalsIgnoreCase(userCard.getStatus()) || userCard.getChargesRemaining() <= 0) {
                userCard.setChargesRemaining(fullCharges);
                userCard.setStatus("available");
                exhaustedRestore = true;
                refundAmount = 0;
            } else {
                refundAmount = switch (card.getRarity().toLowerCase()) {
                    case "legendary" -> 250;
                    case "epic" -> 100;
                    case "rare" -> 50;
                    default -> 25;
                };
                user.setCoins(user.getCoins() + refundAmount);
            }
            userCardRepository.save(userCard);
        } else {
            userCard = UserCard.builder()
                    .user(user)
                    .card(card)
                    .count(1)
                    .chargesRemaining(fullCharges)
                    .status("available")
                    .build();
            userCardRepository.save(userCard);
            if (user.getStats() != null) {
                user.getStats().setCardsCollected(user.getStats().getCardsCollected() + 1);
            }
        }

        userRepository.save(user);

        return DrawResultDto.builder()
                .card(toDefinition(card))
                .duplicate(isDuplicate)
                .exhaustedRestore(exhaustedRestore)
                .refundAmount(refundAmount)
                .usedFreeToken(usedFreeToken)
                .coinsRemaining(user.getCoins())
                .freeChestTokensRemaining(user.getFreeChestTokens())
                .build();
    }

    @Transactional
    public CollectionResponse equipCard(UUID userId, String cardId) {
        if (cardId == null || cardId.isBlank()) {
            throw new ValidationException("Scroll id is required.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (!cardRepository.existsById(cardId)) {
            throw new ResourceNotFoundException(ErrorCode.CARD_NOT_FOUND, "Scroll not found.");
        }

        UserCard ownership = userCardRepository.findByUserIdAndCardId(userId, cardId)
                .orElseThrow(() -> new ValidationException("Cannot equip a scroll you do not own."));

        if ("exhausted".equalsIgnoreCase(ownership.getStatus()) || ownership.getChargesRemaining() <= 0) {
            throw new ValidationException("Cannot equip an exhausted scroll.");
        }

        // Single equipped card enforced on User.equippedCardId (one field overwrite).
        user.setEquippedCardId(cardId);
        userRepository.save(user);
        return getCollection(userId);
    }

    /**
     * Consumes one charge from the equipped scroll after a successful puzzle clear.
     * Exhausted scrolls are unequipped. Idempotent per call; callers must invoke once per completion.
     */
    @Transactional
    public void consumeEquippedCharge(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        String equippedId = user.getEquippedCardId();
        if (equippedId == null || equippedId.isBlank()) {
            return;
        }

        userCardRepository.findByUserIdAndCardId(userId, equippedId).ifPresent(uc -> {
            int next = Math.max(0, uc.getChargesRemaining() - 1);
            uc.setChargesRemaining(next);
            if (next <= 0) {
                uc.setStatus("exhausted");
                uc.setChargesRemaining(0);
                user.setEquippedCardId(null);
                userRepository.save(user);
            }
            userCardRepository.save(uc);
        });
    }

    private CardDefinitionDto toDefinition(Card card) {
        return CardDefinitionDto.builder()
                .id(card.getId())
                .name(card.getName())
                .rarity(card.getRarity())
                .image(card.getImage())
                .stars(card.getStars())
                .description(card.getDescription())
                .bonuses(card.getBonuses() != null ? card.getBonuses() : List.of())
                .build();
    }
}
