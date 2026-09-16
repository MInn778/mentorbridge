package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Bookmark;
import com.mentorbridge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Integer> {
    List<Bookmark> findByUser(User user);
    Optional<Bookmark> findByUserAndExternalJobId(User user, String externalJobId);
    boolean existsByUserAndExternalJobId(User user, String externalJobId);
    void deleteByUserAndExternalJobId(User user, String externalJobId);
}
