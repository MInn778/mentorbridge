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
public class BookmarkDto {
    private Integer bookmarkId;
    private String externalJobId;
    private String jobTitle;
    private String originalUrl;
    private String source;
    private LocalDateTime savedAt;
}
