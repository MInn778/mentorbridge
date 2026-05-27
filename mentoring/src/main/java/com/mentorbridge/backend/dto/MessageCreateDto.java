package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.MessageType;
import lombok.Data;

@Data
public class MessageCreateDto {
    private Integer receiverId;
    private String content;
    private MessageType messageType;
    private Integer relatedGroupId;
}
