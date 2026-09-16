package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDto {
    private Integer cacheId;
    private String externalJobId;
    private String source;
    private String title;
    private String company;
    private String location;
    private String employmentType;
    private String jobPosition;
    private LocalDate deadline;
    private String originalUrl;
    private boolean bookmarked;
}
