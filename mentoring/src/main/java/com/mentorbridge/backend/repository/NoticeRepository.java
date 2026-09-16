package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Integer> {
    List<Notice> findAllByOrderByIsPinnedDescCreatedAtDesc();
}
