package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.MentorFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorFeedbackRepository extends JpaRepository<MentorFeedback, Integer> {
    List<MentorFeedback> findByFeedbackPostIdOrderByCreatedAtAsc(Integer feedbackPostId);
}
