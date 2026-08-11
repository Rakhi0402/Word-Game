package com.kungfu.wordquest.card.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class CollectionCardDto {
    private String id;
    private boolean owned;
    private int quantity;
    private boolean equipped;
    private int chargesRemaining;
    private String status;
    private LocalDateTime acquiredAt;
    /** Static definition resolved from the Card catalog (optional enrichment). */
    private CardDefinitionDto definition;
}
