package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.MessageStatus;
import com.mentorbridge.backend.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Integer id;
    private Integer senderId;
    private String senderName;
    private Integer receiverId;
    private String receiverName;
    private String content;
    private Boolean isRead;
    private MessageType messageType;
    private Integer relatedGroupId;
    private MessageStatus status;
    private LocalDateTime createdAt;
}
