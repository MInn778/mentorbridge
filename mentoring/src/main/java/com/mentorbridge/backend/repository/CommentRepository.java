package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    List<Comment> findByPostBoardIdAndIsDeletedFalse(Integer boardId);
    long countByPostBoardIdAndIsDeletedFalse(Integer boardId);
}
