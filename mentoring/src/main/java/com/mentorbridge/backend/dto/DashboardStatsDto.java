package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long studyCount;
    private long mentoringCount;
    private long feedbackCount;
    private long bookmarkCount;
}
