package com.kungfu.wordquest.card.entity;

import com.kungfu.wordquest.common.StringListConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "cards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Card {

    @Id
    private String id; // e.g. "po_common"

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String rarity; // common, rare, epic, legendary

    @Column(nullable = false)
    private String image;

    private int stars;

    private String description;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> bonuses;
}
