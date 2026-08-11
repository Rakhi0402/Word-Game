package com.kungfu.wordquest.card.entity;

import com.kungfu.wordquest.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_cards", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "card_id"})
})
@Check(constraints = "charges_remaining >= 0 AND count >= 0")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(nullable = false)
    private int count;

    /** Remaining equip uses before exhausted (star-tier charges). */
    @Builder.Default
    @ColumnDefault("5")
    @Column(name = "charges_remaining", nullable = false)
    private int chargesRemaining = 5;

    @Builder.Default
    @ColumnDefault("'available'")
    @Column(nullable = false, length = 20)
    private String status = "available";

    @Column(name = "acquired_at", nullable = false)
    private LocalDateTime acquiredAt;

    @PrePersist
    protected void onCreate() {
        acquiredAt = LocalDateTime.now();
    }
}
