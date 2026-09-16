package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.UserProfile;
import com.mentorbridge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    Optional<UserProfile> findByUser(User user);
    Optional<UserProfile> findByUserId(Integer userId);
}
