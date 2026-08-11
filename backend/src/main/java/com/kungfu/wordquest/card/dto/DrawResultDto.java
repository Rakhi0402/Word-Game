package com.kungfu.wordquest.card.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DrawResultDto {
    private CardDefinitionDto card;
    private boolean duplicate;
    /** True when a duplicate draw restored an exhausted scroll's charges. */
    private boolean exhaustedRestore;
    private int refundAmount;
    private boolean usedFreeToken;
    private int coinsRemaining;
    private int freeChestTokensRemaining;
}
