package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.StudyGroupDto;
import com.mentorbridge.backend.dto.UserProfileDto;
import com.mentorbridge.backend.model.Interest;
import com.mentorbridge.backend.model.StudyGroup;
import com.mentorbridge.backend.model.StudyMember;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.model.UserProfile;
import com.mentorbridge.backend.model.UserProfileStatus;
import com.mentorbridge.backend.repository.InterestRepository;
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
    private final InterestRepository interestRepository;

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

        // user_profile.status는 DB에 NOT NULL이라 값이 없으면 저장 자체가 실패한다.
        // 프로필을 아직 한 번도 저장한 적 없는 사용자가 "현재 상태"를 고르지 않고 저장할 수도 있으므로 기본값을 둔다.
        profile.setStatus(dto.getStatus() != null ? dto.getStatus()
                : profile.getStatus() != null ? profile.getStatus() : UserProfileStatus.학생);
        profile.setMajor(dto.getMajor());
        profile.setSkills(dto.getSkills());
        profile.setGoal(dto.getGoal());
        profile.setGoalType(dto.getGoalType());
        profile.setProfileImageUrl(dto.getProfileImageUrl());

        UserProfile saved = userProfileRepository.save(profile);

        if (dto.getInterests() != null) {
            interestRepository.deleteByUser_Id(user.getId());
            List<Interest> newInterests = dto.getInterests().stream()
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .distinct()
                    .limit(10)
                    .map(tag -> Interest.builder().user(user).tag(tag).build())
                    .collect(Collectors.toList());
            interestRepository.saveAll(newInterests);
        }

        return mapToDtoWithGroups(saved, user);
    }

    private UserProfileDto mapToDtoWithGroups(UserProfile profile, User user) {
        List<StudyGroupDto> groups = studyMemberRepository.findByUserId(user.getId()).stream()
                .map(StudyMember::getStudyGroup)
                .filter(group -> !group.getPost().getIsDeleted())
                .map(this::mapGroupToDto)
                .collect(Collectors.toList());

        List<String> interests = interestRepository.findByUser_IdOrderByIdAsc(user.getId()).stream()
                .map(Interest::getTag)
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
                .interests(interests)
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
