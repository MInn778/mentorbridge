package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackPostDto {
    private Integer id;
    private Integer authorId;
    private String authorName;
    private String title;
    private String content;
    private String fileUrl;
    private String aiFeedback;
    private LocalDateTime createdAt;
    private List<MentorFeedbackDto> mentorFeedbacks;
}
