package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.MatchingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorMatchingDto {
    private Integer matchingId;
    private String myRole; // "MENTEE" 또는 "MENTOR" — 이 매칭에서 내가 어느 쪽인지
    private Integer otherPartyUserId;
    private String otherPartyName;
    private MatchingStatus status;
    private LocalDateTime createdAt;
}
