package com.mentorbridge.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_cache", uniqueConstraints = @UniqueConstraint(columnNames = {"external_job_id", "source"}))
public class JobCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cache_id")
    private Integer id;

    @Column(name = "external_job_id", nullable = false, length = 100)
    private String externalJobId;

    @Column(name = "source", nullable = false, length = 50)
    private String source;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "company", nullable = false, length = 100)
    private String company;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "employment_type", length = 50)
    private String employmentType;

    @Column(name = "job_position", length = 100)
    private String jobPosition;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "original_url", nullable = false, length = 500)
    private String originalUrl;

    @CreationTimestamp
    @Column(name = "fetched_at", updatable = false)
    private LocalDateTime fetchedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
