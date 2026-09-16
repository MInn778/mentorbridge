package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.MentorRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorRequestRepository extends JpaRepository<MentorRequest, Integer> {
    List<MentorRequest> findByUserId(Integer userId);
}
