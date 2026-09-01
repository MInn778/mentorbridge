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
public class NoticeDto {
    private Integer id;
    private String authorName;
    private String title;
    private String content;
    private Boolean isPinned;
    private LocalDateTime createdAt;

    @Data
    public static class Request {
        private String title;
        private String content;
        private Boolean isPinned;
    }
}
