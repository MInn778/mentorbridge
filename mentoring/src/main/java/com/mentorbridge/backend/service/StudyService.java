package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.StudyGroupDto;
import com.mentorbridge.backend.model.Post;
import com.mentorbridge.backend.model.StudyGroup;
import com.mentorbridge.backend.model.StudyGroupStatus;
import com.mentorbridge.backend.model.StudyMember;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.StudyGroupRepository;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<StudyGroupDto> getAllStudyGroups() {
        return studyGroupRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudyGroupDto createStudyGroup(StudyGroupDto.Request request, Integer userId) {
        Post post = postRepository.findById(request.getBoardId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User leader = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudyGroup studyGroup = StudyGroup.builder()
                .post(post)
                .leader(leader)
                .groupName(request.getGroupName())
                .maxMembers(request.getMaxMembers())
                .status(StudyGroupStatus.모집중)
                .build();

        StudyGroup savedGroup = studyGroupRepository.save(studyGroup);

        // Leader is automatically added as a member
        StudyMember studyMember = StudyMember.builder()
                .studyGroup(savedGroup)
                .user(leader)
                .build();
        studyMemberRepository.save(studyMember);

        return convertToDto(savedGroup);
    }

    @Transactional
    public void joinStudyGroup(Integer groupId, Integer userId) {
        StudyGroup group = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Study Group not found"));

        if (group.getStatus() != StudyGroupStatus.모집중) {
            throw new RuntimeException("Study Group is not recruiting");
        }

        long currentMembers = studyMemberRepository.countByStudyGroupGroupId(groupId);
        if (currentMembers >= group.getMaxMembers()) {
            throw new RuntimeException("Study Group is full");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyJoined = studyMemberRepository.findByStudyGroupGroupIdAndUser_Id(groupId, userId).isPresent();
        if (alreadyJoined) {
            throw new RuntimeException("Already joined the group");
        }

        StudyMember newMember = StudyMember.builder()
                .studyGroup(group)
                .user(user)
                .build();
        studyMemberRepository.save(newMember);
    }

    private StudyGroupDto convertToDto(StudyGroup group) {
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
