package com.kungfu.wordquest.reward.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {

    @Id
    private String id; // e.g. "first_word"

    @Column(nullable = false)
    private String title;

    private String description;

    private int target;

    @Column(name = "reward_xp")
    private int rewardXp;

    @Column(name = "reward_coins")
    private int rewardCoins;

    @Column(name = "icon_name")
    private String iconName;
}
