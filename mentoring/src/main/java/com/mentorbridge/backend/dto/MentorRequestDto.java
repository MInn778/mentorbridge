package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.RequestStatus;
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
public class MentorRequestDto {
    private Integer requestId;
    private Integer userId;
    private String userName;
    private String userEmail;
    private String selfIntro;
    private String career;
    private String proofUrl;
    private List<String> specs;
    private RequestStatus status;
    private String rejectReason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
}
