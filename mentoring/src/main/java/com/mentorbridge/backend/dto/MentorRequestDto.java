package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRequestDto {
    private Integer requestId;
    private Integer userId;
    private String selfIntro;
    private String career;
    private String proofUrl;
    private RequestStatus status;
    private LocalDateTime requestedAt;
}
