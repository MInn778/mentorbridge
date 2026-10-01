package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Integer> {
    List<ChatRoomMember> findByUser_Id(Integer userId);
    List<ChatRoomMember> findByChatRoom_Id(Integer roomId);
    Optional<ChatRoomMember> findByChatRoom_IdAndUser_Id(Integer roomId, Integer userId);
    boolean existsByChatRoom_IdAndUser_Id(Integer roomId, Integer userId);
}
