package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Integer id;
    private Integer roomId;
    private Integer senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private LocalDateTime createdAt;
}
