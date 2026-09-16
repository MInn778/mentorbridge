package com.mentorbridge.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mentor_matching")
public class MentorMatching {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "matching_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "mentor_id", referencedColumnName = "mentor_id", nullable = false)
    private MentorProfile mentor;

    @ManyToOne
    @JoinColumn(name = "mentee_id", referencedColumnName = "user_id", nullable = false)
    private User mentee;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MatchingStatus status = MatchingStatus.REQUESTED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
