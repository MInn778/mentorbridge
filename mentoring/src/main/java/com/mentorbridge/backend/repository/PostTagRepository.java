package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, Integer> {
    List<PostTag> findByPostBoardId(Integer boardId);
}
