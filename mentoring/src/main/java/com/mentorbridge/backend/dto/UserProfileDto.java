package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.GoalType;
import com.mentorbridge.backend.model.UserProfileStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Integer profileId;
    private Integer userId;
    private String userName;
    private UserProfileStatus status;
    private String major;
    private String skills;
    private String goal;
    private GoalType goalType;
    private String profileImageUrl;
    private List<StudyGroupDto> participatingGroups;
}
