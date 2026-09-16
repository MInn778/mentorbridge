package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostReportDto {
    private Integer reportId;
    private Integer postId;
    private String postTitle;
    private Integer reporterId;
    private String reporterName;
    private String reason;
    private ReportStatus status;
    private String processResult;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    @Data
    public static class CreateRequest {
        private String reason;
    }

    @Data
    public static class UpdateRequest {
        private ReportStatus status;
        private String processResult;
    }
}
