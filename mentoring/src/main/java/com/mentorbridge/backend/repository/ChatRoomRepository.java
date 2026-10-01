package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {

    Optional<ChatRoom> findByRelatedPostId(Integer relatedPostId);

    // 두 사용자가 이미 만든 1:1 방이 있는지 찾는다. 1:1 방은 정확히 2명으로만 생성되고
    // 이후 인원이 추가되지 않으므로(ChatService에서 강제) 이 조건만으로 충분하다.
    @Query("SELECT m1.chatRoom FROM ChatRoomMember m1 JOIN ChatRoomMember m2 " +
            "ON m1.chatRoom = m2.chatRoom " +
            "WHERE m1.chatRoom.isGroup = false AND m1.user.id = :userId1 AND m2.user.id = :userId2")
    List<ChatRoom> findDirectRoomBetween(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);
}
