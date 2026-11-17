package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.FeedbackPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackPostRepository extends JpaRepository<FeedbackPost, Integer> {
    List<FeedbackPost> findAllByOrderByCreatedAtDesc();
    List<FeedbackPost> findByAuthorIdOrderByCreatedAtDesc(Integer authorId);
    long countByAuthorId(Integer authorId);
    Optional<FeedbackPost> findByFileUrl(String fileUrl);
}
