package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorFeedbackDto {
    private Integer id;
    private Integer feedbackPostId;
    private Integer mentorId;
    private String mentorName;
    private String content;
    private LocalDateTime createdAt;
}
