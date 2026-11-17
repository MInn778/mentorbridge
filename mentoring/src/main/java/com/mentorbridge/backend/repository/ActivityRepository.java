package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    List<Activity> findAllByOrderByCreatedAtDesc();

    Optional<Activity> findBySourceAndExternalId(String source, String externalId);

    @Transactional
    long deleteBySourceAndEndDateBefore(String source, LocalDate date);
}
