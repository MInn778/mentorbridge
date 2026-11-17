package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 정렬/읽음 기준은 created_at이 아니라 id: 서버마다 시간대가 달라(로컬 KST, Render UTC) created_at 순서가 실제 순서와 어긋날 수 있음
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByChatRoom_IdOrderByIdDesc(Integer roomId, Pageable pageable);
    List<ChatMessage> findByChatRoom_IdAndIdLessThanOrderByIdDesc(Integer roomId, Integer beforeId, Pageable pageable);
    Optional<ChatMessage> findFirstByChatRoom_IdOrderByIdDesc(Integer roomId);
    long countByChatRoom_Id(Integer roomId);
    long countByChatRoom_IdAndIdGreaterThan(Integer roomId, Integer messageId);
}
