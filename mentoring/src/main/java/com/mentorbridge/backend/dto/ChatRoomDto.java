package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDto {
    private Integer id;
    // 단체 채팅방이면 방 이름, 1:1 채팅방이면 상대방 이름
    private String name;
    private Boolean isGroup;
    private List<ChatParticipantDto> participants;
    private ChatMessageDto lastMessage;
    private int unreadCount;
    private LocalDateTime createdAt;
}
