package com.kungfu.wordquest.puzzle.engine;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ScoreConfig {

    private int baseWordPoint;

    private int pangramBonus;

    private double streakBonus;

}