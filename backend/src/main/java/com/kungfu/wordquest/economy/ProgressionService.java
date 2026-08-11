package com.kungfu.wordquest.economy;

import org.springframework.stereotype.Service;

/**
 * Derives belt / rank / XP progress from total XP (authoritative).
 */
@Service
public class ProgressionService {

    public record TrainingProgress(
            String belt,
            String rank,
            int dojoLevel,
            int xp,
            int xpForCurrentBelt,
            int xpForNextBelt,
            int xpProgress,
            int xpProgressPercentage,
            boolean isMaxBelt
    ) {}

    public TrainingProgress resolve(int totalXp) {
        int xp = Math.max(0, totalXp);
        GameEconomy.BeltLevel current = GameEconomy.BELTS[0];
        GameEconomy.BeltLevel next = null;

        for (int i = 0; i < GameEconomy.BELTS.length; i++) {
            if (xp >= GameEconomy.BELTS[i].minXp()) {
                current = GameEconomy.BELTS[i];
                next = i + 1 < GameEconomy.BELTS.length ? GameEconomy.BELTS[i + 1] : null;
            }
        }

        int currentMin = current.minXp();
        boolean max = next == null;
        int nextMin = max ? currentMin : next.minXp();
        int span = Math.max(1, nextMin - currentMin);
        int progress = max ? span : Math.min(span, xp - currentMin);
        int pct = max ? 100 : (int) Math.round(100.0 * progress / span);

        return new TrainingProgress(
                current.belt(),
                current.title(),
                current.dojoLevel(),
                xp,
                currentMin,
                nextMin,
                progress,
                Math.min(100, Math.max(0, pct)),
                max
        );
    }

    public String beltForXp(int xp) {
        return resolve(xp).belt();
    }

    public String titleForXp(int xp) {
        return resolve(xp).rank();
    }

    public int xpNeededForNext(int xp) {
        TrainingProgress p = resolve(xp);
        return p.isMaxBelt() ? p.xp() : p.xpForNextBelt();
    }
}
