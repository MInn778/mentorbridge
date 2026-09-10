package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterestRepository extends JpaRepository<Interest, Integer> {
    List<Interest> findByUser_IdOrderByIdAsc(Integer userId);
    void deleteByUser_Id(Integer userId);
}
