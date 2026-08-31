package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.MentorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Integer> {
    Optional<MentorProfile> findByUserId(Integer userId);
}
