package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.JobCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobCacheRepository extends JpaRepository<JobCache, Integer> {
    List<JobCache> findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCase(String title, String company);
    Optional<JobCache> findByExternalJobIdAndSource(String externalJobId, String source);
    void deleteBySource(String source);
}
