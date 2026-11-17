package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.FeedbackFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackFileRepository extends JpaRepository<FeedbackFile, String> {
}
