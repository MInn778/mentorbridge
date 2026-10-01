package com.mentorbridge.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_room")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Integer id;

    // 단체 채팅방 이름. 1:1 채팅방은 null로 두고, 상대방 이름으로 화면에 표시한다.
    @Column(name = "room_name")
    private String name;

    @Column(name = "is_group", nullable = false)
    private Boolean isGroup;

    // 모집 완료된 게시글에서 "단체 채팅방 만들기"로 생성된 방이면 그 게시글 id. 그 외에는 null.
    // 작성자가 버튼을 다시 눌러도 같은 방을 재사용(멱등)하기 위한 키로 쓰인다.
    @Column(name = "related_post_id")
    private Integer relatedPostId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
