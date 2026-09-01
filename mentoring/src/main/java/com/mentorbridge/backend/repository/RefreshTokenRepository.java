package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.RefreshToken;
import com.mentorbridge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    Optional<RefreshToken> findByTokenValue(String tokenValue);
    void deleteByUser(User user);
    void deleteByTokenValue(String tokenValue);
}
