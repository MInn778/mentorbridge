package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.StudyGroupDto;
import com.mentorbridge.backend.dto.UserProfileDto;
import com.mentorbridge.backend.model.StudyGroup;
import com.mentorbridge.backend.model.StudyMember;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.model.UserProfile;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserProfileRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final StudyMemberRepository studyMemberRepository;

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(UserProfile.builder().user(user).build());

        return mapToDtoWithGroups(profile, user);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfileByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().user(user).build());

        return mapToDtoWithGroups(profile, user);
    }

    @Transactional
    public UserProfileDto updateProfile(String email, UserProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(UserProfile.builder().user(user).build());

        profile.setStatus(dto.getStatus());
        profile.setMajor(dto.getMajor());
        profile.setSkills(dto.getSkills());
        profile.setGoal(dto.getGoal());
        profile.setGoalType(dto.getGoalType());
        profile.setProfileImageUrl(dto.getProfileImageUrl());

        UserProfile saved = userProfileRepository.save(profile);
        return mapToDtoWithGroups(saved, user);
    }

    private UserProfileDto mapToDtoWithGroups(UserProfile profile, User user) {
        List<StudyGroupDto> groups = studyMemberRepository.findByUserId(user.getId()).stream()
                .map(StudyMember::getStudyGroup)
                .filter(group -> !group.getPost().getIsDeleted())
                .map(this::mapGroupToDto)
                .collect(Collectors.toList());

        return UserProfileDto.builder()
                .profileId(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .userName(profile.getUser() != null ? profile.getUser().getName() : null)
                .role(profile.getUser() != null ? profile.getUser().getRole() : null)
                .status(profile.getStatus())
                .major(profile.getMajor())
                .skills(profile.getSkills())
                .goal(profile.getGoal())
                .goalType(profile.getGoalType())
                .profileImageUrl(profile.getProfileImageUrl())
                .participatingGroups(groups)
                .build();
    }
    
    private StudyGroupDto mapGroupToDto(StudyGroup group) {
        long currentMembers = studyMemberRepository.countByStudyGroupGroupId(group.getGroupId());
        return StudyGroupDto.builder()
                .groupId(group.getGroupId())
                .boardId(group.getPost().getBoardId())
                .leaderId(group.getLeader().getId())
                .leaderName(group.getLeader().getName())
                .groupName(group.getGroupName())
                .maxMembers(group.getMaxMembers())
                .status(group.getStatus())
                .currentMembersCount(currentMembers)
                .createdAt(group.getCreatedAt())
                .build();
    }
}
