package com.kungfu.wordquest.card.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class CollectionResponse {
    private List<CollectionCardDto> cards;
    private String equippedCardId;
}
