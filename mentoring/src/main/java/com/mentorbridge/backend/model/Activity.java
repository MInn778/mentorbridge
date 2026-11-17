package com.mentorbridge.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 공모전 & 활동 게시물. 멘토/관리자가 직접 등록하거나 KoccaActivitySync가 콘진원 API에서 가져온다. 삭제는 관리자만. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "activity")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "activity_id")
    private Integer id;

    // 직접 등록한 글만 작성자가 있고, 외부 API에서 가져온 글은 null (source로 출처 표시)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    // 외부 출처 (예: "한국콘텐츠진흥원"). 직접 등록한 글은 null
    @Column(length = 50)
    private String source;

    // 외부 출처의 원본 ID (사업번호). source와 함께 중복 저장 방지용
    @Column(length = 100)
    private String externalId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 100)
    private String organizer;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(length = 200)
    private String reward;

    @Column(length = 500)
    private String link;

    // 쉼표로 구분한 태그 (예: "공모전,AI,기획")
    @Column(length = 200)
    private String tags;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
