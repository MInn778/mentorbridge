package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.StudyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyMemberRepository extends JpaRepository<StudyMember, Integer> {
    List<StudyMember> findByStudyGroupGroupId(Integer groupId);
    Optional<StudyMember> findByStudyGroupGroupIdAndUser_Id(Integer groupId, Integer userId);
    long countByStudyGroupGroupId(Integer groupId);
    List<StudyMember> findByUserId(Integer userId);
}
