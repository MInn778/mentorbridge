package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Integer> {
}
