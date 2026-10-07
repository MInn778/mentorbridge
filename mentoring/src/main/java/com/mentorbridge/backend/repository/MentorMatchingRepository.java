package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.MatchingStatus;
import com.mentorbridge.backend.model.MentorMatching;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MentorMatchingRepository extends JpaRepository<MentorMatching, Integer> {
    List<MentorMatching> findByMenteeId(Integer menteeId);
    List<MentorMatching> findByMentorId(Integer mentorId);
    boolean existsByMentorIdAndMenteeIdAndStatusIn(Integer mentorId, Integer menteeId, Collection<MatchingStatus> statuses);
}
