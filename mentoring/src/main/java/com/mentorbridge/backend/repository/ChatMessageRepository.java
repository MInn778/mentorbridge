package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByChatRoom_IdOrderByCreatedAtDesc(Integer roomId, Pageable pageable);
    List<ChatMessage> findByChatRoom_IdAndIdLessThanOrderByCreatedAtDesc(Integer roomId, Integer beforeId, Pageable pageable);
    Optional<ChatMessage> findFirstByChatRoom_IdOrderByCreatedAtDesc(Integer roomId);
    long countByChatRoom_Id(Integer roomId);
    long countByChatRoom_IdAndIdGreaterThan(Integer roomId, Integer messageId);
}
