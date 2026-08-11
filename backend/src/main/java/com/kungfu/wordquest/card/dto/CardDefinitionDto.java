package com.kungfu.wordquest.card.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class CardDefinitionDto {
    private String id;
    private String name;
    private String rarity;
    private String image;
    private int stars;
    private String description;
    private List<String> bonuses;
}
