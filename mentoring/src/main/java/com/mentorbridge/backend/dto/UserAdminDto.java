package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDto {
    private Integer userId;
    private String email;
    private String name;
    private Role role;
    private Boolean isSuspended;
    private Boolean isMentorVerified;
    private LocalDateTime joinDate;
}
